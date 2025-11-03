/**
 * Application Constants
 */

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
};

// User Types
const USER_TYPES = {
  FREELANCER: 'freelancer',
  CLIENT: 'client',
  AGENCY: 'agency',
  ADMIN: 'admin'
};

// Job Post Status
const JOB_STATUS = {
  DRAFT: 'draft',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Application Status
const APPLICATION_STATUS = {
  PENDING: 'pending',
  REVIEWED: 'reviewed',
  SHORTLISTED: 'shortlisted',
  REJECTED: 'rejected',
  ACCEPTED: 'accepted',
  WITHDRAWN: 'withdrawn'
};

// Contract Status
const CONTRACT_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed'
};

// Message Types
const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system',
  CONTRACT: 'contract',
  VIDEO_CALL: 'video_call'
};

// Payment Schedules
const PAYMENT_SCHEDULES = {
  HOURLY: 'hourly',
  FIXED: 'fixed',
  MILESTONE: 'milestone'
};

// Budget Types
const BUDGET_TYPES = {
  HOURLY: 'hourly',
  FIXED: 'fixed'
};

// Experience Levels
const EXPERIENCE_LEVELS = {
  ENTRY: 'entry',
  INTERMEDIATE: 'intermediate',
  EXPERT: 'expert'
};

// Connect Types
const CONNECT_TYPES = {
  PURCHASED: 'purchased',
  EARNED: 'earned',
  BONUS: 'bonus',
  REFUND: 'refund'
};

// Connect Status
const CONNECT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// File Upload
const FILE_UPLOAD = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// Rate Limiting
const RATE_LIMITS = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 1000, // Increased for development
  MESSAGE: 'Too many requests from this IP, please try again later.'
};

// JWT
const JWT = {
  EXPIRES_IN: '24h',
  REFRESH_EXPIRES_IN: '7d',
  ALGORITHM: 'HS256'
};

// Database
const DATABASE = {
  POOL: {
    MIN: 0,
    MAX: 5,
    ACQUIRE: 30000,
    IDLE: 10000
  }
};

// Centrifugo v5
const CENTRIFUGO = {
  DEFAULT_URL: 'ws://localhost:8000/connection/websocket',
  API_URL: 'http://localhost:8000/api',
  CHANNELS: {
    CONVERSATION: 'chat:conversation',
    USER: 'chat:user'
  }
};

module.exports = {
  HTTP_STATUS,
  USER_TYPES,
  JOB_STATUS,
  APPLICATION_STATUS,
  CONTRACT_STATUS,
  MESSAGE_TYPES,
  PAYMENT_SCHEDULES,
  BUDGET_TYPES,
  EXPERIENCE_LEVELS,
  CONNECT_TYPES,
  CONNECT_STATUS,
  PAGINATION,
  FILE_UPLOAD,
  RATE_LIMITS,
  JWT,
  DATABASE,
  CENTRIFUGO
};
