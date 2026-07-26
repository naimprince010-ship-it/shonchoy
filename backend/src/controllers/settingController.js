const prisma = require('../utils/prisma');

exports.getSmsStatus = async (req, res) => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'SMS_ENABLED' }
    });
    
    // Default to true if not found in DB
    const isEnabled = setting ? setting.value === 'true' : true;
    
    res.json({ enabled: isEnabled });
  } catch (error) {
    console.error('Error fetching SMS status:', error);
    res.status(500).json({ message: 'Error fetching SMS status' });
  }
};

exports.updateSmsStatus = async (req, res) => {
  try {
    const { enabled } = req.body;
    
    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Invalid boolean value for enabled field' });
    }

    const setting = await prisma.systemSetting.upsert({
      where: { key: 'SMS_ENABLED' },
      update: { value: enabled ? 'true' : 'false' },
      create: { key: 'SMS_ENABLED', value: enabled ? 'true' : 'false' }
    });

    res.json({ message: `SMS successfully ${enabled ? 'enabled' : 'disabled'}`, enabled });
  } catch (error) {
    console.error('Error updating SMS status:', error);
    res.status(500).json({ message: 'Error updating SMS status' });
  }
};
