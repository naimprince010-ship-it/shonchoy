require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
  const counts = {
    AuditLog: await prisma.auditLog.count(),
    LoanRepayment: await prisma.loanRepayment.count(),
    LoanInstallmentSchedule: await prisma.loanInstallmentSchedule.count(),
    Loan: await prisma.loan.count(),
    SavingsTransaction: await prisma.savingsTransaction.count(),
    SavingsAccount: await prisma.savingsAccount.count(),
    Client: await prisma.client.count(),
    Group: await prisma.group.count(),
    Center: await prisma.center.count(),
    User: await prisma.user.count(),
    Branch: await prisma.branch.count(),
    LoanProduct: await prisma.loanProduct.count(),
    SystemSetting: await prisma.systemSetting.count()
  };

  console.log("\n=== DB Row Counts to Delete ===");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table}: ${count} rows`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
