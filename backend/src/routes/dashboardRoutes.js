const express = require('express');
const router = express.Router();
const { getStats, getLowStock, getRecentTransactions, getChartData, getTopProducts } = require('../controllers/dashboardController');

router.get('/stats', getStats);
router.get('/low-stock', getLowStock);
router.get('/recent-transactions', getRecentTransactions);
router.get('/chart', getChartData);
router.get('/top-products', getTopProducts);

module.exports = router;