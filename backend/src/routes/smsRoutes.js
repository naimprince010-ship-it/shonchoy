const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// POST /api/sms/send-manual - Accessible by ADMIN and BRANCH_MANAGER
router.post('/send-manual', authMiddleware, roleMiddleware('ADMIN', 'BRANCH_MANAGER'), smsController.sendManualSMS);

module.exports = router;
