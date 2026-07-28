require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function testAccessControl() {
  console.log('--- STARTING ACCESS CONTROL TEST ---');
  try {
    // 1. Create a dummy BRANCH_MANAGER user in the database directly
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Check if test manager exists
    let manager = await prisma.user.findUnique({ where: { phone: '01899999999' } });
    if (!manager) {
      manager = await prisma.user.create({
        data: {
          name: 'Test Branch Manager',
          phone: '01899999999',
          password_hash: hashedPassword,
          role: 'BRANCH_MANAGER'
        }
      });
      console.log('Created test BRANCH_MANAGER user.');
    }

    // 2. Log in to get token (using fetch to localhost or live API)
    // We can also just use the live API directly since it's deployed
    const baseUrl = 'https://api.loopwren.com/api';
    
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '01899999999', password: 'password123' })
    });
    const loginData = await loginRes.json();
    if (!loginData.token) {
      console.error('Failed to log in as manager', loginData);
      return;
    }
    console.log('Successfully logged in as BRANCH_MANAGER.');

    // 3. Attempt to Write-off loan ID 99999
    const writeOffRes = await fetch(`${baseUrl}/loans/99999/writeoff`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${loginData.token}`
      },
      body: JSON.stringify({ reason: 'Testing access control' })
    });

    console.log(`Write-off API Status with BRANCH_MANAGER token: ${writeOffRes.status}`);
    const writeOffData = await writeOffRes.json();
    console.log(`Write-off API Response:`, writeOffData);

    if (writeOffRes.status === 403) {
      console.log('✅ Access Control Verification SUCCESS: Branch Manager correctly received 403 Forbidden.');
    } else {
      console.error('❌ Access Control Verification FAILED!');
    }

  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAccessControl();
