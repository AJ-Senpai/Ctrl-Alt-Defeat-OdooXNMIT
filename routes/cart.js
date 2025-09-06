const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/authMiddleware');
const {
  validateAddToCart,
  validateUpdateCartItem
} = require('../middleware/validation');

// Import controllers
const {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');

/**
 * Cart Routes
 * Base path: /api/cart
 * All routes require authentication
 */

// @route   GET /api/cart
// @desc    Get user's cart with total calculation
// @access  Protected
router.get('/', authenticate, getCart);

// @route   POST /api/cart
// @desc    Add item to cart
// @access  Protected
router.post('/', authenticate, validateAddToCart, addToCart);

// @route   PUT /api/cart/:id
// @desc    Update cart item quantity
// @access  Protected
router.put('/:id', authenticate, validateUpdateCartItem, updateCartItem);

// @route   DELETE /api/cart/:id
// @desc    Remove specific item from cart
// @access  Protected
router.delete('/:id', authenticate, removeFromCart);

// @route   DELETE /api/cart
// @desc    Clear entire cart
// @access  Protected
router.delete('/', authenticate, clearCart);

module.exports = router;
