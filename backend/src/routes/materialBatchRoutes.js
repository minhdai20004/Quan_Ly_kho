const router = require('express').Router();
const ctrl   = require('../controllers/materialBatchController');
const { protect, adminOnly } = require('../middleware/auth');

// Expiry alerts — đặt TRƯỚC /:id để không bị match nhầm
router.get('/expiry-alerts',             protect, ctrl.getExpiryAlerts);

// Lấy tất cả lô theo vật tư
router.get('/material/:materialId',      protect, ctrl.getByMaterial);

// CRUD
router.post('/',                         protect, adminOnly, ctrl.create);
router.put('/:id',                       protect, adminOnly, ctrl.update);
router.delete('/:id',                    protect, adminOnly, ctrl.delete);

module.exports = router;