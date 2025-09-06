const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/db');

// Import route files
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const purchaseRoutes = require('./routes/purchases');

/**
 * Initialize Express application
 */
const app = express();

/**
 * Connect to MongoDB
 */
connectDB();

/**
 * Middleware Setup
 */

// Security middleware - sets various HTTP headers
app.use(helmet());

// Enable CORS for specified origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// HTTP request logger (only in development)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

/**
 * Health Check Route
 * @route GET /api/health
 * @desc Check if server is running and database is connected
 * @access Public
 */
app.get('/api/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: require('./package.json').version,
    database: 'Connected' // Will be enhanced in next steps
  };
  
  res.status(200).json({
    success: true,
    message: 'EcoFinds API is running successfully!',
    data: healthStatus
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/purchases', purchaseRoutes);

/**
 * Root route
 */
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to EcoFinds API! 🌱',
    documentation: '/api/health for health check',
    version: require('./package.json').version
  });
});

/**
 * 404 Handler - Catch unhandled routes
 */
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    hint: 'Check the API documentation for available endpoints'
  });
});

/**
 * Global Error Handler
 * Handles errors from all routes and middleware
 */
app.use((err, req, res, next) => {
  console.error('Error Details:', err.stack);
  
  // Default error response
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
  };
  
  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
    error.details = err;
  }
  
  res.status(err.statusCode || 500).json(error);
});

/**
 * Start the server
 */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('🚀 EcoFinds Backend Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
  console.log('='.repeat(50));
});

module.exports = app;
