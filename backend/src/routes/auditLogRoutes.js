const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

router.use(authMiddleware);
// Only ADMIN can view logs
router.use(roleMiddleware('ADMIN'));

router.get('/', getAuditLogs);

module.exports = router;
