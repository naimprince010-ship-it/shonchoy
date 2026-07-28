const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

// Field officers (and others) can submit
router.post('/', authMiddleware, feedbackController.submitFeedback);

// Only admins can view and resolve
router.get('/', authMiddleware, roleMiddleware('ADMIN'), feedbackController.getFeedbacks);
router.put('/:id/resolve', authMiddleware, roleMiddleware('ADMIN'), feedbackController.resolveFeedback);

module.exports = router;
