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

  // Create a default LoanProduct for testing later
  const loanProduct = await prisma.loanProduct.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: 'সাধারণ ক্ষুদ্রঋণ',
      interest_rate: 12.5,
      interest_method: 'FLAT',
      default_term_weeks: 46,
    },
  });
  console.log('Loan product created:', loanProduct.name);

  console.log('\n--- Seed Complete ---');
  console.log('Login credentials:');
  console.log('  Phone: 01700000000');
  console.log('  Password: admin123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
