require('dotenv').config();
const prisma = require('./src/utils/prisma');
const { generateInstallmentSchedule } = require('./src/services/loanCalculationService');

async function run() {
  try {
    // We already have a loan (ID: 1 or 2) in the database from earlier tests.
    // Let's fetch loan ID: 1
    const loan = await prisma.loan.findFirst({
      where: { id: 1 }
    });

    if (!loan) {
      console.log('No loan found in database.');
      return;
    }

    console.log('--- Original Prisma Loan Object ---');
    console.log('Principal Amount Type:', typeof loan.principal_amount);
    console.log('Principal Amount constructor:', loan.principal_amount.constructor.name);
    console.log('Principal Amount value:', loan.principal_amount);
    
    // Now let's calculate for FLAT
    console.log('\n--- Schedule (FLAT) ---');
    loan.interest_method = 'FLAT';
    loan.principal_amount = 10000;
    loan.interest_rate = 10;
    loan.term_weeks = 52;
    loan.disbursement_date = new Date();
    
    const flatSchedule = generateInstallmentSchedule(loan);
    let totalFlat = 0;
    flatSchedule.forEach(s => totalFlat += s.total_due);
    console.log(`First installment: Principal=${flatSchedule[0].principal_due}, Interest=${flatSchedule[0].interest_due}, Total=${flatSchedule[0].total_due}`);
    console.log(`Last installment: Principal=${flatSchedule[51].principal_due}, Interest=${flatSchedule[51].interest_due}, Total=${flatSchedule[51].total_due}`);
    console.log('Total Payable (FLAT):', totalFlat.toFixed(2));

    // Now let's calculate for REDUCING
    console.log('\n--- Schedule (REDUCING) ---');
    loan.interest_method = 'REDUCING';
    const reducingSchedule = generateInstallmentSchedule(loan);
    let totalReducing = 0;
    reducingSchedule.forEach(s => totalReducing += s.total_due);
    console.log(`First installment: Principal=${reducingSchedule[0].principal_due}, Interest=${reducingSchedule[0].interest_due}, Total=${reducingSchedule[0].total_due}`);
    console.log(`Last installment: Principal=${reducingSchedule[51].principal_due}, Interest=${reducingSchedule[51].interest_due}, Total=${reducingSchedule[51].total_due}`);
    console.log('Total Payable (REDUCING):', totalReducing.toFixed(2));

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
