const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// GET /api/settings/sms-status - Accessible by any authenticated user
router.get('/sms-status', authMiddleware, settingController.getSmsStatus);

// PUT /api/settings/sms-status - Accessible only by ADMIN
router.put('/sms-status', authMiddleware, roleMiddleware('ADMIN'), settingController.updateSmsStatus);

module.exports = router;
