const mongoose = require('mongoose');

/**
 * Purchase Model Schema
 * Represents completed purchases/orders in the EcoFinds marketplace
 */
const purchaseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Purchase must be associated with a user']
  },
  products: [{
    product: {
      type: mongoose.Schema.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1']
    },
    priceAtPurchase: {
      type: Number,
      required: [true, 'Price at purchase is required'],
      min: [0, 'Price cannot be negative']
    },
    title: {
      type: String,
      required: [true, 'Product title is required for record keeping']
    },
    image: {
      type: String,
      default: ''
    },
    seller: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Seller reference is required']
    }
  }],
  total: {
    type: Number,
    required: [true, 'Total amount is required'],
    min: [0, 'Total cannot be negative']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'cancelled'],
      message: 'Status must be one of: pending, completed, cancelled'
    },
    default: 'completed'
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: ''
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for better query performance
 */
purchaseSchema.index({ user: 1 });
purchaseSchema.index({ purchasedAt: -1 });
purchaseSchema.index({ status: 1 });
purchaseSchema.index({ user: 1, purchasedAt: -1 });
purchaseSchema.index({ 'products.seller': 1 });

/**
 * Virtual for formatted total
 */
purchaseSchema.virtual('formattedTotal').get(function() {
  return `$${this.total.toFixed(2)}`;
});

/**
 * Virtual for total item count
 */
purchaseSchema.virtual('totalItems').get(function() {
  return this.products.reduce((sum, item) => sum + item.quantity, 0);
});

/**
 * Virtual for unique sellers count
 */
purchaseSchema.virtual('sellersCount').get(function() {
  const sellerIds = this.products.map(item => item.seller.toString());
  return new Set(sellerIds).size;
});

/**
 * Virtual for purchase summary
 */
purchaseSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    total: this.total,
    formattedTotal: this.formattedTotal,
    totalItems: this.totalItems,
    sellersCount: this.sellersCount,
    status: this.status,
    purchasedAt: this.purchasedAt
  };
});

/**
 * Pre-save middleware to ensure total accuracy
 */
purchaseSchema.pre('save', function(next) {
  // Recalculate total from products
  let calculatedTotal = 0;
  
  for (const item of this.products) {
    calculatedTotal += item.quantity * item.priceAtPurchase;
  }
  
  this.total = Math.round(calculatedTotal * 100) / 100;
  next();
});

/**
 * Static method to get user's purchase history with pagination
 */
purchaseSchema.statics.getUserPurchases = function(userId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ user: userId })
    .populate({
      path: 'products.product',
      select: 'title description category condition image'
    })
    .populate({
      path: 'products.seller',
      select: 'username avatar'
    })
    .sort({ purchasedAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get purchase statistics for a user
 */
purchaseSchema.statics.getUserPurchaseStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalPurchases: { $sum: 1 },
        totalSpent: { $sum: '$total' },
        totalItems: { $sum: { $sum: '$products.quantity' } },
        avgOrderValue: { $avg: '$total' }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalPurchases: 0,
      totalSpent: 0,
      totalItems: 0,
      avgOrderValue: 0
    };
  }
  
  const result = stats[0];
  return {
    totalPurchases: result.totalPurchases,
    totalSpent: Math.round(result.totalSpent * 100) / 100,
    totalItems: result.totalItems,
    avgOrderValue: Math.round(result.avgOrderValue * 100) / 100
  };
};

/**
 * Static method to create purchase from cart items
 */
purchaseSchema.statics.createFromCart = async function(userId, cartItems) {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cannot create purchase from empty cart');
  }
  
  const products = [];
  let total = 0;
  
  for (const cartItem of cartItems) {
    if (!cartItem.product || !cartItem.product.isAvailable) {
      throw new Error(`Product "${cartItem.product?.title || 'Unknown'}" is no longer available`);
    }
    
    const productData = {
      product: cartItem.product._id,
      quantity: cartItem.quantity,
      priceAtPurchase: cartItem.product.price,
      title: cartItem.product.title,
      image: cartItem.product.image,
      seller: cartItem.product.user
    };
    
    products.push(productData);
    total += cartItem.quantity * cartItem.product.price;
  }
  
  const purchase = new this({
    user: userId,
    products,
    total: Math.round(total * 100) / 100
  });
  
  return await purchase.save();
};

/**
 * Static method to get seller's sales history
 */
purchaseSchema.statics.getSellerSales = function(sellerId, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  
  return this.find({ 'products.seller': sellerId })
    .populate('user', 'username avatar')
    .populate({
      path: 'products.product',
      select: 'title description category condition image'
    })
    .sort({ purchasedAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Instance method to check if purchase belongs to user
 */
purchaseSchema.methods.belongsToUser = function(userId) {
  return this.user.toString() === userId.toString();
};

/**
 * Instance method to get purchase details with populated data
 */
purchaseSchema.methods.getDetailedPurchase = async function() {
  await this.populate([
    {
      path: 'products.product',
      select: 'title description category condition image'
    },
    {
      path: 'products.seller',
      select: 'username avatar'
    }
  ]);
  
  return this;
};

module.exports = mongoose.model('Purchase', purchaseSchema);
