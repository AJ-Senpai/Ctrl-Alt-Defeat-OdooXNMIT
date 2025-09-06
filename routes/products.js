const express = require('express');
const router = express.Router();

// Import controllers and middleware
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductMeta,
  getSearchSuggestions,
  getCategoryStats
} = require('../controllers/productController');
const { authenticate } = require('../middleware/authMiddleware');
const { validateProductCreate, validateProductUpdate } = require('../middleware/validation');

/**
 * Product Routes  
 * Base path: /api/products
 */

// @route   GET /api/products/meta
// @desc    Get product categories and conditions
// @access  Public
router.get('/meta', getProductMeta);

// @route   GET /api/products/suggestions
// @desc    Get search suggestions
// @access  Public
router.get('/suggestions', getSearchSuggestions);

// @route   GET /api/products/stats
// @desc    Get category statistics
// @access  Public
router.get('/stats', getCategoryStats);

// @route   GET /api/products/my
// @desc    Get current user's products
// @access  Private
router.get('/my', authenticate, getMyProducts);

// @route   GET /api/products
// @desc    Get all products with filters and pagination
// @access  Public
router.get('/', getProducts);

// @route   POST /api/products
// @desc    Create new product
// @access  Private
router.post('/', authenticate, validateProductCreate, createProduct);

// @route   GET /api/products/:id
// @desc    Get single product by ID
// @access  Public
router.get('/:id', getProductById);

// @route   PUT /api/products/:id
// @desc    Update product
// @access  Private (owner only)
router.put('/:id', authenticate, validateProductUpdate, updateProduct);

// @route   DELETE /api/products/:id
// @desc    Delete product
// @access  Private (owner only)
router.delete('/:id', authenticate, deleteProduct);

module.exports = router;
