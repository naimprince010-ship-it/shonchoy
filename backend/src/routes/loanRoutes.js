const express = require('express');
const router = express.Router();
const { createLoanApplication, approveLoan, getLoanById } = require('../controllers/loanController');
const { roleMiddleware } = require('../middleware/authMiddleware');

// POST /api/loans - Create application (Accessible by Field Officer, Branch Manager, Admin)
router.post('/', createLoanApplication);

// GET /api/loans/:id - View loan details
router.get('/:id', getLoanById);

// PUT /api/loans/:id/approve - Approve loan (Restricted to ADMIN & BRANCH_MANAGER)
router.put('/:id/approve', roleMiddleware('ADMIN', 'BRANCH_MANAGER'), approveLoan);

module.exports = router;
