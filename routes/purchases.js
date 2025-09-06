const express = require('express');
const router = express.Router();

// Import middleware
const { authenticate } = require('../middleware/authMiddleware');
const { validateCreatePurchase } = require('../middleware/validation');

// Import controllers
const {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchaseStats
} = require('../controllers/purchaseController');

/**
 * Purchase Routes
 * Base path: /api/purchases
 * All routes require authentication
 */

// @route   POST /api/purchases
// @desc    Create new purchase from cart (checkout)
// @access  Protected
router.post('/', authenticate, validateCreatePurchase, createPurchase);

// @route   GET /api/purchases
// @desc    Get user's purchase history with pagination
// @access  Protected
router.get('/', authenticate, getPurchases);

// @route   GET /api/purchases/stats
// @desc    Get purchase statistics for dashboard
// @access  Protected
router.get('/stats', authenticate, getPurchaseStats);

// @route   GET /api/purchases/:id
// @desc    Get single purchase details
// @access  Protected
router.get('/:id', authenticate, getPurchaseById);

module.exports = router;
