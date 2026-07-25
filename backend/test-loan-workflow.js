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
    console.log('--- TEST START ---');

    // 1. Login ADMIN
    const adminLogin = await request('POST', '/api/auth/login', { phone: '01700000000', password: 'admin123' });
    const adminToken = adminLogin.body.token;
    console.log('ADMIN Login:', adminLogin.statusCode);

    // 2. Login FIELD_OFFICER
    const officerLogin = await request('POST', '/api/auth/login', { phone: '01700000001', password: 'officer123' });
    const officerToken = officerLogin.body.token;
    console.log('OFFICER Login:', officerLogin.statusCode);

    // Create prereqs: branch, center, group, client
    const branchRes = await request('POST', '/api/branches', { name: 'Test Branch', address: 'Test' }, adminToken);
    console.log('Branch:', branchRes.body);
    const centerRes = await request('POST', '/api/centers', { name: 'Test Center', branch_id: branchRes.body.id, meeting_day: 'Monday' }, adminToken);
    console.log('Center:', centerRes.body);
    const groupRes = await request('POST', '/api/groups', { name: 'Test Group', center_id: centerRes.body.id }, adminToken);
    console.log('Group:', groupRes.body);
    const clientRes = await request('POST', '/api/clients', { 
      name: 'Test Client', 
      nid_number: Date.now().toString(), 
      phone: '01900000001', 
      address: 'Test', 
      guardian_name: 'Test', 
      group_id: groupRes.body.id 
    }, adminToken);
    console.log('Client:', clientRes.body);
    const clientId = clientRes.body.id;

    // 3. Create Loan Application (ADMIN token)
    const loanApp = await request('POST', '/api/loans', {
      client_id: clientId,
      loan_product_id: 1,
      principal_amount: 5000
    }, adminToken);
    console.log('LoanApp Body:', loanApp.body);
    const loanId = loanApp.body.data.id;
    console.log('Loan Application Status:', loanApp.statusCode, 'Loan ID:', loanId);

    // 4. Try Approve with FIELD_OFFICER token -> Should be 403
    const officerApprove = await request('PUT', `/api/loans/${loanId}/approve`, null, officerToken);
    console.log('OFFICER Approve Request Status:', officerApprove.statusCode);
    console.log('OFFICER Approve Error:', officerApprove.body.error);

    // 5. Try Approve with ADMIN token -> Should be 200
    const adminApprove = await request('PUT', `/api/loans/${loanId}/approve`, null, adminToken);
    console.log('ADMIN Approve Request Status:', adminApprove.statusCode);
    console.log('ADMIN Approve Status in DB:', adminApprove.body.data.status);

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTest();
