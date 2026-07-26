const express = require('express');
const { 
  getUsers, 
  createUser, 
  deactivateUser, 
  reactivateUser, 
  changePassword, 
  resetPassword 
} = require('../controllers/userController');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Self-service (All authenticated users)
router.put('/change-password', authMiddleware, changePassword);

// Admin-only routes
router.get('/', authMiddleware, roleMiddleware('ADMIN'), getUsers);
router.post('/', authMiddleware, roleMiddleware('ADMIN'), createUser);
router.put('/:id/deactivate', authMiddleware, roleMiddleware('ADMIN'), deactivateUser);
router.put('/:id/reactivate', authMiddleware, roleMiddleware('ADMIN'), reactivateUser);
router.put('/:id/reset-password', authMiddleware, roleMiddleware('ADMIN'), resetPassword);

module.exports = router;
