const prisma = require('../utils/prisma');
const { generateInstallmentSchedule } = require('../services/loanCalculationService');

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

    return res.json({ message: 'Loan disbursed successfully', data: finalLoan });
  } catch (err) {
    console.error('Error disbursing loan:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

module.exports = { createLoanApplication, approveLoan, getLoanById, disburseLoan };
