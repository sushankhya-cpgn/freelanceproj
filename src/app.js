/**
 * WorkLab API Server
 * Main application entry point
 */
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const http = require('http');
require('dotenv').config();


// Import configurations
const swaggerSpec = require('./config/swagger');
const { connectDB } = require('./db/config/database');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { RATE_LIMITS } = require('./constants');

// Import routes
const authRoutes = require('./routes/authRoutes');
const oauthRoutes = require('./routes/oauthRoutes');
const userRoutes = require('./routes/userRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const connectRoutes = require('./routes/connectRoutes');
const contractRoutes = require('./routes/contractRoutes');
const messageRoutes = require('./routes/messageRoutes');
const agencyRoutes = require('./routes/agencyRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const clientRoutes = require('./routes/clientRoutes');
const jobPostRoutes = require('./routes/jobPostRoutes');
const centrifugoRoutes = require('./routes/centrifugoRoutes');
const novuRoutes = require('./routes/novuRoutes');
const jitsiRoutes = require('./routes/jitsiRoutes');
const callNoteRoutes = require('./routes/callNoteRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const requestLogger = require('./middleware/logrequest');

app.use(requestLogger);

// Connect to database
connectDB();

// Initialize Passport
const passport = require('./config/passport');
app.use(passport.initialize());

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      // Allow images from same origin, data URLs, and any http/https origins (e.g., API server serving /uploads)
      imgSrc: ["'self'", "data:", "https:", "http:"],
    },
  },
  // Permit cross-origin resource loading for images to avoid CORP blocking in browsers
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: RATE_LIMITS.WINDOW_MS,
  max: RATE_LIMITS.MAX_REQUESTS,
  message: {
    error: RATE_LIMITS.MESSAGE,
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for OPTIONS requests (CORS preflight)
    if (req.method === 'OPTIONS') return true;
    
    // Skip rate limiting in development environment
    if (process.env.NODE_ENV === 'development') return true;
    
    return false;
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WorkLab API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'WorkLab API - Upwork Clone Backend',
    version: '1.0.0',
    status: 'active',
    documentation: '/api-docs',
    health: '/health',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      jobApplications: '/api/job-applications',
      connects: '/api/connects',
      contracts: '/api/contracts',
      messages: '/api/messages',
      agencies: '/api/agencies',
      freelancers: '/api/freelancer',
      clients: '/api/client',
      jobs: '/api/jobs',
      centrifugo: '/api/centrifugo'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', oauthRoutes);
app.use('/api/users', userRoutes);
app.use('/api/job-applications', jobApplicationRoutes);
app.use('/api/connects', connectRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/agencies', agencyRoutes);
app.use('/api/freelancer', freelancerRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/jobs', jobPostRoutes);
app.use('/api/centrifugo', centrifugoRoutes);
app.use('/api/novu', novuRoutes);
app.use('/api/jitsi', jitsiRoutes);
app.use('/api/call-notes', callNoteRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api-docs',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/auth/me',
      'GET /api/users',
      'POST /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      // Job Applications
      'GET /api/job-applications',
      'GET /api/job-applications/my-applications',
      'GET /api/job-applications/job/:jobPostId',
      'GET /api/job-applications/:applicationId',
      'PUT /api/job-applications/:applicationId/status',
      'PUT /api/job-applications/:applicationId/withdraw',
      'GET /api/job-applications/statistics',
      'POST /api/job-applications',
      'GET /api/connects',
      'POST /api/connects/purchase',
      'GET /api/contracts',
      'POST /api/contracts',
      'GET /api/messages/conversations',
      'POST /api/messages',
      'GET /api/agencies',
      'POST /api/agencies',
      'GET /api/freelancer',
      'GET /api/client',
      'GET /api/jobs',
      'POST /api/jobs',
      'POST /api/centrifugo/token',
      'POST /api/centrifugo/send-message',
      'GET /api/centrifugo/history/:userId1/:userId2',
      'GET /api/centrifugo/presence/:userId1/:userId2',
      'POST /api/centrifugo/mark-read'
    ]
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const host = '0.0.0.0';
server.listen(port, host, () => {
  console.log(`WorkLab API Server running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://${host}:${port}/health`);
  console.log(`API Documentation: http://${host}:${port}/api-docs`);
  console.log(`Centrifugo Server: ${process.env.CENTRIFUGO_URL || 'ws://localhost:8000/connection/websocket'}`);
  console.log(`Centrifugo API: ${process.env.CENTRIFUGO_API_URL || 'http://localhost:8000/api'}`);
});

module.exports = { app, server };