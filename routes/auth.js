const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { register, login, getMe, logout } = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateRegister, validateLogin } = require('../middleware/validation');

/**
 * Auth Routes
 * Base path: /api/auth
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', validateRegister, register);

// @route   POST /api/auth/login  
// @desc    Login user and return JWT token
// @access  Public
router.post('/login', validateLogin, login);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user (clear token client-side)
// @access  Private  
router.post('/logout', authenticate, logout);

module.exports = router;
