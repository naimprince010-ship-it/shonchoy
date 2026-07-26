const prisma = require('../utils/prisma');
const { logActivity } = require('../utils/auditLogger');
const { generateInstallmentSchedule } = require('../services/loanCalculationService');
const { sendSMS } = require('../services/smsService');

async function createLoanApplication(req, res) {
  try {
    const { client_id, loan_product_id, principal_amount, interest_rate, term_weeks } = req.body;

    if (!client_id || !loan_product_id || !principal_amount) {
      return res.status(400).json({ error: 'client_id, loan_product_id, and principal_amount are required.' });
    }

    // Validate client exists
    const client = await prisma.client.findUnique({ where: { id: parseInt(client_id, 10) } });
    if (!client) {
      return res.status(404).json({ error: 'Client not found.' });
    }

    // Validate loan product exists and get defaults if missing
    const product = await prisma.loanProduct.findUnique({ where: { id: parseInt(loan_product_id, 10) } });
    if (!product) {
      return res.status(404).json({ error: 'Loan product not found.' });
    }

    const finalInterestRate = interest_rate !== undefined ? interest_rate : product.interest_rate;
    const finalTermWeeks = term_weeks !== undefined ? term_weeks : product.default_term_weeks;
    const interest_method = product.interest_method;

    const loan = await prisma.loan.create({
      data: {
        client_id: parseInt(client_id, 10),
        loan_product_id: parseInt(loan_product_id, 10),
        principal_amount,
        interest_rate: finalInterestRate,
        interest_method,
        term_weeks: finalTermWeeks,
        status: 'PENDING',
      },
    });

    return res.status(201).json({ message: 'Loan application created successfully', data: loan });
  } catch (err) {
    console.error('Error creating loan application:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function approveLoan(req, res) {
  try {
    const { id } = req.params;
    const approved_by = req.user.id; // comes from authMiddleware

    const loan = await prisma.loan.findUnique({ where: { id: parseInt(id, 10) } });
    
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (loan.status !== 'PENDING') {
      return res.status(400).json({ error: `Loan cannot be approved because it is currently ${loan.status}.` });
    }

    const updatedLoan = await prisma.loan.update({
      where: { id: loan.id },
      data: {
        status: 'APPROVED',
        approved_by,
      },
    });

    await logActivity(req.user.id, req.user.name, 'LOAN_APPROVED', 'Loan', loan.id);

    return res.json({ message: 'Loan approved successfully', data: updatedLoan });
  } catch (err) {
    console.error('Error approving loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getLoanById(req, res) {
  try {
    const { id } = req.params;
    const loan = await prisma.loan.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        client: true,
        loan_product: true,
        approver: {
          select: { id: true, name: true, role: true }
        },
        schedules: {
          orderBy: { installment_number: 'asc' },
          include: {
            repayments: true
          }
        }
      }
    });

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    return res.json(loan);
  } catch (err) {
    console.error('Error fetching loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getAllLoans(req, res) {
  try {
    const { status } = req.query;
    let whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const loans = await prisma.loan.findMany({
      where: whereClause,
      include: {
        client: true,
        loan_product: true
      },
      orderBy: { id: 'desc' }
    });

    return res.json(loans);
  } catch (err) {
    console.error('Error fetching all loans:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getLoanProducts(req, res) {
  try {
    const products = await prisma.loanProduct.findMany();
    return res.json(products);
  } catch (err) {
    console.error('Error fetching loan products:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function disburseLoan(req, res) {
  try {
    const { id } = req.params;
    const { disbursement_date } = req.body;
    const recorded_by = req.user.id;

    // Fetch the loan
    const loan = await prisma.loan.findUnique({ where: { id: parseInt(id, 10) } });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }

    if (loan.status !== 'APPROVED') {
      return res.status(400).json({ error: `Loan cannot be disbursed because its status is ${loan.status}. Only APPROVED loans can be disbursed.` });
    }

    const actualDisbursementDate = disbursement_date ? new Date(disbursement_date) : new Date();

    // Prepare loan for calculation (using the newly set disbursement date)
    const loanForCalc = { ...loan, disbursement_date: actualDisbursementDate };
    
    // Generate schedule
    const schedule = generateInstallmentSchedule(loanForCalc);

    // Map to Prisma expected format
    const scheduleData = schedule.map(s => ({
      installment_number: s.installment_number,
      due_date: s.due_date,
      principal_due: s.principal_due,
      interest_due: s.interest_due,
      total_due: s.total_due,
      status: 'PENDING'
    }));

    // Perform database transaction
    const [updatedLoan, createdSchedules, cashTransaction] = await prisma.$transaction([
      // 1. Update Loan status
      prisma.loan.update({
        where: { id: loan.id },
        data: {
          status: 'DISBURSED',
          disbursement_date: actualDisbursementDate
        },
        include: {
          schedules: true,
          client: true,
          loan_product: true
        }
      }),
      // 2. Create schedules (Prisma handles bulk insert using createMany under the hood for nested writes if we did it inside the update, 
      // but let's do it directly on LoanInstallmentSchedule to easily use createMany)
      prisma.loanInstallmentSchedule.createMany({
        data: scheduleData.map(s => ({ ...s, loan_id: loan.id }))
      }),
      // 3. Create CashTransaction
      prisma.cashTransaction.create({
        data: {
          type: 'CASH_OUT',
          category: 'DISBURSEMENT',
          amount: loan.principal_amount,
          related_loan_id: loan.id,
          recorded_by,
          transaction_date: actualDisbursementDate
        }
      })
    ]);

    // Re-fetch the loan to get the inserted schedules (since createMany doesn't return the inserted records)
    const finalLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: {
        schedules: {
          orderBy: { installment_number: 'asc' }
        },
        client: true,
        loan_product: true
      }
    });

    // --- Send Disbursement SMS ---
    // The SMS is sent *after* the main transaction succeeds. Any errors are caught within sendSMS.
    if (finalLoan.client && finalLoan.client.phone) {
      const message = `প্রিয় গ্রাহক, আপনার ${loan.principal_amount} টাকার ঋণ সফলভাবে বিতরণ করা হয়েছে। - MFI System`;
      // Don't await to avoid blocking the API response, or await it if preferred.
      // Since it has its own try/catch, we can just call it asynchronously.
      sendSMS(finalLoan.client.phone, message);
    }

    await logActivity(req.user.id, req.user.name, 'LOAN_DISBURSED', 'Loan', loan.id);

    return res.json({ message: 'Loan disbursed successfully', data: finalLoan });
  } catch (err) {
    console.error('Error disbursing loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function addRepayment(req, res) {
  try {
    const { id } = req.params;
    const { installment_schedule_id, amount_paid } = req.body;
    const recorded_by = req.user.id;
    const paymentAmount = parseFloat(amount_paid);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({ error: 'Valid positive amount_paid is required.' });
    }

    // 1. Fetch Loan and validate status
    const loan = await prisma.loan.findUnique({ 
      where: { id: parseInt(id, 10) },
      include: { schedules: true }
    });
    if (!loan) {
      return res.status(404).json({ error: 'Loan not found.' });
    }
    if (loan.status !== 'DISBURSED') {
      return res.status(400).json({ error: `Repayment can only be made for DISBURSED loans. Current status is ${loan.status}.` });
    }

    // 2. Fetch Installment Schedule
    const schedule = await prisma.loanInstallmentSchedule.findUnique({
      where: { id: parseInt(installment_schedule_id, 10) },
      include: {
        repayments: true
      }
    });

    if (!schedule || schedule.loan_id !== loan.id) {
      return res.status(400).json({ error: 'Invalid installment schedule ID for this loan.' });
    }

    // 3. Calculate total paid so far
    let totalPaidSoFar = 0;
    for (const rep of schedule.repayments) {
      totalPaidSoFar += parseFloat(rep.amount_paid);
    }

    const totalDue = parseFloat(schedule.total_due);
    const remainingDue = totalDue - totalPaidSoFar;

    // Check for overpayment
    if (paymentAmount > remainingDue) {
      return res.status(400).json({ 
        error: `Overpayment detected. The remaining due for this installment is ${remainingDue.toFixed(2)}. Please pay this exact amount and apply the rest to the next installment.` 
      });
    }

    // Determine new status
    const newTotalPaid = totalPaidSoFar + paymentAmount;
    const newStatus = newTotalPaid >= totalDue ? 'PAID' : 'PENDING';

    // Check if the entire loan is fully paid
    const isThisInstallmentNowPaid = newStatus === 'PAID';
    const otherInstallments = loan.schedules.filter(s => s.id !== schedule.id);
    const areOtherInstallmentsPaid = otherInstallments.every(s => s.status === 'PAID');
    const isLoanFullyPaid = isThisInstallmentNowPaid && areOtherInstallmentsPaid;

    // 4. Perform Transaction
    const transactionDate = new Date();
    
    const transactionOperations = [
      // A. Create Repayment
      prisma.loanRepayment.create({
        data: {
          loan_id: loan.id,
          installment_schedule_id: schedule.id,
          amount_paid: paymentAmount,
          payment_date: transactionDate,
          recorded_by
        }
      }),
      // B. Update Schedule Status
      prisma.loanInstallmentSchedule.update({
        where: { id: schedule.id },
        data: {
          status: newStatus
        }
      }),
      // C. Create CashTransaction
      prisma.cashTransaction.create({
        data: {
          type: 'CASH_IN',
          category: 'COLLECTION',
          amount: paymentAmount,
          related_loan_id: loan.id,
          recorded_by,
          transaction_date: transactionDate
        }
      })
    ];

    // D. Update Loan Status to CLOSED if fully paid
    if (isLoanFullyPaid) {
      transactionOperations.push(
        prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'CLOSED' }
        })
      );
    }

    const transactionResults = await prisma.$transaction(transactionOperations);
    const repayment = transactionResults[0];
    const updatedSchedule = transactionResults[1];

    // --- Send Repayment SMS ---
    // The SMS is sent *after* the main transaction succeeds. Any errors are caught within sendSMS.
    if (loan.client_id) {
      // We need the client's phone number, so let's fetch it, since it wasn't fetched initially in `loan`.
      const client = await prisma.client.findUnique({ where: { id: loan.client_id } });
      if (client && client.phone) {
        const message = `প্রিয় গ্রাহক, আপনার ${paymentAmount} টাকার কিস্তি সফলভাবে জমা হয়েছে। ধন্যবাদ। - MFI System`;
        sendSMS(client.phone, message);
      }
    }

    await logActivity(req.user.id, req.user.name, 'REPAYMENT_ADDED', 'Loan', loan.id, { amount: paymentAmount });

    return res.json({
      message: 'Repayment added successfully.',
      data: {
        repayment,
        installment_status: updatedSchedule.status,
        total_paid_for_installment: newTotalPaid,
        total_due: totalDue
      }
    });
  } catch (err) {
    console.error('Error adding repayment:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

async function getOverdueLoans(req, res) {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;
    const today = new Date();

    const { buildRoleFilter } = require('../utils/roleHelper');
    const scheduleFilter = await buildRoleFilter(userId, userRole, 'schedule');

    // Base query: due date is in the past, status is PENDING
    const whereClause = {
      ...scheduleFilter,
      due_date: {
        lt: today
      },
      status: 'PENDING'
    };

    const overdueInstallments = await prisma.loanInstallmentSchedule.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            client: {
              include: {
                group: {
                  include: {
                    center: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        due_date: 'asc'
      }
    });

    // Format the response and calculate days overdue
    const formattedData = overdueInstallments.map(inst => {
      const msInDay = 24 * 60 * 60 * 1000;
      const diffMs = today.getTime() - new Date(inst.due_date).getTime();
      const daysOverdue = Math.floor(diffMs / msInDay);

      return {
        installment_schedule_id: inst.id,
        loan_id: inst.loan_id,
        installment_number: inst.installment_number,
        due_date: inst.due_date,
        total_due: inst.total_due,
        days_overdue: daysOverdue,
        client_name: inst.loan.client.name,
        phone: inst.loan.client.phone,
        group_name: inst.loan.client.group.name,
        center_name: inst.loan.client.group.center.name
      };
    });

    return res.json({ data: formattedData });
  } catch (err) {
    console.error('Error fetching overdue loans:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

/**
 * PUT /api/loans/:id/writeoff
 * Body: { reason }
 */
async function writeOffLoan(req, res) {
  try {
    const loanId = parseInt(req.params.id, 10);
    const { reason } = req.body;
    
    if (!reason || reason.trim().length < 5) {
      return res.status(400).json({ error: 'A valid reason (at least 5 characters) is required for write-off.' });
    }

    // Must be admin, though route middleware already checks this
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can write-off loans.' });
    }

    const loan = await prisma.loan.findUnique({
      where: { id: loanId }
    });

    if (!loan) return res.status(404).json({ error: 'Loan not found.' });

    if (loan.status !== 'DISBURSED') {
      return res.status(400).json({ error: 'Only DISBURSED loans can be written off.' });
    }

    // Execute atomic write-off
    const updatedLoan = await prisma.loan.update({
      where: { id: loanId },
      data: {
        status: 'DEFAULTED',
        writeoff_reason: reason.trim(),
        writeoff_date: new Date(),
        writeoff_by: req.user.id
      }
    });

    await logActivity(req.user.id, req.user.name, 'LOAN_WRITTEN_OFF', 'Loan', loan.id, {
      reason: reason.trim(),
      principal_amount: parseFloat(loan.principal_amount)
    });

    return res.json({ message: 'Loan has been written off successfully.', data: updatedLoan });
  } catch (err) {
    console.error('Error writing off loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { createLoanApplication, approveLoan, getLoanById, disburseLoan, addRepayment, getOverdueLoans, writeOffLoan, getAllLoans, getLoanProducts };
