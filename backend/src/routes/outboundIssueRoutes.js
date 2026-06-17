const router = require('express').Router();
const ctrl   = require('../controllers/outboundIssueController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/',                protect, ctrl.getAll);
router.get('/:id',             protect, ctrl.getById);
router.post('/',               protect, adminOnly, ctrl.create);
router.put('/:id',             protect, adminOnly, ctrl.update);
router.patch('/:id/confirm',   protect, adminOnly, ctrl.confirm);
router.patch('/:id/cancel',    protect, adminOnly, ctrl.cancel);

module.exports = router;