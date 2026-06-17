const router = require('express').Router();
const ctrl   = require('../controllers/warehouseController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',                              protect, ctrl.getAll);
router.get('/:id',                           protect, ctrl.getById);
router.post('/',                             protect, adminOnly, ctrl.create);
router.put('/:id',                           protect, adminOnly, ctrl.update);
router.delete('/:id',                        protect, adminOnly, ctrl.delete);

// Vị trí trong kho
router.get('/:id/locations',                 protect, ctrl.getLocations);
router.post('/:id/locations',                protect, adminOnly, ctrl.createLocation);
router.put('/:id/locations/:locationId',     protect, adminOnly, ctrl.updateLocation);
router.delete('/:id/locations/:locationId',  protect, adminOnly, ctrl.deleteLocation);

module.exports = router;