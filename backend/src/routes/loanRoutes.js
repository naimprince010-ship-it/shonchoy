const express = require('express');
const router = express.Router();
const { createLoanApplication, approveLoan, getLoanById, disburseLoan, addRepayment, getOverdueLoans, getAllLoans, writeOffLoan } = require('../controllers/loanController');
const { roleMiddleware } = require('../middleware/authMiddleware');

// GET /api/loans - List all loans
router.get('/', getAllLoans);

// POST /api/loans - Create application (Accessible by Field Officer, Branch Manager, Admin)
router.post('/', createLoanApplication);

// GET /api/loans/overdue - View overdue loans
router.get('/overdue', getOverdueLoans);

// GET /api/loans/:id - View loan details
router.get('/:id', getLoanById);

// PUT /api/loans/:id/approve - Approve loan (Restricted to ADMIN & BRANCH_MANAGER)
router.put('/:id/approve', roleMiddleware('ADMIN', 'BRANCH_MANAGER'), approveLoan);

// PUT /api/loans/:id/disburse - Disburse loan (Restricted to ADMIN & BRANCH_MANAGER)
router.put('/:id/disburse', roleMiddleware('ADMIN', 'BRANCH_MANAGER'), disburseLoan);

// POST /api/loans/:id/repayment - Add repayment (Accessible by any authenticated user, e.g. FIELD_OFFICER)
router.post('/:id/repayment', addRepayment);

// PUT /api/loans/:id/writeoff - Write-off a loan (Restricted to ADMIN)
router.put('/:id/writeoff', roleMiddleware('ADMIN'), writeOffLoan);

module.exports = router;
