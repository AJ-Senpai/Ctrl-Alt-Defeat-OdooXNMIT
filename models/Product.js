const mongoose = require('mongoose');

/**
 * Product Model Schema
 * Represents second-hand products in the EcoFinds marketplace
 */
const productSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Product must be associated with a user']
  },
  title: {
    type: String,
    required: [true, 'Product title is required'],
    trim: true,
    minlength: [3, 'Product title must be at least 3 characters long'],
    maxlength: [100, 'Product title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    minlength: [10, 'Product description must be at least 10 characters long'],
    maxlength: [1000, 'Product description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Product category is required'],
    enum: {
      values: ['Electronics', 'Clothing', 'Furniture', 'Books', 'Miscellaneous'],
      message: 'Category must be one of: Electronics, Clothing, Furniture, Books, Miscellaneous'
    }
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
    max: [99999.99, 'Price cannot exceed $99,999.99']
  },
  condition: {
    type: String,
    enum: {
      values: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
      message: 'Condition must be one of: New, Like New, Good, Fair, Poor'
    },
    default: 'Good'
  },
  image: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // If image is provided, validate it's a valid URL
        if (!v) return true; // Allow empty string
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Image must be a valid image URL (jpg, jpeg, png, gif, webp)'
    }
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  location: {
    type: String,
    trim: true,
    maxlength: [100, 'Location cannot exceed 100 characters'],
    default: ''
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true, // Automatically adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

/**
 * Indexes for better query performance
 */
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ user: 1 });
productSchema.index({ isAvailable: 1 });
productSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Text search index

// Compound indexes for common query patterns
productSchema.index({ isAvailable: 1, category: 1, price: 1 });
productSchema.index({ isAvailable: 1, createdAt: -1 });
productSchema.index({ user: 1, isAvailable: 1 });
productSchema.index({ category: 1, condition: 1 });
productSchema.index({ location: 1, isAvailable: 1 });

/**
 * Virtual for product URL
 */
productSchema.virtual('productUrl').get(function() {
  return `/api/products/${this._id}`;
});

/**
 * Virtual for formatted price
 */
productSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

/**
 * Pre-save middleware to ensure price has max 2 decimal places
 */
productSchema.pre('save', function(next) {
  if (this.isModified('price')) {
    this.price = Math.round(this.price * 100) / 100;
  }
  next();
});

/**
 * Instance method to increment view count
 */
productSchema.methods.incrementViews = async function() {
  this.views = this.views + 1;
  return await this.save();
};

/**
 * Instance method to check if user owns this product
 */
productSchema.methods.isOwnedBy = function(userId) {
  return this.user.toString() === userId.toString();
};

/**
 * Static method to find products by category
 */
productSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category,
    isAvailable: true 
  }).populate('user', 'username avatar');
};

/**
 * Static method to find available products with pagination
 */
productSchema.statics.findAvailable = function(page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({ isAvailable: true })
    .populate('user', 'username avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Static method for text search
 */
productSchema.statics.searchProducts = function(query, page = 1, limit = 10) {
  const skip = (page - 1) * limit;
  return this.find({
    $text: { $search: query },
    isAvailable: true
  })
  .populate('user', 'username avatar')
  .sort({ score: { $meta: 'textScore' }, createdAt: -1 })
  .skip(skip)
  .limit(limit);
};

/**
 * Static method to get product categories
 */
productSchema.statics.getCategories = function() {
  return ['Electronics', 'Clothing', 'Furniture', 'Books', 'Miscellaneous'];
};

/**
 * Static method to get product conditions
 */
productSchema.statics.getConditions = function() {
  return ['New', 'Like New', 'Good', 'Fair', 'Poor'];
};

/**
 * Static method for advanced search with multiple filters
 */
productSchema.statics.advancedSearch = function(options = {}) {
  const {
    search,
    category,
    condition,
    minPrice,
    maxPrice,
    location,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = options;

  let query = { isAvailable: true };
  let sort = {};

  // Text search
  if (search && search.trim()) {
    query.$text = { $search: search.trim() };
    sort.score = { $meta: 'textScore' };
  }

  // Category filter
  if (category) {
    query.category = category;
  }

  // Condition filter
  if (condition) {
    query.condition = condition;
  }

  // Price range filter
  if (minPrice !== undefined || maxPrice !== undefined) {
    query.price = {};
    if (minPrice !== undefined) query.price.$gte = minPrice;
    if (maxPrice !== undefined) query.price.$lte = maxPrice;
  }

  // Location filter (case-insensitive partial match)
  if (location && location.trim()) {
    query.location = { $regex: new RegExp(location.trim(), 'i') };
  }

  // Tags filter
  if (tags && Array.isArray(tags) && tags.length > 0) {
    query.tags = { $in: tags };
  }

  // Sorting
  const sortOrderNum = sortOrder.toLowerCase() === 'asc' ? 1 : -1;
  sort[sortBy] = sortOrderNum;

  // Pagination
  const skip = (page - 1) * limit;

  return this.find(query)
    .populate('user', 'username avatar')
    .sort(sort)
    .skip(skip)
    .limit(limit);
};

/**
 * Static method to get search suggestions based on existing products
 */
productSchema.statics.getSearchSuggestions = function(query, limit = 5) {
  if (!query || query.trim().length < 2) {
    return Promise.resolve([]);
  }

  const searchRegex = new RegExp(query.trim(), 'i');
  
  return this.aggregate([
    {
      $match: {
        isAvailable: true,
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $elemMatch: { $regex: searchRegex } } }
        ]
      }
    },
    {
      $group: {
        _id: null,
        suggestions: {
          $addToSet: {
            $trim: {
              input: { $toLower: '$title' }
            }
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        suggestions: { $slice: ['$suggestions', limit] }
      }
    }
  ]);
};

/**
 * Static method to get category statistics
 */
productSchema.statics.getCategoryStats = function() {
  return this.aggregate([
    {
      $match: { isAvailable: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        averagePrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

/**
 * Static method to get related products (same category, excluding current product)
 */
productSchema.statics.getRelatedProducts = function(productId, category, limit = 4) {
  return this.find({
    _id: { $ne: productId },
    category: category,
    isAvailable: true
  })
  .populate('user', 'username avatar')
  .sort({ views: -1, createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Product', productSchema);
