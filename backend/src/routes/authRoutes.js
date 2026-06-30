const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/auth');
// POST /api/auth/login
router.post('/login', ctrl.login);
// POST /api/auth/register
router.post('/register', ctrl.register);
// GET /api/auth/me
router.get('/me', protect, ctrl.getMe);
// ─── Thêm vào authRoutes.js (trước module.exports) ──────────────────────────
router.get('/users',              protect, adminOnly, ctrl.getAll);
router.put('/users/:id',          protect, adminOnly, ctrl.updateUser);
router.patch('/users/:id/toggle', protect, adminOnly, ctrl.toggleActive);
router.delete('/users/:id',       protect, adminOnly, ctrl.deleteUser);
module.exports = router;