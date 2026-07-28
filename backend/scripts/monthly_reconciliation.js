require('dotenv').config();
const prisma = require('../src/utils/prisma');

async function generateMonthlyReconciliation() {
  console.log("=========================================");
  console.log("   MONTHLY RECONCILIATION SUMMARY");
  console.log("=========================================\n");

  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
  
  console.log(`Period: ${startOfMonth.toLocaleDateString()} to ${endOfMonth.toLocaleDateString()}`);

  try {
    // Total Disbursed this month (CASH_OUT, DISBURSEMENT)
    const disbursements = await prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'CASH_OUT',
        category: 'DISBURSEMENT',
        transaction_date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    // Total Collected this month (CASH_IN, COLLECTION)
    const collections = await prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'CASH_IN',
        category: 'COLLECTION',
        transaction_date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    // Total Savings Deposited
    const savingsDeposits = await prisma.cashTransaction.aggregate({
      _sum: { amount: true },
      where: {
        type: 'CASH_IN',
        category: 'SAVINGS_DEPOSIT',
        transaction_date: { gte: startOfMonth, lte: endOfMonth }
      }
    });

    console.log(`Total Loan Disbursed: ৳${disbursements._sum.amount || 0}`);
    console.log(`Total Loan Collected: ৳${collections._sum.amount || 0}`);
    console.log(`Total Savings Deposited: ৳${savingsDeposits._sum.amount || 0}`);

    // Total Outstanding (All time, active loans)
    const allLoans = await prisma.loan.findMany({
      where: { status: 'DISBURSED' },
      include: {
        schedules: {
          where: { status: { in: ['PENDING', 'OVERDUE'] } }
        }
      }
    });

    let totalOutstanding = 0;
    for (const loan of allLoans) {
      for (const schedule of loan.schedules) {
        totalOutstanding += parseFloat(schedule.total_due);
      }
    }

    console.log(`\nTotal Active Outstanding: ৳${totalOutstanding.toFixed(2)}`);

  } catch (err) {
    console.error("Error generating reconciliation:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n=========================================");
  }
}

generateMonthlyReconciliation();
