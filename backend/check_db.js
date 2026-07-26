require('dotenv').config();
const prisma = require('./src/utils/prisma');

async function main() {
  console.log('--- Database Row Counts ---');
  const userCount = await prisma.user.count();
  const clientCount = await prisma.client.count();
  const loanCount = await prisma.loan.count();
  const repaymentCount = await prisma.loanRepayment.count();
  const savingsCount = await prisma.savingsTransaction.count();

  console.log(`Users: ${userCount}`);
  console.log(`Clients: ${clientCount}`);
  console.log(`Loans: ${loanCount}`);
  console.log(`Loan Repayments: ${repaymentCount}`);
  console.log(`Savings Transactions: ${savingsCount}`);

  console.log('\n--- Demo User API Test ---');
  try {
    // 1. Login
    const loginRes = await fetch('https://api.loopwren.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01700000099', password: 'demo123' })
    });
    console.log('Login status:', loginRes.status);
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    // 2. Test GET (Clients)
    const getRes = await fetch('https://api.loopwren.com/api/clients', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('GET /api/clients status:', getRes.status);

    // 3. Test POST (Create Client)
    const postRes = await fetch('https://api.loopwren.com/api/clients', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ name: 'Test Client', phone: '01799999999', address: 'Test' })
    });
    
    console.log('POST /api/clients status:', postRes.status);
    const postData = await postRes.json();
    if (postRes.status === 403) {
      console.log('POST /api/clients failed as expected with status: 403');
      console.log('Error message:', postData.error);
    } else {
      console.log('WARNING: THIS SHOULD HAVE FAILED');
    }
  } catch (error) {
    console.error('API Test Error:', error.message);
  }

  await prisma.$disconnect();
}

main();
