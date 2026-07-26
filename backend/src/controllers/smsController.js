const prisma = require('../utils/prisma');
const smsService = require('../services/smsService');

exports.sendManualSMS = async (req, res) => {
  try {
    const { client_id, message } = req.body;

    if (!client_id || !message) {
      return res.status(400).json({ message: 'Client ID and message are required' });
    }

    // Check if SMS is enabled globally
    const smsSetting = await prisma.systemSetting.findUnique({
      where: { key: 'SMS_ENABLED' }
    });
    
    if (smsSetting && smsSetting.value === 'false') {
      return res.status(400).json({ message: 'SMS is currently disabled system-wide' });
    }

    const client = await prisma.client.findUnique({
      where: { id: parseInt(client_id) }
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    if (!client.phone) {
      return res.status(400).json({ message: 'Client does not have a registered phone number' });
    }

    // Attempt to send SMS
    const success = await smsService.sendSMS(client.phone, message);

    if (success) {
      return res.json({ message: 'SMS sent successfully' });
    } else {
      // In case of actual failure from MimSMS (e.g., config missing, connection issue)
      return res.status(500).json({ message: 'Failed to send SMS. Please check system logs.' });
    }
  } catch (error) {
    console.error('Error sending manual SMS:', error);
    res.status(500).json({ message: 'Server error while sending SMS' });
  }
};
