const express = require('express');
const router = express.Router();
const {
  getAllInventory,
  getById,
  adjustStock,
  getStats,
} = require('../controllers/inventoryController');

router.get('/',           getAllInventory);
router.get('/stats',      getStats);
router.get('/:id',        getById);
router.patch('/:id/adjust', adjustStock);

module.exports = router;