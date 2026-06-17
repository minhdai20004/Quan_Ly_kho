const router = require('express').Router();
const ctrl   = require('../controllers/materialStockController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',                           protect, ctrl.getAll);
router.get('/material/:materialId',       protect, ctrl.getByMaterial);
router.post('/adjust',                    protect, adminOnly, ctrl.adjust);

module.exports = router;