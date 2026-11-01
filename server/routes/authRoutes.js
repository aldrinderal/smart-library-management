const express = require('express');
const router = express.Router();
const { login, register, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for auth endpoints (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', authLimiter, login);
router.post('/register', authLimiter, register);
router.get('/me', protect, getMe);

module.exports = router;

