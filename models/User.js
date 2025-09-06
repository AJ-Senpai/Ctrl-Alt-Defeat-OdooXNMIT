const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model Schema
 * Represents users in the EcoFinds marketplace
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address'
    ]
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  bio: {
    type: String,
    trim: true,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  avatar: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // If avatar is provided, validate it's a valid URL
        if (!v) return true; // Allow empty string
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
      },
      message: 'Avatar must be a valid image URL (jpg, jpeg, png, gif, webp)'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false // Don't include password in query results by default
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

/**
 * Pre-save middleware to hash password before saving to database
 * Only runs when password is modified (new user or password change)
 */
userSchema.pre('save', async function(next) {
  // Only hash password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Generate salt with cost factor of 12
    const salt = await bcrypt.genSalt(12);
    
    // Hash password with the generated salt
    this.password = await bcrypt.hash(this.password, salt);
    
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare provided password with hashed password
 * @param {string} candidatePassword - The password to compare
 * @returns {boolean} - True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

/**
 * Instance method to get user data without sensitive information
 * @returns {Object} - User object without password and sensitive data
 */
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  delete user.__v;
  return user;
};

/**
 * Static method to find user by email (case insensitive)
 * @param {string} email - Email to search for
 * @returns {Object|null} - User object or null if not found
 */
userSchema.statics.findByEmail = async function(email) {
  return await this.findOne({ email: email.toLowerCase() });
};

/**
 * Index for faster email queries
 */
userSchema.index({ email: 1 });

/**
 * Virtual for user's full profile URL (can be extended later)
 */
userSchema.virtual('profileUrl').get(function() {
  return `/api/users/${this._id}`;
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
