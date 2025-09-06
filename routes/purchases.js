const express = require('express');
const router = express.Router();

/**
 * Purchase Routes
 * Base path: /api/purchases
 */

// @route   POST /api/purchases
// @desc    Create new purchase (checkout)
// @access  Private
router.post('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Create purchase endpoint - Coming in Step 6'
  });
});

// @route   GET /api/purchases
// @desc    Get user's purchase history
// @access  Private
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get purchase history endpoint - Coming in Step 6'
  });
});

// @route   GET /api/purchases/:id
// @desc    Get single purchase details
// @access  Private
router.get('/:id', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get purchase details endpoint - Coming in Step 6'
  });
});

module.exports = router;
