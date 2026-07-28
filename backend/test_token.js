const jwt = require('jsonwebtoken');

async function testAccessControl() {
  const secret = 'mfi_mvp_s3cr3t_k3y_2026_x7q9z';
  
  // Create a FIELD_OFFICER token manually for testing
  const payload = {
    id: 9999,
    name: 'Test Field Officer',
    phone: '01800000000',
    role: 'FIELD_OFFICER'
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  console.log('--- GENERATED FIELD_OFFICER TOKEN ---');
  console.log(token);
  
  console.log('\n--- ATTEMPTING WRITEOFF REQUEST TO PRODUCTION ---');
  try {
    const res = await fetch('https://api.loopwren.com/api/loans/1/writeoff', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason: 'Live API test for access control' })
    });
    
    console.log(`HTTP Status: ${res.status}`);
    const data = await res.json();
    console.log('Response Body:', data);
    
    if (res.status === 403) {
      console.log('\n✅ TEST SUCCESS: API correctly blocked the request and returned 403 Forbidden.');
    } else {
      console.error('\n❌ TEST FAILED: Expected 403, got', res.status);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testAccessControl();
