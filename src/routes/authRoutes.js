const express = require('express');
const passport = require('passport');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordReset,
  validateProfileUpdate,
  validateChangePassword
} = require('../middleware/validation');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/profiles');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Separate storage for portfolio uploads (allow images and pdf)
const storagePortfolio = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/portfolio');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'portfolio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadPortfolio = multer({
  storage: storagePortfolio,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image or PDF files are allowed'), false);
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - firstName
 *         - lastName
 *         - userType
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           minLength: 6
 *           example: password123
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Doe
 *         userType:
 *           type: string
 *           enum: [freelancer, client, agency]
 *           example: freelancer
 *         profileImage:
 *           type: string
 *           example: https://example.com/profile.jpg
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           example: password123
 *     
 *     AuthResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: User registered successfully
 *         token:
 *           type: string
 *           example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *         user:
 *           $ref: '#/components/schemas/User'
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register', upload.single('profileImage'), validateUserRegistration, authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', validateUserLogin, authController.login);

// Passwordless email OTP login
router.post('/login/otp/request', authController.requestLoginOTP);
router.post('/login/otp/verify', authController.verifyLoginOTP);

// @route   POST /api/auth/verify-email
// @desc    Verify email with OTP
// @access  Public
router.post('/verify-email', authController.verifyEmail);

// @route   POST /api/auth/resend-verification
// @desc    Resend verification email
// @access  Public
router.post('/resend-verification', authController.resendVerification);

// @route   POST /api/auth/forgot-password
// @desc    Forgot password
// @access  Public
router.post('/forgot-password', authController.forgotPassword);

// @route   POST /api/auth/reset-password
// @desc    Reset password
// @access  Public
router.post('/reset-password', validatePasswordReset, authController.resetPassword);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, authController.getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, upload.single('profileImage'), validateProfileUpdate, authController.updateProfile);
router.put('/profile/skills', authenticateToken, authController.updateSkills);
router.put('/profile/experiences', authenticateToken, authController.updateExperiences);
router.put('/profile/portfolio', authenticateToken, authController.updatePortfolio);
router.post('/profile/portfolio/upload', authenticateToken, uploadPortfolio.array('files', 10), authController.uploadPortfolioItems);

// @route   PUT /api/auth/change-password
// @desc    Change password
// @access  Private
router.put('/change-password', authenticateToken, validateChangePassword, authController.changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, authController.logout);

// @route   POST /api/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', authenticateToken, authController.logoutAll);

// @route   GET /api/auth/sessions
// @desc    Get active sessions
// @access  Private
router.get('/sessions', authenticateToken, authController.getActiveSessions);

// @route   DELETE /api/auth/sessions/:sessionId
// @desc    Invalidate specific session
// @access  Private
router.delete('/sessions/:sessionId', authenticateToken, authController.invalidateSession);

// @route   DELETE /api/auth/deactivate
// @desc    Deactivate account
// @access  Private
router.delete('/deactivate', authenticateToken, authController.deactivateAccount);

// OAuth routes moved to separate oauthRoutes.js file

// Novu test notification route
router.post('/notify-test', authenticateToken, authController.notifyTest);

module.exports = router;