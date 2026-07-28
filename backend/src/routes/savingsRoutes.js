const express = require('express');
const router = express.Router();
const { deposit, withdraw, getClientTransactions, getAllSavings } = require('../controllers/savingsController');

router.get('/', getAllSavings);
router.post('/deposit', deposit);
router.post('/withdraw', withdraw);
router.get('/:clientId/transactions', getClientTransactions);

module.exports = router;
