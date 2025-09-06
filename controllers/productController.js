const { validationResult } = require('express-validator');
const Product = require('../models/Product');

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private
 */
const createProduct = async (req, res) => {
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

    // Extract product data from request body
    const {
      title,
      description,
      category,
      price,
      condition,
      image,
      location,
      tags
    } = req.body;

    // Create new product with authenticated user as owner
    const product = new Product({
      user: req.user.id,
      title,
      description,
      category,
      price,
      condition,
      image,
      location,
      tags: tags || []
    });

    await product.save();

    // Populate user information for response
    await product.populate('user', 'username avatar');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });

  } catch (error) {
    console.error('Create product error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error creating product'
    });
  }
};

/**
 * @desc    Get all products (public)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = async (req, res) => {
  try {
    // Extract and validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10)); // Max 50 items per page
    const category = req.query.category;
    const minPrice = parseFloat(req.query.minPrice);
    const maxPrice = parseFloat(req.query.maxPrice);
    const condition = req.query.condition;
    const search = req.query.search;
    const location = req.query.location;
    const tags = req.query.tags ? req.query.tags.split(',').map(tag => tag.trim()) : null;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder || 'desc';

    // Validate category if provided
    if (category && !Product.getCategories().includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Valid categories are: ${Product.getCategories().join(', ')}`
      });
    }

    // Validate condition if provided
    if (condition && !Product.getConditions().includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition. Valid conditions are: ${Product.getConditions().join(', ')}`
      });
    }

    // Validate price range
    if (!isNaN(minPrice) && !isNaN(maxPrice) && minPrice > maxPrice) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price cannot be greater than maximum price'
      });
    }

    // Validate sort field
    const allowedSortFields = ['createdAt', 'price', 'title', 'views', 'updatedAt'];
    if (!allowedSortFields.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        message: `Invalid sort field. Allowed fields are: ${allowedSortFields.join(', ')}`
      });
    }

    // Use advanced search method
    const searchOptions = {
      search,
      category,
      condition,
      minPrice: !isNaN(minPrice) ? minPrice : undefined,
      maxPrice: !isNaN(maxPrice) ? maxPrice : undefined,
      location,
      tags,
      sortBy,
      sortOrder,
      page,
      limit
    };

    const products = await Product.advancedSearch(searchOptions);

    // Get total count for pagination (need to build same filter for count)
    let countFilter = { isAvailable: true };
    if (search) countFilter.$text = { $search: search.trim() };
    if (category) countFilter.category = category;
    if (condition) countFilter.condition = condition;
    if (!isNaN(minPrice) || !isNaN(maxPrice)) {
      countFilter.price = {};
      if (!isNaN(minPrice)) countFilter.price.$gte = minPrice;
      if (!isNaN(maxPrice)) countFilter.price.$lte = maxPrice;
    }
    if (location) countFilter.location = { $regex: new RegExp(location.trim(), 'i') };
    if (tags && tags.length > 0) countFilter.tags = { $in: tags };

    const totalProducts = await Product.countDocuments(countFilter);
    const totalPages = Math.ceil(totalProducts / limit);

    // Build response with applied filters for transparency
    const appliedFilters = {
      search: search || null,
      category: category || null,
      condition: condition || null,
      priceRange: {
        min: !isNaN(minPrice) ? minPrice : null,
        max: !isNaN(maxPrice) ? maxPrice : null
      },
      location: location || null,
      tags: tags || null,
      sortBy,
      sortOrder
    };

    res.status(200).json({
      success: true,
      message: `Products retrieved successfully${search ? ` for search: "${search}"` : ''}`,
      data: products,
      filters: appliedFilters,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving products'
    });
  }
};

/**
 * @desc    Get single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find product and populate user information
    const product = await Product.findById(id).populate('user', 'username avatar createdAt');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count (async, don't wait for it)
    product.incrementViews().catch(err => {
      console.error('Error incrementing views:', err);
    });

    // Get related products (same category, excluding current product)
    const relatedProducts = await Product.getRelatedProducts(
      product._id,
      product.category,
      4
    ).catch(err => {
      console.error('Error getting related products:', err);
      return [];
    });

    res.status(200).json({
      success: true,
      message: 'Product retrieved successfully',
      data: {
        ...product.toJSON(),
        relatedProducts
      }
    });

  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving product'
    });
  }
};

/**
 * @desc    Update product by ID
 * @route   PUT /api/products/:id
 * @access  Private (owner only)
 */
