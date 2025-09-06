const { validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getUserProfile = async (req, res) => {
  try {
    // Get user by ID from auth middleware (req.user.id)
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return user profile data (password is excluded by model default)
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user profile'
    });
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateUserProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Get current user
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Extract updatable fields from request body
    const { username, bio, avatar } = req.body;
    
    // Check if username is being changed and if it already exists
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ 
        username: username,
        _id: { $ne: user._id } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username is already taken'
        });
      }
    }
    
    // Update fields if provided
    if (username !== undefined) user.username = username;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Save updated user
    await user.save();
    
    // Return updated profile
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error('Update user profile error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }
    
    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field.charAt(0).toUpperCase() + field.slice(1)} is already taken`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error updating user profile'
    });
  }
};

/**
 * @desc    Get user by ID (public profile)
 * @route   GET /api/users/:id
 * @access  Public
 */
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }
    
    // Find user by ID (exclude sensitive information)
    const user = await User.findById(id).select('-__v');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Return public profile information
    res.status(200).json({
      success: true,
      message: 'User profile retrieved successfully',
      user: {
        id: user._id,
        username: user.username,
        bio: user.bio,
        avatar: user.avatar,
        createdAt: user.createdAt
        // Note: email and other sensitive info excluded from public profile
      }
    });
    
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user profile'
    });
  }
};

/**
 * @desc    Get user profile statistics (for dashboard)
 * @route   GET /api/users/me/stats
 * @access  Private
 */
const getUserStats = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Calculate user statistics
    // Note: These will be enhanced in later steps when we have products, purchases, etc.
    const stats = {
      profileCompleteness: calculateProfileCompleteness(user),
      memberSince: user.createdAt,
      lastUpdated: user.updatedAt,
      // TODO: Add product counts, purchase history, etc. in later steps
      productsListed: 0, // Placeholder
      productsSold: 0,   // Placeholder  
      purchasesMade: 0   // Placeholder
    };
    
    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      stats
    });
    
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving user statistics'
    });
  }
};

/**
 * Calculate profile completeness percentage
 * @param {Object} user - User object
 * @returns {number} - Completion percentage
 */
const calculateProfileCompleteness = (user) => {
  const fields = ['username', 'email', 'bio', 'avatar'];
  const completedFields = fields.filter(field => {
    const value = user[field];
    return value && value.toString().trim().length > 0;
  });
  
  return Math.round((completedFields.length / fields.length) * 100);
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserById,
  getUserStats
};
