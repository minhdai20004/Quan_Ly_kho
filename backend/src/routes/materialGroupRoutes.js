const router = require('express').Router();
const ctrl   = require('../controllers/materialGroupController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',        protect, ctrl.getAll);
router.get('/:id',     protect, ctrl.getById);
router.post('/',       protect, adminOnly, ctrl.create);
router.put('/:id',     protect, adminOnly, ctrl.update);
router.delete('/:id',  protect, adminOnly, ctrl.delete);

module.exports = router;