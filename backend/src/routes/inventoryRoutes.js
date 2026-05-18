const express = require('express');
const router = express.Router();
const {
  adjustStock,
  getAllInventory,
  transferStock,
  getBatches,
  createBatch,
  adjustBatch,
} = require('../controllers/inventoryController');

router.post('/adjust', adjustStock);
router.get('/', getAllInventory);
router.post('/transfer', transferStock);

router.get('/batches', getBatches);
router.post('/batches', createBatch);
router.put('/batches/:id/adjust', adjustBatch);

module.exports = router;