const jwt = require('jsonwebtoken');
const db = require('../db/models/index.js');
const sessionService = require('../services/sessionService');

// @desc    Verify JWT token with session validation
// @access  Private
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // Validate session using session service
    const sessionData = await sessionService.validateSession(token);

    req.userId = sessionData.userId;
    req.user = sessionData.user;
    req.userType = sessionData.user.userType;
    req.sessionId = sessionData.sessionId;
    next();
  } catch (error) {
    if (error.message === 'Invalid token' || error.message === 'Token expired') {
      return res.status(401).json({ error: error.message });
    }
    if (error.message === 'Session not found or expired') {
      return res.status(401).json({ error: 'Session expired. Please login again.' });
    }
    if (error.message === 'User not found or inactive') {
      return res.status(401).json({ error: 'Account is deactivated' });
    }
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

// @desc    Check if user is verified
// @access  Private
const requireEmailVerification = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      error: 'Email verification required',
      message: 'Please verify your email address to access this feature'
    });
  }
  next();
};

// @desc    Check user role
// @access  Private
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This feature requires one of the following roles: ${roles.join(', ')}`
      });
    }
    next();
  };
};

// @desc    Check if user is freelancer
// @access  Private
const requireFreelancer = requireRole('freelancer');

// @desc    Check if user is client
// @access  Private
const requireClient = requireRole('client');

// @desc    Check if user is agency
// @access  Private
const requireAgency = requireRole('agency');

// @desc    Check if user is freelancer or agency
// @access  Private
const requireFreelancerOrAgency = requireRole('freelancer', 'agency');

// @desc    Check if user is client or agency
// @access  Private
const requireClientOrAgency = requireRole('client', 'agency');

// @desc    Optional authentication (doesn't fail if no token)
// @access  Public
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.userId = null;
      req.user = null;
      req.userType = null;
      req.sessionId = null;
      return next();
    }

    // Try to validate session, but don't fail if invalid
    try {
      const sessionData = await sessionService.validateSession(token);
      req.userId = sessionData.userId;
      req.user = sessionData.user;
      req.userType = sessionData.user.userType;
      req.sessionId = sessionData.sessionId;
    } catch (error) {
      // If session validation fails, set user to null but continue
      req.userId = null;
      req.user = null;
      req.userType = null;
      req.sessionId = null;
    }

    next();
  } catch (error) {
    req.userId = null;
    req.user = null;
    req.userType = null;
    req.sessionId = null;
    next();
  }
};

// @desc    Check if user owns resource
// @access  Private
const requireOwnership = (resourceModel, resourceIdParam = 'id', userIdField = 'userId') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params[resourceIdParam];
      const userId = req.userId;

      const resource = await db[resourceModel].findByPk(resourceId);
      
      if (!resource) {
        return res.status(404).json({ error: 'Resource not found' });
      }

      if (resource[userIdField] !== userId) {
        return res.status(403).json({ error: 'Not authorized to access this resource' });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

// @desc    Check if user can access contract
// @access  Private
const requireContractAccess = async (req, res, next) => {
  try {
    const { contractId } = req.params;
    const userId = req.userId;

    const contract = await db.Contract.findByPk(contractId);
    
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Check if user is client or freelancer
    let isAuthorized = contract.clientId === userId;
    
    if (!isAuthorized) {
      // Check if user is the freelancer (either direct match or through freelancer record)
      if (contract.freelancerId === userId) {
        isAuthorized = true;
      } else {
        // Check if the freelancer record belongs to this user
        const freelancer = await db.Freelancer.findByPk(contract.freelancerId);
        if (freelancer && freelancer.userId === userId) {
          isAuthorized = true;
        }
      }
    }
    
    if (!isAuthorized) {
      return res.status(403).json({ error: 'Not authorized to access this contract' });
    }

    req.contract = contract;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Contract access check failed' });
  }
};

// @desc    Check if user can access job application
// @access  Private
const requireJobApplicationAccess = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const userId = req.userId;

    const application = await db.JobApplication.findByPk(applicationId, {
      include: [{ model: db.JobPost, as: 'jobPost' }]
    });
    
    if (!application) {
      return res.status(404).json({ error: 'Job application not found' });
    }

    if (application.userId !== userId && application.jobPost.clientId !== userId) {
      return res.status(403).json({ error: 'Not authorized to access this application' });
    }

    req.jobApplication = application;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Job application access check failed' });
  }
};

// @desc    Rate limiting for sensitive operations
// @access  Private
const rateLimitSensitive = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.userId}-${req.ip}`;
    const now = Date.now();
    const userAttempts = attempts.get(key) || [];

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter(time => now - time < windowMs);
    attempts.set(key, validAttempts);

    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({ 
        error: 'Too many attempts',
        message: 'Please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current attempt
    validAttempts.push(now);
    attempts.set(key, validAttempts);

    next();
  };
};

// @desc    Require admin role
// @access  Private
const requireAdmin = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireEmailVerification,
  requireRole,
  requireFreelancer,
  requireClient,
  requireAgency,
  requireFreelancerOrAgency,
  requireClientOrAgency,
  requireAdmin,
  optionalAuth,
  requireOwnership,
  requireContractAccess,
  requireJobApplicationAccess,
  rateLimitSensitive,
};
