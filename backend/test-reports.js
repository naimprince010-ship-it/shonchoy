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
    if (dataString) {
      req.write(dataString);
    }
    req.end();
  });
}

async function runTest() {
  try {
    console.log('--- TEST REPORTS ---');

    // 1. Login ADMIN
    const adminLogin = await request('POST', '/api/auth/login', { phone: '01700000000', password: 'admin123' });
    const adminToken = adminLogin.body.token;

    // 2. Fetch Portfolio Summary
    console.log('\n--- PORTFOLIO SUMMARY ---');
    const summaryRes = await request('GET', '/api/reports/portfolio-summary', null, adminToken);
    console.log('Status Code:', summaryRes.statusCode);
    if (summaryRes.statusCode === 200) {
      console.log(JSON.stringify(summaryRes.body.data, null, 2));
    } else {
      console.log('Error:', summaryRes.body);
    }

    // 3. Fetch Daily Collection
    console.log('\n--- DAILY COLLECTION ---');
    const today = new Date().toISOString().split('T')[0];
    const dailyRes = await request('GET', `/api/reports/daily-collection?date=${today}`, null, adminToken);
    console.log('Status Code:', dailyRes.statusCode);
    if (dailyRes.statusCode === 200) {
      console.log(JSON.stringify(dailyRes.body.data, null, 2));
    } else {
      console.log('Error:', dailyRes.body);
    }

  } catch (err) {
    console.error('Test script error:', err);
  }
}

runTest();
