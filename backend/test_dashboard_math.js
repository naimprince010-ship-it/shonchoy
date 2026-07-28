const jwt = require('jsonwebtoken');

async function testDashboardArithmetic() {
  const secret = 'mfi_mvp_s3cr3t_k3y_2026_x7q9z';
  
  // 1. Create an ADMIN token
  const payload = {
    id: 1, // Assuming admin ID is 1
    name: 'Test Admin',
    phone: '01700000000',
    role: 'ADMIN'
  };
  const token = jwt.sign(payload, secret, { expiresIn: '1h' });
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
  
  const baseUrl = 'https://api.loopwren.com/api';

  try {
    // 2. Fetch Initial Dashboard Stats
    const dash1Res = await fetch(`${baseUrl}/reports/portfolio-summary`, { headers });
    const dash1 = await dash1Res.json();
    const O1 = dash1.data.total_outstanding || 0;
    const W1 = dash1.data.total_written_off || 0;
    
    console.log(`--- INITIAL DASHBOARD STATS ---`);
    console.log(`Total Outstanding: ৳${O1}`);
    console.log(`Total Written Off: ৳${W1}`);

    // 3. Find a DISBURSED loan
    const loansRes = await fetch(`${baseUrl}/loans`, { headers });
    const loansData = await loansRes.json();
    const disbursedLoan = loansData.find(l => l.status === 'DISBURSED');

    if (!disbursedLoan) {
      console.log('\n❌ No DISBURSED loan found to test write-off.');
      return;
    }
    
    console.log(`\n--- FOUND DISBURSED LOAN ---`);
    console.log(`Loan ID: ${disbursedLoan.id}, Principal: ৳${disbursedLoan.principal_amount}`);

    // 4. Perform Write-Off
    console.log(`\n--- PERFORMING WRITE-OFF ON LOAN #${disbursedLoan.id} ---`);
    const writeOffRes = await fetch(`${baseUrl}/loans/${disbursedLoan.id}/writeoff`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ reason: 'Dashboard math verification test' })
    });
    
    if (!writeOffRes.ok) {
      console.error('Failed to write off:', await writeOffRes.text());
      return;
    }
    console.log('✅ Write-off successful.');

    // 5. Fetch Final Dashboard Stats
    const dash2Res = await fetch(`${baseUrl}/reports/portfolio-summary`, { headers });
    const dash2 = await dash2Res.json();
    const O2 = dash2.data.total_outstanding || 0;
    const W2 = dash2.data.total_written_off || 0;

    console.log(`\n--- FINAL DASHBOARD STATS ---`);
    console.log(`Total Outstanding: ৳${O2}`);
    console.log(`Total Written Off: ৳${W2}`);

    // 6. Arithmetic Verification
    const outstandingDiff = Number((O1 - O2).toFixed(2));
    const writtenOffDiff = Number((W2 - W1).toFixed(2));

    console.log(`\n--- ARITHMETIC VERIFICATION ---`);
    console.log(`Outstanding Decreased By: ৳${outstandingDiff} (৳${O1} - ৳${O2})`);
    console.log(`Written Off Increased By: ৳${writtenOffDiff} (৳${W2} - ৳${W1})`);

    if (outstandingDiff > 0 && outstandingDiff === writtenOffDiff) {
      console.log(`\n✅ ARITHMETIC MATCHES PERFECTLY! Backend logic is working flawlessly.`);
    } else {
      console.log(`\n❌ MISMATCH DETECTED! Difference is not equal.`);
    }

  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testDashboardArithmetic();
