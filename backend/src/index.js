const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs'); // ✅ Kept for checking folder existence
const env = require('./config/env');

const connectDB = require('./config/db');
const { initializeSocket } = require('./socket');
const { setSocketIO } = require('./controllers/orderController');
const errorHandler = require('./middleware/errorHandler');

const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:5173";

// Import routes
const authRoutes = require('./routes/auth');
const menuRoutes = require('./routes/menu');
const orderRoutes = require('./routes/orders');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// 🛠️ BULLETPROOF STATIC UPLOADS ROUTING FOR LOCAL & RENDER DEPLOYMENTS
let uploadsPath = path.resolve(__dirname, '..', env.UPLOAD_DIR || 'uploads');

// Fallback: If going up a level fails to find the directory, search the current directory level
if (!fs.existsSync(uploadsPath)) {
  uploadsPath = path.resolve(__dirname, env.UPLOAD_DIR || 'uploads');
}

app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use(errorHandler);

// Initialize Socket.io
const io = initializeSocket(server);
setSocketIO(io);

// Connect to MongoDB and start server
connectDB()
  .then(() => {
    const port = process.env.PORT || 5000;
    server.listen(port, () => {
      console.log(`\n🚀 Canteen Backend Server`);
      console.log(`📡 Port: ${port}`);
      console.log(`🌍 Environment: ${env.NODE_ENV}`);
      console.log(`🔗 Frontend URL: ${allowedOrigin}`);
      console.log(`📂 Resolved Uploads Path: ${uploadsPath}`); // Confirms exact directory path in logs
      console.log(`📅 ${new Date().toISOString()}\n`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error.message);
});

module.exports = { app, server };