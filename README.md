# EcoFinds - Sustainable Second-Hand Marketplace Backend

A Node.js/Express backend API for EcoFinds, a sustainable second-hand marketplace platform.

## 🚀 Features

- **User Authentication** - JWT-based auth system
- **Product Management** - CRUD operations for second-hand products  
- **Shopping Cart** - Add/remove items, manage quantities
- **Purchase System** - Simple order processing
- **Search & Filter** - Browse products by category, keywords
- **User Profiles** - Manage user accounts and profiles

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Validation**: express-validator
- **Security**: helmet, bcryptjs for password hashing
- **Development**: nodemon for hot reloading

## 📋 Prerequisites

- Node.js (v16.0.0 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

## 🏗️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/AJ-Senpai/Ctrl-Alt-Defeat-OdooXNMIT.git
   cd Ctrl-Alt-Defeat-OdooXNMIT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: Server port (default: 5000)

4. **Start the server**
   ```bash
   # Development mode with auto-reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📁 Project Structure

```
├── config/
│   └── db.js              # MongoDB connection setup
├── controllers/           # Request handlers
├── middleware/           # Custom middleware functions  
├── models/               # Mongoose models
├── routes/               # API route definitions
│   ├── auth.js          # Authentication routes
│   ├── users.js         # User management routes
│   ├── products.js      # Product CRUD routes
│   ├── cart.js          # Shopping cart routes
│   └── purchases.js     # Purchase/order routes
├── utils/                # Utility functions
├── .env.example         # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── server.js           # Application entry point
```

## 🔗 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Authentication ✅
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login  
- `GET /api/auth/me` - Get current user profile (Protected)
- `POST /api/auth/logout` - User logout (Protected)

### Users ✅  
- `GET /api/users/me` - Get current user profile (Protected)
- `PUT /api/users/me` - Update current user profile (Protected)
- `GET /api/users/me/stats` - Get user dashboard statistics (Protected)
- `GET /api/users/:id` - Get user by ID (Public profile)

### Products ✅
- `GET /api/products` - List products with advanced filtering and pagination (Public)
- `GET /api/products/:id` - Get product details with related products (Public)
- `POST /api/products` - Create product (Protected)
- `PUT /api/products/:id` - Update product (Protected - owner only)
- `DELETE /api/products/:id` - Delete product (Protected - owner only)
- `GET /api/products/my` - Get current user's products (Protected)
- `GET /api/products/meta` - Get categories and conditions (Public)
- `GET /api/products/suggestions` - Get search suggestions (Public)
- `GET /api/products/stats` - Get category statistics (Public)

### Cart & Purchases (Coming in Step 6)
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `PUT /api/cart/update` - Update cart item
- `DELETE /api/cart/remove/:productId` - Remove from cart
- `POST /api/purchases` - Create purchase
- `GET /api/purchases` - Get purchase history

## 🔒 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/ecofinds` |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |

## 📜 Example API Usage

### Authentication Examples

**Register a new user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "username": "johndoe",
    "password": "Password123"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "Password123"
  }'
```

**Get current user profile (requires token):**
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Logout (requires token):**
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Health check:**
```bash
curl -X GET http://localhost:5000/api/health
```

### User Profile Examples

**Get current user profile (requires token):**
```bash
curl -X GET http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Update user profile (requires token):**
```bash
curl -X PUT http://localhost:5000/api/users/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "bio": "I love sustainable shopping and second-hand finds!",
    "avatar": "https://example.com/avatar.jpg"
  }'
```

**Get user statistics for dashboard (requires token):**
```bash
curl -X GET http://localhost:5000/api/users/me/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Get public user profile by ID:**
```bash
curl -X GET http://localhost:5000/api/users/USER_ID_HERE
```

### Product Examples

**Get all products (with advanced filtering):**
```bash
# Basic listing
curl -X GET http://localhost:5000/api/products

# Category filtering
curl -X GET "http://localhost:5000/api/products?category=Electronics"

# Price range filtering
curl -X GET "http://localhost:5000/api/products?minPrice=50&maxPrice=500"

# Condition filtering
curl -X GET "http://localhost:5000/api/products?condition=Like New"

# Text search
curl -X GET "http://localhost:5000/api/products?search=laptop"

# Location-based search
curl -X GET "http://localhost:5000/api/products?location=New York"

# Multiple filters with pagination and sorting
curl -X GET "http://localhost:5000/api/products?category=Electronics&minPrice=50&maxPrice=500&condition=Good&page=1&limit=5&sortBy=price&sortOrder=asc"

# Search with tags
curl -X GET "http://localhost:5000/api/products?tags=laptop,gaming"
```

**Get product by ID:**
```bash
curl -X GET http://localhost:5000/api/products/PRODUCT_ID_HERE
```

**Create new product (requires token):**
```bash
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "MacBook Pro 2020",
    "description": "Excellent condition MacBook Pro with M1 chip, barely used",
    "category": "Electronics",
    "price": 1200.50,
    "condition": "Like New",
    "image": "https://example.com/macbook.jpg",
    "location": "New York, NY",
    "tags": ["laptop", "apple", "macbook", "m1"]
  }'
```

**Update product (requires token, owner only):**
```bash
curl -X PUT http://localhost:5000/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "price": 1100.00,
    "condition": "Good",
    "isAvailable": true
  }'
```

**Delete product (requires token, owner only):**
```bash
curl -X DELETE http://localhost:5000/api/products/PRODUCT_ID_HERE \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Get my products (requires token):**
```bash
curl -X GET http://localhost:5000/api/products/my \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

**Get product metadata (categories and conditions):**
```bash
curl -X GET http://localhost:5000/api/products/meta
```

**Get search suggestions:**
```bash
curl -X GET "http://localhost:5000/api/products/suggestions?q=lap&limit=5"
```

**Get category statistics:**
```bash
curl -X GET http://localhost:5000/api/products/stats
```

## 🧪 Development

```bash
# Install dependencies
npm install

# Start development server with hot reload
npm run dev

# Start production server  
npm start
```

## 📝 Development Status

- ✅ **Step 1**: Project scaffold, Express server, MongoDB connection, route placeholders
- ✅ **Step 2**: User Authentication (JWT, registration, login, middleware)
- ✅ **Step 3**: User profile management (get/update profile, dashboard stats)
- ✅ **Step 4**: Product CRUD with ownership checks, categories, validation
- ✅ **Step 5**: Enhanced browsing, advanced search, filtering, suggestions
- ⏳ **Step 6**: Shopping cart and purchase system

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the package.json file for details.

---

**EcoFinds Team** - Building sustainable commerce solutions 🌱
