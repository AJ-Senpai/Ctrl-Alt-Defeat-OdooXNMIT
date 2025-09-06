const express = require('express');
const router = express.Router();

/**
 * Cart Routes
 * Base path: /api/cart
 */

// @route   GET /api/cart
// @desc    Get user's cart
// @access  Private
router.get('/', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Get cart endpoint - Coming in Step 6'
  });
});

// @route   POST /api/cart/add
// @desc    Add item to cart
// @access  Private
router.post('/add', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Add to cart endpoint - Coming in Step 6'
  });
});

// @route   PUT /api/cart/update
// @desc    Update cart item quantity
// @access  Private
router.put('/update', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Update cart endpoint - Coming in Step 6'
  });
});

// @route   DELETE /api/cart/remove/:productId
// @desc    Remove item from cart
// @access  Private
router.delete('/remove/:productId', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Remove from cart endpoint - Coming in Step 6'
  });
});

// @route   DELETE /api/cart/clear
// @desc    Clear entire cart
// @access  Private
router.delete('/clear', (req, res) => {
  res.status(501).json({
    success: false,
    message: 'Clear cart endpoint - Coming in Step 6'
  });
});

module.exports = router;
