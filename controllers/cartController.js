const { validationResult } = require('express-validator');
const CartItem = require('../models/CartItem');
const Product = require('../models/Product');

/**
 * Add item to cart
 * @route POST /api/cart
 * @access Protected
 */
const addToCart = async (req, res) => {
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

    const { productId, quantity = 1 } = req.body;
    const userId = req.user.id;

    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    if (!product.isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'Product is no longer available'
      });
    }

    // Check if user is trying to add their own product to cart
    if (product.user.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot add your own product to cart'
      });
    }

    // Add or update cart item
    const cartItem = await CartItem.addOrUpdateItem(userId, productId, quantity);
    
    // Populate product info for response
    await cartItem.populate({
      path: 'product',
      select: 'title description price image category condition isAvailable',
      populate: {
        path: 'user',
        select: 'username avatar'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Item added to cart successfully',
      data: {
        cartItem,
        subtotal: cartItem.subtotal
      }
    });

  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to add item to cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user's cart
 * @route GET /api/cart
 * @access Protected
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get cart with total calculation
    const cartData = await CartItem.calculateCartTotal(userId);
    
    // Filter out items with unavailable products
    const availableItems = cartData.items.filter(item => 
      item.product && item.product.isAvailable
    );
    
    // Remove unavailable items from cart
    const unavailableItems = cartData.items.filter(item => 
      !item.product || !item.product.isAvailable
    );
    
    if (unavailableItems.length > 0) {
      const unavailableIds = unavailableItems.map(item => item._id);
      await CartItem.deleteMany({ _id: { $in: unavailableIds } });
    }

    // Recalculate total with only available items
    let total = 0;
    let itemCount = 0;
    
    for (const item of availableItems) {
      total += item.quantity * item.product.price;
      itemCount += item.quantity;
    }

    res.status(200).json({
      success: true,
      message: 'Cart retrieved successfully',
      data: {
        items: availableItems,
        summary: {
          itemCount,
          total: Math.round(total * 100) / 100,
          formattedTotal: `$${(Math.round(total * 100) / 100).toFixed(2)}`
        },
        removedUnavailableItems: unavailableItems.length
      }
    });

  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update cart item quantity
 * @route PUT /api/cart/:id
 * @access Protected
 */
const updateCartItem = async (req, res) => {
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
    const { quantity } = req.body;
    const userId = req.user.id;

    // Find cart item
    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check ownership
    if (!cartItem.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own cart items'
      });
    }

    // Check if product is still available
    const product = await Product.findById(cartItem.product);
    if (!product || !product.isAvailable) {
      // Remove item if product is no longer available
      await CartItem.findByIdAndDelete(id);
      return res.status(400).json({
        success: false,
        message: 'Product is no longer available and has been removed from cart'
      });
    }

    // Update quantity
    cartItem.quantity = quantity;
    await cartItem.save();

    // Populate for response
    await cartItem.populate({
      path: 'product',
      select: 'title description price image category condition isAvailable',
      populate: {
        path: 'user',
        select: 'username avatar'
      }
    });

    res.status(200).json({
      success: true,
      message: 'Cart item updated successfully',
      data: {
        cartItem,
        subtotal: cartItem.subtotal
      }
    });

  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to update cart item',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Remove item from cart
 * @route DELETE /api/cart/:id
 * @access Protected
 */
const removeFromCart = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find cart item
    const cartItem = await CartItem.findById(id);
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found'
      });
    }

    // Check ownership
    if (!cartItem.belongsToUser(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only remove your own cart items'
      });
    }

    // Remove item
    await CartItem.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart successfully'
    });

  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to remove item from cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Clear entire cart
 * @route DELETE /api/cart
 * @access Protected
 */
const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await CartItem.clearUserCart(userId);

    res.status(200).json({
      success: true,
      message: 'Cart cleared successfully',
      data: {
        deletedCount: result.deletedCount
      }
    });

  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to clear cart',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
