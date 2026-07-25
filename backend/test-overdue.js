const prisma = require('./src/utils/prisma');
const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const dataString = data ? JSON.stringify(data) : '';
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {})
      }
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, res => {
      let responseBody = '';
      res.on('data', chunk => responseBody += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: responseBody ? JSON.parse(responseBody) : null
        });
      });
    });

    req.on('error', reject);
    if (data !== undefined && data !== null) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTest() {
  try {
    console.log('--- TEST OVERDUE DETECTION ---');

    // 1. Force an installment to be overdue
    console.log('1. Setting an installment due_date to 10 days ago...');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    
    // Find an installment that is PENDING (we know schedule ID 1 is PAID from previous test, let's pick ID 2)
    const updated = await prisma.loanInstallmentSchedule.update({
      where: { id: 2 },
      data: { due_date: pastDate, status: 'PENDING' }
    });
    console.log(`Updated Installment 2 due_date to ${updated.due_date}`);

    // 2. Login as ADMIN
    const adminLogin = await request('POST', '/api/auth/login', { phone: '01700000000', password: 'admin123' });
    const adminToken = adminLogin.body.token;

    // 3. Fetch Overdue Loans
    console.log('\n2. Fetching overdue loans as ADMIN...');
    const overdueRes = await request('GET', '/api/loans/overdue', null, adminToken);
    
    console.log(`Status Code: ${overdueRes.statusCode}`);
    if (overdueRes.statusCode === 200) {
      console.log(`Overdue Records Found: ${overdueRes.body.data.length}`);
      console.log('Data:', JSON.stringify(overdueRes.body.data, null, 2));
    } else {
      console.log('Error:', overdueRes.body);
    }
    
    // 4. Test as FIELD_OFFICER (officer 1 is assigned to center 1? wait, field officer 1 is created but is he assigned to the center?)
    const officerLogin = await request('POST', '/api/auth/login', { phone: '01700000001', password: 'officer123' });
    const officerToken = officerLogin.body.token;

    // Let's assign officer to center 1 if not already
    await prisma.center.updateMany({
      data: { field_officer_id: 2 } // assuming field officer has ID 2
    });

    console.log('\n3. Fetching overdue loans as FIELD_OFFICER (assigned to center)...');
    const officerRes = await request('GET', '/api/loans/overdue', null, officerToken);
    if (officerRes.statusCode === 200) {
      console.log(`Overdue Records Found: ${officerRes.body.data.length}`);
    } else {
      console.log('Error:', officerRes.body);
    }

    await prisma.$disconnect();
  } catch (err) {
    console.error('Test script error:', err);
    await prisma.$disconnect();
  }
}

runTest();
