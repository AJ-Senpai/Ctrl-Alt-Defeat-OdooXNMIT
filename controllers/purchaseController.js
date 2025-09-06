const { validationResult } = require('express-validator');
const Purchase = require('../models/Purchase');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

/**
 * Create purchase from user's cart
 * @route POST /api/purchases
 * @access Protected
 */
const createPurchase = async (req, res) => {
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

    const userId = req.user.id;
    const { notes } = req.body;

    // Get user's cart
    const cartItems = await CartItem.getUserCart(userId);
    
    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create purchase from empty cart'
      });
    }

    // Validate all cart items and check availability
    const validItems = [];
    const unavailableItems = [];

    for (const cartItem of cartItems) {
      if (!cartItem.product) {
        unavailableItems.push({
          cartItemId: cartItem._id,
          reason: 'Product not found'
        });
        continue;
      }

      if (!cartItem.product.isAvailable) {
        unavailableItems.push({
          cartItemId: cartItem._id,
          productTitle: cartItem.product.title,
          reason: 'Product no longer available'
        });
        continue;
      }

      // Check if user is trying to buy their own product
      if (cartItem.product.user.toString() === userId) {
        unavailableItems.push({
          cartItemId: cartItem._id,
          productTitle: cartItem.product.title,
          reason: 'Cannot purchase your own product'
        });
        continue;
      }

      validItems.push(cartItem);
    }

    // Remove unavailable items from cart
    if (unavailableItems.length > 0) {
      const unavailableIds = unavailableItems.map(item => item.cartItemId);
      await CartItem.deleteMany({ _id: { $in: unavailableIds } });
    }

    // Check if we have valid items to purchase
    if (validItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid items in cart to purchase',
        unavailableItems: unavailableItems
      });
    }

    // Create purchase from valid cart items
    const purchase = await Purchase.createFromCart(userId, validItems);
    
    // Add notes if provided
    if (notes && notes.trim()) {
      purchase.notes = notes.trim();
      await purchase.save();
    }

    // Clear user's cart after successful purchase
    await CartItem.clearUserCart(userId);

    // Populate purchase data for response
    await purchase.populate([
      {
        path: 'products.product',
        select: 'title description category condition image'
      },
      {
        path: 'products.seller',
        select: 'username avatar'
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'Purchase created successfully',
      data: {
        purchase,
        summary: {
          purchaseId: purchase._id,
          totalItems: purchase.totalItems,
          total: purchase.total,
          formattedTotal: purchase.formattedTotal,
          sellersCount: purchase.sellersCount,
          purchasedAt: purchase.purchasedAt
        },
        removedUnavailableItems: unavailableItems.length > 0 ? unavailableItems : undefined
      }
    });

  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to create purchase',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's purchase history
 * @route GET /api/purchases
 * @access Protected
 */
const getPurchases = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Validate pagination parameters
    if (page < 1) page = 1;
    if (limit < 1 || limit > 50) limit = 10;

    // Get purchases with pagination
    const purchases = await Purchase.getUserPurchases(userId, page, limit);
    
    // Get total count for pagination info
    const totalPurchases = await Purchase.countDocuments({ user: userId });
    const totalPages = Math.ceil(totalPurchases / limit);

    // Get user purchase statistics
    const stats = await Purchase.getUserPurchaseStats(userId);

    res.status(200).json({
      success: true,
      message: 'Purchase history retrieved successfully',
      data: {
        purchases,
        pagination: {
          currentPage: page,
          totalPages,
          totalPurchases,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit
        },
        stats: {
          totalPurchases: stats.totalPurchases,
          totalSpent: stats.totalSpent,
          totalItems: stats.totalItems,
          averageOrderValue: stats.avgOrderValue,
          formattedTotalSpent: `$${stats.totalSpent.toFixed(2)}`,
          formattedAvgOrderValue: `$${stats.avgOrderValue.toFixed(2)}`
        }
      }
    });

  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve purchase history',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get single purchase details
 * @route GET /api/purchases/:id
 * @access Protected
 */
const getPurchaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find purchase
    const purchase = await Purchase.findById(id);
    
    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Check ownership
    if (!purchase.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own purchases'
      });
    }

    // Get detailed purchase info
    await purchase.getDetailedPurchase();

    res.status(200).json({
      success: true,
      message: 'Purchase details retrieved successfully',
      data: {
        purchase,
        summary: purchase.summary
      }
    });

  } catch (error) {
    console.error('Get purchase by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve purchase details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get purchase statistics for dashboard
 * @route GET /api/purchases/stats
 * @access Protected
 */
const getPurchaseStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await Purchase.getUserPurchaseStats(userId);

    // Get recent purchases (last 5)
    const recentPurchases = await Purchase.getUserPurchases(userId, 1, 5);

    // Get monthly spending for the current year
    const currentYear = new Date().getFullYear();
    const monthlySpending = await Purchase.aggregate([
      {
        $match: {
          user: userId,
          purchasedAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lte: new Date(`${currentYear}-12-31`)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$purchasedAt' },
          totalSpent: { $sum: '$total' },
          purchaseCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id': 1 }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'Purchase statistics retrieved successfully',
      data: {
        overview: {
          totalPurchases: stats.totalPurchases,
          totalSpent: stats.totalSpent,
          totalItems: stats.totalItems,
          averageOrderValue: stats.avgOrderValue,
          formattedTotalSpent: `$${stats.totalSpent.toFixed(2)}`,
          formattedAvgOrderValue: `$${stats.avgOrderValue.toFixed(2)}`
        },
        recentPurchases: recentPurchases.map(purchase => ({
          id: purchase._id,
          total: purchase.total,
          formattedTotal: purchase.formattedTotal,
          totalItems: purchase.totalItems,
          purchasedAt: purchase.purchasedAt,
          status: purchase.status
        })),
        monthlySpending: monthlySpending.map(month => ({
          month: month._id,
          totalSpent: Math.round(month.totalSpent * 100) / 100,
          formattedTotalSpent: `$${(Math.round(month.totalSpent * 100) / 100).toFixed(2)}`,
          purchaseCount: month.purchaseCount
        }))
      }
    });

  } catch (error) {
    console.error('Get purchase stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve purchase statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchaseStats
};
