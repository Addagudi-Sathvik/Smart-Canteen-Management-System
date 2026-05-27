const express = require('express');
const router = express.Router();
const { googleAuth, getMe } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// POST /api/auth/google - Google OAuth login
router.post('/google', googleAuth);

// GET /api/auth/me - Get current user profile
router.get('/me', authenticate, getMe);

module.exports = router;
