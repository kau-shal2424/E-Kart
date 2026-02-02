# E-Kart 🛒

A full-stack e-commerce platform built with React and Flask, featuring a modern user interface, comprehensive admin dashboard, and robust backend API.

![E-Kart](https://img.shields.io/badge/E--Kart-E--Commerce-blue)
![React](https://img.shields.io/badge/React-19.1.1-61DAFB?logo=react)
![Flask](https://img.shields.io/badge/Flask-Python-000000?logo=flask)
![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?logo=mysql)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

E-Kart is a modern, full-featured e-commerce application that provides a seamless shopping experience for customers and powerful management tools for administrators. The platform includes user authentication, product browsing with advanced filtering, shopping cart management, order processing, and comprehensive analytics.

## ✨ Features

### Customer Features
- **User Authentication**: Secure registration and login system with JWT tokens
- **Product Browsing**: Browse products with search, filtering, and sorting capabilities
- **Product Details**: View detailed product information with ratings and reviews
- **Shopping Cart**: Add, update, and remove items from cart with real-time updates
- **Order Management**: Place orders and track order history
- **Product Ratings**: Rate products on a 1-5 star scale
- **Account Management**: Deactivate account with data retention
- **Responsive Design**: Modern UI with Tailwind CSS, optimized for all devices

### Admin Features
- **Admin Dashboard**: Comprehensive overview with key metrics and analytics
- **User Management**: View and manage user accounts
- **Product Management**: Create, update, and manage product inventory
- **Order Management**: View all transactions and update order status
- **Analytics**: 
  - Revenue tracking with daily and monthly breakdowns
  - Top-selling products analysis
  - Order status distribution
  - User activity metrics
- **Transaction Details**: Detailed view of individual orders

### Technical Features
- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Separate customer and admin roles
- **RESTful API**: Well-structured API endpoints
- **Database Migrations**: Automatic schema updates
- **Error Handling**: Comprehensive error handling and validation
- **CORS Support**: Configured for cross-origin requests
- **Pagination**: Efficient data loading for large datasets

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19.1.1
- **Styling**: Tailwind CSS 3.4.17
- **HTTP Client**: Axios 1.12.2
- **Build Tool**: React Scripts 5.0.1
- **Testing**: Jest, React Testing Library

### Backend
- **Framework**: Flask (Python)
- **Database**: MySQL with SQLAlchemy ORM
- **Authentication**: Flask-JWT-Extended
- **Password Hashing**: Werkzeug Security
- **Database Connector**: MySQL Connector

### Database Schema
- **Users**: User accounts with role-based access
- **Products**: Product catalog with metadata
- **Categories**: Product categorization
- **Orders**: Order management with status tracking
- **Order Items**: Individual items within orders
- **Cart**: Shopping cart management
- **Product Meta**: Additional product information (images, ratings, popularity)

## 📁 Project Structure

```
ekart/
├── Ekartweb/                    # Frontend React application
│   ├── public/                  # Static assets
│   │   ├── index.html          # HTML template
│   │   ├── favicon.ico         # Favicon
│   │   └── manifest.json       # PWA manifest
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── AdminDashboard.js      # Admin dashboard with analytics
│   │   │   ├── AdminLogin.js          # Admin authentication
│   │   │   ├── AdminRegister.js       # Admin registration
│   │   │   ├── Cart.js                # Shopping cart component
│   │   │   ├── Drawer.js              # Slide-out drawer component
│   │   │   ├── Home.js                # Landing page
│   │   │   ├── Orders.js              # Order history
│   │   │   ├── ProductDetail.js       # Product details view
│   │   │   ├── ProductList.js         # Product listing with filters
│   │   │   ├── RateProducts.js        # Product rating interface
│   │   │   ├── RatingStars.js         # Star rating component
│   │   │   ├── UserDashboard.js       # User dashboard
│   │   │   ├── UserLogin.js           # User authentication
│   │   │   └── UserRegistration.js    # User registration
│   │   ├── App.js              # Main application component
│   │   ├── App.css             # Application styles
│   │   ├── index.js            # Application entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Frontend dependencies
│   └── tailwind.config.js      # Tailwind CSS configuration
│
└── ekart_backend/              # Backend Flask application
    └── app.py                  # Main Flask application with all routes
```

## 🚀 Installation

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- MySQL Server
- npm or yarn

### Backend Setup

1. **Navigate to the backend directory**:
   ```bash
   cd ekart_backend
   ```

2. **Install Python dependencies**:
   ```bash
   pip install flask flask-sqlalchemy flask-jwt-extended mysql-connector-python werkzeug
   ```

3. **Configure MySQL Database**:
   - Create a MySQL database named `ekart_db`
   - Update the database connection string in `app.py` (line 14):
     ```python
     app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:YOUR_PASSWORD@localhost/ekart_db'
     ```

4. **Run the Flask server**:
   ```bash
   python app.py
   ```
   The backend will start on `http://localhost:5000`

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd Ekartweb
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   The frontend will start on `http://localhost:3000`

## ⚙️ Configuration

### Backend Configuration (`app.py`)

```python
# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'mysql+mysqlconnector://root:PASSWORD@localhost/ekart_db'

# JWT Configuration
app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # Change in production!
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
```

### Frontend Configuration

The frontend uses a proxy configuration in `package.json` to connect to the backend:
```json
"proxy": "http://localhost:5000"
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: { "access_token": "string" }
```

#### Get Profile
```http
GET /api/profile
Authorization: Bearer <token>

Response: {
  "user_id": "string",
  "username": "string",
  "role": "customer|admin"
}
```

### Product Endpoints

#### Get Products
```http
GET /api/products?q=search&category_id=1&page=1&page_size=12&sort=price_asc

Response: {
  "items": [...],
  "total": number,
  "page": number,
  "page_size": number
}
```

#### Get Product Detail
```http
GET /api/products/:product_id

Response: {
  "product": {
    "product_id": number,
    "name": "string",
    "description": "string",
    "price": number,
    "inventory": number,
    "image_url": "string",
    "rating": number,
    "popularity": number
  }
}
```

#### Rate Product
```http
POST /api/products/:product_id/rate
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 1-5
}
```

### Cart Endpoints

#### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

#### Add to Cart
```http
POST /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": number,
  "quantity": number
}
```

#### Update Cart Item
```http
PUT /api/cart
Authorization: Bearer <token>
Content-Type: application/json

{
  "product_id": number,
  "quantity": number
}
```

#### Remove from Cart
```http
DELETE /api/cart/:product_id
Authorization: Bearer <token>
```

### Order Endpoints

#### Place Order
```http
POST /api/orders
Authorization: Bearer <token>

Response: {
  "msg": "Order placed successfully",
  "order_id": number,
  "status": "string",
  "total": number
}
```

#### Get Orders
```http
GET /api/orders
Authorization: Bearer <token>
```

#### Get Order Detail
```http
GET /api/orders/:order_id
Authorization: Bearer <token>
```

### Admin Endpoints

#### Admin Metrics
```http
GET /api/admin/metrics
Authorization: Bearer <admin_token>

Response: {
  "users": {
    "total": number,
    "active": number,
    "inactive": number
  },
  "orders": {
    "total": number,
    "revenue_total": number,
    "by_status": {...}
  },
  "top_products": [...]
}
```

#### Admin Analytics
```http
GET /api/admin/analytics?from=ISO_DATE&to=ISO_DATE
Authorization: Bearer <admin_token>

Response: {
  "total_sales": number,
  "monthly": [...],
  "daily": [...]
}
```

#### Admin Transactions
```http
GET /api/admin/transactions?page=1&page_size=20&from=ISO_DATE&to=ISO_DATE
Authorization: Bearer <admin_token>
```

#### Update Inventory
```http
PATCH /api/admin/products/:product_id/inventory
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "inventory": number
}
```

#### Create Product
```http
POST /api/admin/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "string",
  "description": "string",
  "price": number,
  "inventory": number,
  "image_url": "string" (optional)
}
```

#### Update Order Status
```http
PATCH /api/orders/:order_id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "pending|paid|shipped|delivered|cancelled"
}
```

### Utility Endpoints

#### Health Check
```http
GET /health

Response: {
  "status": "ok",
  "database": "up"
}
```

#### Ping
```http
GET /ping

Response: "pong"
```

## 💻 Usage

### For Customers

1. **Registration**: Navigate to the registration page and create an account
2. **Login**: Sign in with your credentials
3. **Browse Products**: Use search, filters, and sorting to find products
4. **Add to Cart**: Click "Add to Cart" on products you want to purchase
5. **Checkout**: Review your cart and proceed to checkout
6. **Track Orders**: View your order history in the Orders section
7. **Rate Products**: Rate products you've purchased

### For Administrators

1. **Admin Registration**: Register an admin account at `/admin-register`
2. **Admin Login**: Sign in at `/admin-login`
3. **Dashboard**: View key metrics and analytics
4. **Manage Products**: Add new products and update inventory
5. **Manage Orders**: View all transactions and update order status
6. **View Analytics**: Track sales trends and top products
7. **User Management**: View and manage user accounts

## 🎨 Design Features

- **Modern UI**: Clean, gradient-based design with glassmorphism effects
- **Responsive Layout**: Optimized for desktop, tablet, and mobile devices
- **Inter Font**: Modern typography using Google Fonts
- **Color Scheme**: Blue and purple gradient theme
- **Interactive Elements**: Hover effects and smooth transitions
- **Accessible**: Semantic HTML and ARIA labels

## 🔒 Security Features

- **Password Hashing**: Secure password storage using Werkzeug
- **JWT Tokens**: Stateless authentication with expiration
- **Role-Based Access**: Separate customer and admin privileges
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: SQLAlchemy ORM prevents SQL injection
- **CORS Configuration**: Controlled cross-origin access

## 🧪 Testing

Run frontend tests:
```bash
cd Ekartweb
npm test
```

## 📝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👥 Authors

- **Kaushal** - [kau-shal2424](https://github.com/kau-shal2424)

## 🙏 Acknowledgments

- React team for the amazing framework
- Flask team for the lightweight Python web framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and users of this project

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Happy Shopping! 🛍️**
