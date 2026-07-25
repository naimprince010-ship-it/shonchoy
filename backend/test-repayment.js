const http = require('http');

function request(method, path, data, token) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data || {});
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
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
    if (data !== undefined) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTest() {
  try {
    console.log('--- TEST REPAYMENT START ---');

    // 1. Login ADMIN to get loan details
    const adminLogin = await request('POST', '/api/auth/login', { phone: '01700000000', password: 'admin123' });
    if (!adminLogin.body || !adminLogin.body.token) {
      console.log('Admin login failed:', adminLogin.body);
      return;
    }
    const adminToken = adminLogin.body.token;

    // Login FIELD_OFFICER to make payments
    const officerLogin = await request('POST', '/api/auth/login', { phone: '01700000001', password: 'officer123' });
    if (!officerLogin.body || !officerLogin.body.token) {
      console.log('Officer login failed:', officerLogin.body);
      return;
    }
    const officerToken = officerLogin.body.token;

    const loanId = 3; // We disbursed this in the last step

    const loanDetails = await request('GET', `/api/loans/${loanId}`, null, adminToken);
    if (loanDetails.statusCode !== 200 || !loanDetails.body.schedules) {
      console.log('Error fetching loan 3', loanDetails.body);
      return;
    }
    const schedule1 = loanDetails.body.schedules[0];
    console.log('Installment 1 ID:', schedule1.id, '| Total Due:', schedule1.total_due, '| Status:', schedule1.status);

    // 2. Partial Payment (100)
    console.log('\n--- Making Partial Payment (100) ---');
    const pay1 = await request('POST', `/api/loans/${loanId}/repayment`, {
      installment_schedule_id: schedule1.id,
      amount_paid: 100
    }, officerToken);
    console.log('Status Code:', pay1.statusCode);
    if (pay1.statusCode === 200) {
      console.log('Installment Status:', pay1.body.data.installment_status);
      console.log('Total Paid:', pay1.body.data.total_paid_for_installment);
    } else {
      console.log('Error:', pay1.body);
    }

    // 3. Pay Remaining (217.31)
    console.log('\n--- Making Remaining Payment (217.31) ---');
    const pay2 = await request('POST', `/api/loans/${loanId}/repayment`, {
      installment_schedule_id: schedule1.id,
      amount_paid: 217.31
    }, officerToken);
    console.log('Status Code:', pay2.statusCode);
    if (pay2.statusCode === 200) {
      console.log('Installment Status:', pay2.body.data.installment_status);
      console.log('Total Paid:', pay2.body.data.total_paid_for_installment);
    } else {
      console.log('Error:', pay2.body);
    }

    // 4. Overpayment Attempt (50)
    console.log('\n--- Making Overpayment Attempt (50) ---');
    const pay3 = await request('POST', `/api/loans/${loanId}/repayment`, {
      installment_schedule_id: schedule1.id,
      amount_paid: 50
    }, officerToken);
    console.log('Status Code:', pay3.statusCode);
    console.log('Response:', pay3.body);

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTest();
