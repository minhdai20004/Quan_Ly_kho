const express    = require('express');
const router     = express.Router();
const ctrl       = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', ctrl.login);

// POST /api/auth/register
router.post('/register', ctrl.register);

// GET /api/auth/me
router.get('/me', protect, ctrl.getMe);

module.exports = router;