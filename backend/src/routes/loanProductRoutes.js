const express = require('express');
const { getLoanProducts } = require('../controllers/loanController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/loan-products
router.get('/', authMiddleware, getLoanProducts);

module.exports = router;
