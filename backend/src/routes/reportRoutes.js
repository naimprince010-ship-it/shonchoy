const express = require('express');
const router = express.Router();
const { getPortfolioSummary, getDailyCollection, getMonthlyTrend } = require('../controllers/reportController');

// GET /api/reports/portfolio-summary
router.get('/portfolio-summary', getPortfolioSummary);

// GET /api/reports/daily-collection
router.get('/daily-collection', getDailyCollection);

// GET /api/reports/monthly-trend
router.get('/monthly-trend', getMonthlyTrend);

module.exports = router;
