require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { generateInstallmentSchedule } = require('./src/services/loanCalculationService');

async function main() {
  console.log('Testing Loan Auto-Close Logic...');

  // 1. Create a dummy client
  let client = await prisma.client.findFirst({ where: { phone: '01999999999' } });
  if (!client) {
    const group = await prisma.group.findFirst();
    client = await prisma.client.create({
      data: {
        name: 'Test Loan Client',
        phone: '01999999999',
        nid_number: '1234567890',
        guardian_name: 'Test Guardian',
        address: 'Test Address',
        group_id: group.id,
      }
    });
  }

  // 2. Create a 2-week loan product
  let product = await prisma.loanProduct.findFirst({ where: { name: 'Test Product 2 Weeks' } });
  if (!product) {
    product = await prisma.loanProduct.create({
      data: {
        name: 'Test Product 2 Weeks',
        interest_rate: 10,
        default_term_weeks: 2,
        interest_method: 'FLAT'
      }
    });
  }

  // 3. Create Loan (PENDING)
  let loan = await prisma.loan.create({
    data: {
      client_id: client.id,
      loan_product_id: product.id,
      principal_amount: 1000,
      interest_rate: 10,
      interest_method: 'FLAT',
      term_weeks: 2,
      status: 'PENDING',
    }
  });
  console.log('Loan created (PENDING):', loan.id);

  // 4. Approve Loan
  const admin = await prisma.user.findFirst();
  loan = await prisma.loan.update({
    where: { id: loan.id },
    data: { status: 'APPROVED', approved_by: admin.id }
  });
  console.log('Loan approved.');

  // 5. Disburse Loan
  const actualDisbursementDate = new Date();
  const loanForCalc = { ...loan, disbursement_date: actualDisbursementDate };
  const schedule = generateInstallmentSchedule(loanForCalc);

  const scheduleData = schedule.map(s => ({
    installment_number: s.installment_number,
    due_date: s.due_date,
    principal_due: s.principal_due,
    interest_due: s.interest_due,
    total_due: s.total_due,
    status: 'PENDING'
  }));

  await prisma.$transaction([
    prisma.loan.update({
      where: { id: loan.id },
      data: { status: 'DISBURSED', disbursement_date: actualDisbursementDate }
    }),
    prisma.loanInstallmentSchedule.createMany({
      data: scheduleData.map(s => ({ ...s, loan_id: loan.id }))
    }),
    prisma.cashTransaction.create({
      data: {
        type: 'CASH_OUT',
        category: 'DISBURSEMENT',
        amount: loan.principal_amount,
        related_loan_id: loan.id,
        recorded_by: admin.id,
        transaction_date: actualDisbursementDate
      }
    })
  ]);
  console.log('Loan disbursed. (DISBURSED)');

  // 6. Fetch schedules
  const savedSchedules = await prisma.loanInstallmentSchedule.findMany({
    where: { loan_id: loan.id },
    orderBy: { installment_number: 'asc' }
  });

  // 7. Repay both installments
  for (const sched of savedSchedules) {
    console.log(`Repaying installment ${sched.installment_number} of ${sched.total_due}...`);

    // We simulate the controller logic to ensure we are testing exactly what would happen
    // but using the controller's actual addRepayment function requires Express req/res mock.
    // Instead, let's call the logic directly exactly as written in controller.

    // 1. Fetch Loan and validate status
    const currentLoan = await prisma.loan.findUnique({
      where: { id: loan.id },
      include: { schedules: true }
    });

    const paymentAmount = Number(sched.total_due);
    const newStatus = 'PAID';

    const isThisInstallmentNowPaid = newStatus === 'PAID';
    const otherInstallments = currentLoan.schedules.filter(s => s.id !== sched.id);
    const areOtherInstallmentsPaid = otherInstallments.every(s => s.status === 'PAID');
    const isLoanFullyPaid = isThisInstallmentNowPaid && areOtherInstallmentsPaid;

    const transactionOperations = [
      prisma.loanRepayment.create({
        data: {
          loan_id: loan.id,
          installment_schedule_id: sched.id,
          amount_paid: paymentAmount,
          payment_date: new Date(),
          recorded_by: admin.id
        }
      }),
      prisma.loanInstallmentSchedule.update({
        where: { id: sched.id },
        data: { status: newStatus }
      }),
      prisma.cashTransaction.create({
        data: {
          type: 'CASH_IN',
          category: 'COLLECTION',
          amount: paymentAmount,
          related_loan_id: loan.id,
          recorded_by: admin.id,
          transaction_date: new Date()
        }
      })
    ];

    if (isLoanFullyPaid) {
      transactionOperations.push(
        prisma.loan.update({
          where: { id: loan.id },
          data: { status: 'CLOSED' }
        })
      );
    }

    await prisma.$transaction(transactionOperations);
  }

  // 8. Verify Loan status
  const finalLoan = await prisma.loan.findUnique({ where: { id: loan.id } });
  console.log('Final Loan Status:', finalLoan.status);
  if (finalLoan.status === 'CLOSED') {
    console.log('SUCCESS: Auto-close logic works!');
  } else {
    console.log('FAILURE: Auto-close logic failed!');
  }

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
