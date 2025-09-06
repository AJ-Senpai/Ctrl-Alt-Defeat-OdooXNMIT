const { body } = require('express-validator');

/**
 * Validation rules for user registration
 */
const validateRegister = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('username')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number')
];

/**
 * Validation rules for user login
 */
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

/**
 * Validation rules for password change
 */
const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

/**
 * Validation rules for profile update
 */
const validateProfileUpdate = [
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username can only contain letters, numbers, underscores, and hyphens'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio cannot exceed 500 characters'),
  
  body('avatar')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty string
      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
        throw new Error('Avatar must be a valid image URL (jpg, jpeg, png, gif, webp)');
      }
      return true;
    })
];

/**
 * Validation rules for product creation
 */
const validateProductCreate = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Product description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['Electronics', 'Clothing', 'Furniture', 'Books', 'Miscellaneous'])
    .withMessage('Category must be one of: Electronics, Clothing, Furniture, Books, Miscellaneous'),
  
  body('price')
    .isFloat({ min: 0, max: 99999.99 })
    .withMessage('Price must be a number between 0 and 99999.99'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be one of: New, Like New, Good, Fair, Poor'),
  
  body('image')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty string
      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
        throw new Error('Image must be a valid image URL (jpg, jpeg, png, gif, webp)');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
    .custom((tags) => {
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 30) {
            throw new Error('Each tag must be a non-empty string with maximum 30 characters');
          }
        }
      }
      return true;
    })
];

/**
 * Validation rules for product update
 */
const validateProductUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Product title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Product description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['Electronics', 'Clothing', 'Furniture', 'Books', 'Miscellaneous'])
    .withMessage('Category must be one of: Electronics, Clothing, Furniture, Books, Miscellaneous'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 99999.99 })
    .withMessage('Price must be a number between 0 and 99999.99'),
  
  body('condition')
    .optional()
    .isIn(['New', 'Like New', 'Good', 'Fair', 'Poor'])
    .withMessage('Condition must be one of: New, Like New, Good, Fair, Poor'),
  
  body('image')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Allow empty string
      if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(value)) {
        throw new Error('Image must be a valid image URL (jpg, jpeg, png, gif, webp)');
      }
      return true;
    }),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location cannot exceed 100 characters'),
  
  body('tags')
    .optional()
    .isArray({ max: 10 })
    .withMessage('Maximum 10 tags allowed')
    .custom((tags) => {
      if (tags && Array.isArray(tags)) {
        for (const tag of tags) {
          if (typeof tag !== 'string' || tag.trim().length === 0 || tag.length > 30) {
            throw new Error('Each tag must be a non-empty string with maximum 30 characters');
          }
        }
      }
      return true;
    }),
  
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('isAvailable must be a boolean value')
];

/**
 * Validation rules for adding item to cart
 */
const validateAddToCart = [
  body('productId')
    .isMongoId()
    .withMessage('Invalid product ID format'),
  
  body('quantity')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be a number between 1 and 10')
];

/**
 * Validation rules for updating cart item
 */
const validateUpdateCartItem = [
  body('quantity')
    .isInt({ min: 1, max: 10 })
    .withMessage('Quantity must be a number between 1 and 10')
];

/**
 * Validation rules for creating purchase
 */
const validateCreatePurchase = [
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes cannot exceed 500 characters')
];

module.exports = {
  validateRegister,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateProductCreate,
  validateProductUpdate,
  validateAddToCart,
  validateUpdateCartItem,
  validateCreatePurchase
};