const updateProduct = async (req, res) => {
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

    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (!product.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own products'
      });
    }

    // Extract updatable fields from request body
    const {
      title,
      description,
      category,
      price,
      condition,
      image,
      location,
      tags,
      isAvailable
    } = req.body;

    // Update fields if provided
    if (title !== undefined) product.title = title;
    if (description !== undefined) product.description = description;
    if (category !== undefined) product.category = category;
    if (price !== undefined) product.price = price;
    if (condition !== undefined) product.condition = condition;
    if (image !== undefined) product.image = image;
    if (location !== undefined) product.location = location;
    if (tags !== undefined) product.tags = tags;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();

    // Populate user information for response
    await product.populate('user', 'username avatar');

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });

  } catch (error) {
    console.error('Update product error:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error updating product'
    });
  }
};

/**
 * @desc    Delete product by ID
 * @route   DELETE /api/products/:id
 * @access  Private (owner only)
 */
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find product
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if user owns the product
    if (!product.isOwnedBy(req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own products'
      });
    }

    await Product.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: {
        id: product._id,
        title: product.title
      }
    });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error deleting product'
    });
  }
};

/**
 * @desc    Get products by current user
 * @route   GET /api/products/my
 * @access  Private
 */
const getMyProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Find products owned by current user
    const products = await Product.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get total count
    const totalProducts = await Product.countDocuments({ user: req.user.id });
    const totalPages = Math.ceil(totalProducts / limit);

    res.status(200).json({
      success: true,
      message: 'Your products retrieved successfully',
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get my products error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving your products'
    });
  }
};

/**
 * @desc    Get product categories and conditions
 * @route   GET /api/products/meta
 * @access  Public
 */
const getProductMeta = async (req, res) => {
  try {
    const categories = Product.getCategories();
    const conditions = Product.getConditions();

    res.status(200).json({
      success: true,
      message: 'Product metadata retrieved successfully',
      data: {
        categories,
        conditions
      }
    });

  } catch (error) {
    console.error('Get product meta error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving product metadata'
    });
  }
};

/**
 * @desc    Get search suggestions
 * @route   GET /api/products/suggestions
 * @access  Public
 */
const getSearchSuggestions = async (req, res) => {
  try {
    const { q: query, limit = 5 } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query must be at least 2 characters long'
      });
    }

    const suggestions = await Product.getSearchSuggestions(query, parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'Search suggestions retrieved successfully',
      data: {
        query: query.trim(),
        suggestions: suggestions.length > 0 ? suggestions[0].suggestions : []
      }
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving search suggestions'
    });
  }
};

/**
 * @desc    Get category statistics
 * @route   GET /api/products/stats
 * @access  Public
 */
const getCategoryStats = async (req, res) => {
  try {
    const stats = await Product.getCategoryStats();

    // Transform stats for better readability
    const formattedStats = stats.map(stat => ({
      category: stat._id,
      productCount: stat.count,
      averagePrice: Math.round(stat.averagePrice * 100) / 100,
      priceRange: {
        min: stat.minPrice,
        max: stat.maxPrice
      }
    }));

    // Calculate total products
    const totalProducts = stats.reduce((sum, stat) => sum + stat.count, 0);

    res.status(200).json({
      success: true,
      message: 'Category statistics retrieved successfully',
      data: {
        totalProducts,
        categories: formattedStats
      }
    });

  } catch (error) {
    console.error('Get category stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error retrieving category statistics'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getProductMeta,
  getSearchSuggestions,
  getCategoryStats
};
