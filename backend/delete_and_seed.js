require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { hashPassword } = require('./src/utils/hashPassword');

async function main() {
  console.log("=== Phase 0: Go-Live Deletion & Seeding ===");

  // DELETION
  console.log("\nDeleting old data...");
  await prisma.auditLog.deleteMany({});
  await prisma.loanRepayment.deleteMany({});
  await prisma.loanInstallmentSchedule.deleteMany({});
  await prisma.loan.deleteMany({});
  await prisma.savingsTransaction.deleteMany({});
  await prisma.savingsAccount.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.group.deleteMany({});
  await prisma.center.deleteMany({});
  await prisma.cashTransaction.deleteMany({});
  // Delete all users EXCEPT DEMO
  await prisma.user.deleteMany({
    where: {
      role: { not: 'DEMO' }
    }
  });
  await prisma.branch.deleteMany({});
  await prisma.loanProduct.deleteMany({});
  
  console.log("Old data deleted successfully.");

  // SEEDING
  console.log("\nSeeding new data...");
  const defaultPassword = await hashPassword('Welcome123!');

  // Branch
  const branch = await prisma.branch.create({
    data: {
      name: 'Dhaka Mirpur Branch',
      address: 'Dhaka, Bangladesh'
    }
  });
  console.log(`Created Branch: ${branch.name}`);

  // Centers
  const mirpurCenter = await prisma.center.create({
    data: {
      name: 'Mirpur-10 Center',
      branch_id: branch.id,
      meeting_day: 'SUNDAY'
    }
  });
  const kaziparaCenter = await prisma.center.create({
    data: {
      name: 'Kazipara Center',
      branch_id: branch.id,
      meeting_day: 'TUESDAY'
    }
  });
  console.log(`Created Centers: ${mirpurCenter.name}, ${kaziparaCenter.name}`);

  // Groups
  await prisma.group.create({
    data: {
      name: 'Mirpur Mohila Somiti-1',
      center_id: mirpurCenter.id
    }
  });
  await prisma.group.create({
    data: {
      name: 'Kazipara Mohila Somiti-1',
      center_id: kaziparaCenter.id
    }
  });
  console.log(`Created Groups`);

  // Staff (Admin, BM, FOs)
  await prisma.user.create({
    data: {
      name: 'System Admin',
      phone: '01700000000',
      email: 'admin@mfi.local',
      password_hash: defaultPassword,
      role: 'ADMIN',
      branch_id: branch.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'মোঃ রফিকুল ইসলাম',
      phone: '01711000001',
      email: 'bm1@mfi.local',
      password_hash: defaultPassword,
      role: 'BRANCH_MANAGER',
      branch_id: branch.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'সালমা আক্তার',
      phone: '01711000002',
      email: 'fo1@mfi.local',
      password_hash: defaultPassword,
      role: 'FIELD_OFFICER',
      branch_id: branch.id
    }
  });

  await prisma.user.create({
    data: {
      name: 'করিম উদ্দিন',
      phone: '01711000003',
      email: 'fo2@mfi.local',
      password_hash: defaultPassword,
      role: 'FIELD_OFFICER',
      branch_id: branch.id
    }
  });
  console.log(`Created Staff: Admin, 1 BM, 2 FOs`);

  // Loan Product
  await prisma.loanProduct.create({
    data: {
      name: 'সাপ্তাহিক ঋণ (Standard Weekly Loan)',
      interest_rate: 12.5,
      interest_method: 'FLAT',
      default_term_weeks: 46
    }
  });
  console.log(`Created Loan Product`);

  // Final Row Counts
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

  console.log("\n=== Final DB Row Counts ===");
  for (const [table, count] of Object.entries(counts)) {
    console.log(`${table}: ${count} rows`);
  }
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
