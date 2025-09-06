const mongoose = require('mongoose');

/**
 * CartItem Model Schema
 * Represents items in a user's shopping cart
 */
const cartItemSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Cart item must be associated with a user']
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: 'Product',
    required: [true, 'Cart item must reference a product']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Cannot add more than 10 of the same item'],
    default: 1
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for better query performance
 */
cartItemSchema.index({ user: 1 });
cartItemSchema.index({ user: 1, product: 1 }, { unique: true }); // Prevent duplicate items
cartItemSchema.index({ addedAt: -1 });

/**
 * Virtual for subtotal (quantity * product price)
 * Note: This will be calculated when product is populated
 */
cartItemSchema.virtual('subtotal').get(function() {
  if (this.product && this.product.price) {
    return Math.round(this.quantity * this.product.price * 100) / 100;
  }
  return 0;
});

/**
 * Pre-save middleware to validate product availability
 */
cartItemSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('product')) {
    try {
      const Product = mongoose.model('Product');
      const product = await Product.findById(this.product);
      
      if (!product) {
        return next(new Error('Product not found'));
      }
      
      if (!product.isAvailable) {
        return next(new Error('Product is no longer available'));
      }
      
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

/**
 * Static method to get user's cart with populated product info
 */
cartItemSchema.statics.getUserCart = function(userId) {
  return this.find({ user: userId })
    .populate({
      path: 'product',
      select: 'title description price image category condition isAvailable user',
      populate: {
        path: 'user',
        select: 'username avatar'
      }
    })
    .sort({ addedAt: -1 });
};

/**
 * Static method to calculate cart total
 */
cartItemSchema.statics.calculateCartTotal = async function(userId) {
  const cartItems = await this.getUserCart(userId);
  
  let total = 0;
  let itemCount = 0;
  
  for (const item of cartItems) {
    if (item.product && item.product.isAvailable) {
      total += item.quantity * item.product.price;
      itemCount += item.quantity;
    }
  }
  
  return {
    total: Math.round(total * 100) / 100,
    itemCount,
    items: cartItems
  };
};

/**
 * Static method to check if user owns cart item
 */
cartItemSchema.statics.isOwnedByUser = async function(cartItemId, userId) {
  const cartItem = await this.findById(cartItemId);
  return cartItem && cartItem.user.toString() === userId.toString();
};

/**
 * Static method to add or update cart item
 */
cartItemSchema.statics.addOrUpdateItem = async function(userId, productId, quantity = 1) {
  try {
    // Check if item already exists in cart
    let cartItem = await this.findOne({ user: userId, product: productId });
    
    if (cartItem) {
      // Update existing item
      cartItem.quantity = Math.min(cartItem.quantity + quantity, 10); // Max 10 items
      await cartItem.save();
      return cartItem;
    } else {
      // Create new cart item
      cartItem = new this({
        user: userId,
        product: productId,
        quantity: Math.min(quantity, 10)
      });
      await cartItem.save();
      return cartItem;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Static method to clear user's cart
 */
cartItemSchema.statics.clearUserCart = function(userId) {
  return this.deleteMany({ user: userId });
};

/**
 * Instance method to check if this cart item belongs to user
 */
cartItemSchema.methods.belongsToUser = function(userId) {
  return this.user.toString() === userId.toString();
};

module.exports = mongoose.model('CartItem', cartItemSchema);
