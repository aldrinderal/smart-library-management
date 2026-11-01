const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const bookRoutes = require('./routes/bookRoutes');
const bookCopyRoutes = require('./routes/bookCopyRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const studentSelfRoutes = require('./routes/studentSelfRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in prototype for easy dev & network testing
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Smart Library Management System API',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/book-copies', bookCopyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/student/me', studentSelfRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Global Error]', err.stack || err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;

