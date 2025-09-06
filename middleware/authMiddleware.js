const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        // Extract token from "Bearer <token>"
        token = req.headers.authorization.split(' ')[1];
      } catch (error) {
        return res.status(401).json({
          success: false,
          message: 'Invalid authorization header format'
        });
      }
    }
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided',
        hint: 'Include token in Authorization header as "Bearer <token>"'
      });
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID from token payload
      const user = await User.findById(decoded.userId);
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Token is valid but user no longer exists'
        });
      }
      
      // Attach user to request object
      req.user = {
        id: user._id,
        email: user.email,
        username: user.username
      };
      
      next();
      
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      
      // Handle different JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          hint: 'Please login again to get a new token'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional Authentication Middleware
 * Verifies JWT token if present but doesn't require it
 * Useful for routes that have different behavior for authenticated vs non-authenticated users
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    // If no token, continue without authentication
    if (!token) {
      return next();
    }
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user by ID from token payload
      const user = await User.findById(decoded.userId);
      
      if (user) {
        // Attach user to request object if found
        req.user = {
          id: user._id,
          email: user.email,
          username: user.username
        };
      }
      
      next();
      
    } catch (jwtError) {
      // If token is invalid, continue without authentication
      // This allows the route to handle unauthenticated requests
      next();
    }
    
  } catch (error) {
    console.error('Optional authentication middleware error:', error);
    // Continue without authentication on error
    next();
  }
};

module.exports = {
  authenticate,
  optionalAuthenticate
};
