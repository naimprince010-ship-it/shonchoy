require('dotenv').config();
const prisma = require('../src/utils/prisma');
const { hashPassword } = require('../src/utils/hashPassword');

async function main() {
  console.log('Seeding database...');

  // Create a default Branch first (required for User)
  const branch = await prisma.branch.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'প্রধান শাখা',
      address: 'ঢাকা, বাংলাদেশ',
    },
  });
  console.log('Branch created:', branch.name);

  // Create default ADMIN user
  const hashedPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { phone: '01700000000' },
    update: {},
    create: {
      name: 'System Admin',
      phone: '01700000000',
      email: 'admin@mfi.local',
      password_hash: hashedPassword,
      role: 'ADMIN',
      branch_id: branch.id,
    },
  });
  console.log('Admin user created:', admin.name, '| Phone:', admin.phone);

  // Create FIELD_OFFICER user
  const officerPassword = await hashPassword('officer123');
  const officer = await prisma.user.upsert({
    where: { phone: '01700000001' },
    update: {},
    create: {
      name: 'Field Officer 1',
      phone: '01700000001',
      email: 'officer@mfi.local',
      password_hash: officerPassword,
      role: 'FIELD_OFFICER',
      branch_id: branch.id,
    },
  });
  console.log('Field Officer created:', officer.name, '| Phone:', officer.phone);

  // Create a default LoanProduct for testing later
  const loanProduct = await prisma.loanProduct.upsert({
    where: { id: 1 },
    update: {
      name: 'Standard Weekly Loan',
      interest_rate: 10.0,
      interest_method: 'FLAT',
      default_term_weeks: 52,
    },
    create: {
      name: 'Standard Weekly Loan',
      interest_rate: 10.0,
      interest_method: 'FLAT',
      default_term_weeks: 52,
    },
  });
  console.log('Loan product created:', loanProduct.name);

  // Create default DEMO user
  const demoPassword = await hashPassword('demo123');
  const demo = await prisma.user.upsert({
    where: { phone: '01700000099' },
    update: {},
    create: {
      name: 'Demo Account',
      phone: '01700000099',
      email: 'demo@mfi.local',
      password_hash: demoPassword,
      role: 'DEMO',
      branch_id: branch.id,
    },
  });
  console.log('User created:', demo.name);

  console.log('\n--- Seed Complete ---');
  console.log('Login credentials:');
  console.log('  [ADMIN]');
  console.log('  Phone: 01700000000');
  console.log('  Password: admin123\n');
  console.log('  [FIELD_OFFICER]');
  console.log('  Phone: 01700000001');
  console.log('  Password: officer123\n');
  console.log('  [DEMO]');
  console.log('  Phone: 01700000099');
  console.log('  Password: demo123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
