const express = require('express');
const router = express.Router();
const { getPortfolioSummary, getDailyCollection } = require('../controllers/reportController');

// GET /api/reports/portfolio-summary
router.get('/portfolio-summary', getPortfolioSummary);

// GET /api/reports/daily-collection
router.get('/daily-collection', getDailyCollection);

module.exports = router;
