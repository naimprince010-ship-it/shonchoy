const axios = require('axios');
const prisma = require('../utils/prisma');

/**
 * Converts local phone number format (01xxxxxxxxx) to international format (8801xxxxxxxxx).
 * Leaves the number as is if it already starts with 88.
 */
function formatPhone(phone) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, ''); // Remove any non-numeric characters
  if (cleaned.length === 11 && cleaned.startsWith('01')) {
    return '88' + cleaned;
  }
  return cleaned;
}

/**
 * Sends an SMS using MimSMS API.
 * The operation is wrapped in a try/catch so it fails gracefully without throwing an exception.
 * @param {string} phone - The recipient's phone number
 * @param {string} message - The message content
 */
async function sendSMS(phone, message) {
  try {
    // Check if SMS is enabled globally
    const smsSetting = await prisma.systemSetting.findUnique({
      where: { key: 'SMS_ENABLED' }
    });
    
    if (smsSetting && smsSetting.value === 'false') {
      console.log(`⚠️ SMS disabled system-wide. Skipping SMS to ${phone}.`);
      return true; // Return true so transactions can proceed normally
    }

    const formattedPhone = formatPhone(phone);
    
    // Check if required environment variables are set
    const username = process.env.MIMSMS_USERNAME;
    const apikey = process.env.MIMSMS_API_KEY;
    const senderName = process.env.MIMSMS_SENDER_ID;

    if (!username || !apikey || !senderName) {
      console.error('SMS configuration missing. Ensure MIMSMS_USERNAME, MIMSMS_API_KEY, and MIMSMS_SENDER_ID are set in .env');
      return false;
    }

    const payload = {
      UserName: username,
      Apikey: apikey,
      MobileNumber: formattedPhone,
      CampaignId: "null",
      SenderName: senderName,
      TransactionType: "T",
      Message: message
    };

    const response = await axios.post('https://api.mimsms.com/api/SmsSending/SMS', payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ SMS sent successfully to ${formattedPhone}. Response:`, response.data);
    return true;
  } catch (error) {
    // Graceful failure - only log the error, do not throw
    console.error(`❌ Failed to send SMS to ${phone}. Error:`, error.response ? error.response.data : error.message);
    return false;
  }
}

module.exports = {
  sendSMS,
  formatPhone
};
