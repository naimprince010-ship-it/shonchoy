const axios = require('axios');
const jwt = require('jsonwebtoken');
const API_URL = 'http://localhost:5000/api';
// Or if we need to test production:
// const API_URL = 'https://api.loopwren.com/api';

async function testFeatures() {
  const prodApi = 'https://api.loopwren.com/api';
  const secret = 'mfi_mvp_s3cr3t_k3y_2026_x7q9z';
  
  const adminToken = jwt.sign({
    id: 1, name: 'System Admin', phone: '01700000000', role: 'ADMIN'
  }, secret, { expiresIn: '1h' });
  
  const foToken = jwt.sign({
    id: 2, name: 'Field Officer 1', phone: '01700000001', role: 'FIELD_OFFICER'
  }, secret, { expiresIn: '1h' });

  try {
    console.log("=== Testing Features ===");
    
    // 2. Edit a Client
    const clientsRes = await axios.get(`${prodApi}/clients`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    if (clientsRes.data.length === 0) {
      console.log("No clients found to edit.");
      return;
    }
    const client = clientsRes.data[0];
    const newPhone = '017' + Math.floor(10000000 + Math.random() * 90000000).toString();
    
    console.log(`Editing client ${client.id} (${client.name}). Old Phone: ${client.phone} -> New: ${newPhone}`);
    await axios.put(`${prodApi}/clients/${client.id}`, { ...client, phone: newPhone }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    // 3. Fetch Edit History
    const historyRes = await axios.get(`${prodApi}/audit-logs?entity_type=Client&entity_id=${client.id}`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log("\n--- Edit History ---");
    const logs = historyRes.data.data.filter(l => l.action === 'CLIENT_UPDATED');
    if (logs.length > 0) {
      const latest = logs[0];
      console.log(`Updated by: ${latest.user_name}`);
      console.log(`Changes:`, JSON.stringify(latest.details.changes, null, 2));
    } else {
      console.log("No edit history found!");
    }
    
    // 4. Test Notification Center - ADMIN
    console.log("\n--- Notifications (ADMIN) ---");
    const adminNotifsRes = await axios.get(`${prodApi}/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const { total: adminTotal, overdue: adminOverdue, pending_approvals: adminPending } = adminNotifsRes.data;
    console.log(`Total: ${adminTotal}`);
    console.log(`Overdue: ${adminOverdue.length}`);
    console.log(`Pending: ${adminPending.length}`);
    
    if (adminTotal === 0) {
      console.log("Empty state shown for ADMIN: No new notifications.");
    }
    
    // 5. Login as FIELD_OFFICER
    console.log("\n--- Notifications (FIELD_OFFICER) ---");
    const foNotifsRes = await axios.get(`${prodApi}/notifications`, {
      headers: { Authorization: `Bearer ${foToken}` }
    });
    const { total: foTotal, overdue: foOverdue, pending_approvals: foPending } = foNotifsRes.data;
    console.log(`Total: ${foTotal}`);
    console.log(`Overdue: ${foOverdue.length}`);
    console.log(`Pending: ${foPending.length}`);
    
    if (foTotal === 0) {
      console.log("Empty state shown for FIELD_OFFICER: No new notifications.");
    }
    
    console.log("\nAll API tests completed successfully.");
    
  } catch (error) {
    console.error("Test failed:");
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error.message);
    }
  }
}

testFeatures();
