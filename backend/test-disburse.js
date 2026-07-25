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
    console.log('--- TEST DISBURSE START ---');

    // 1. Login ADMIN
    const adminLogin = await request('POST', '/api/auth/login', { phone: '01700000000', password: 'admin123' });
    const adminToken = adminLogin.body.token;

    // 2. Create Loan Application (ADMIN token)
    // First need a client, but we already have client ID 2, 3, 4, 5 from previous tests. Let's use 5.
    const loanApp = await request('POST', '/api/loans', {
      client_id: 5,
      loan_product_id: 1,
      principal_amount: 15000
    }, adminToken);
    
    if (loanApp.statusCode !== 201) {
      console.log('Failed to create loan', loanApp.body);
      return;
    }
    const loanId = loanApp.body.data.id;
    console.log('Created Loan ID:', loanId);

    // 3. Approve Loan
    const adminApprove = await request('PUT', `/api/loans/${loanId}/approve`, null, adminToken);
    console.log('Approve Status:', adminApprove.statusCode);

    // 4. Disburse Loan
    const disburse = await request('PUT', `/api/loans/${loanId}/disburse`, { disbursement_date: new Date().toISOString() }, adminToken);
    console.log('Disburse Status:', disburse.statusCode);
    
    if (disburse.statusCode === 200) {
      const { data } = disburse.body;
      console.log(`Loan Status after disburse: ${data.status}`);
      console.log(`Schedule created: ${data.schedules.length} installments`);
      console.log('First 2 installments:');
      console.dir(data.schedules.slice(0, 2));
      console.log('Last installment:');
      console.dir(data.schedules.slice(-1));
    } else {
      console.log('Disburse Error:', disburse.body);
    }

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTest();
