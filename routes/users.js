const express = require('express');
const router = express.Router();

// Import controllers and middleware
const { 
  getUserProfile, 
  updateUserProfile, 
  getUserById, 
  getUserStats 
} = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateProfileUpdate } = require('../middleware/validation');

/**
 * User Routes
 * Base path: /api/users
 */

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, getUserProfile);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put('/me', authenticate, validateProfileUpdate, updateUserProfile);

// @route   GET /api/users/me/stats
// @desc    Get current user statistics for dashboard
// @access  Private
router.get('/me/stats', authenticate, getUserStats);

// @route   GET /api/users/:id
// @desc    Get user by ID (public profile)
// @access  Public
router.get('/:id', getUserById);

module.exports = router;
