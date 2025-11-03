const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { validationResult } = require('express-validator');
const sessionService = require('../services/sessionService');
const emailService = require('../services/emailService');
const { Novu } = require('@novu/node');
const novu = new Novu(process.env.NOVU_API_KEY || 'a709df8448e3f85dc113d808f3d1c5a5');
const REQUIRE_LOGIN_OTP = process.env.REQUIRE_LOGIN_OTP !== 'false';

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

// @desc    Upload portfolio files and return file metadata
// @route   POST /api/auth/profile/portfolio/upload
// @access  Private
const uploadPortfolioItems = asyncHandler(async (req, res) => {
  // req.files provided by multer uploadPortfolio.array('files') in route
  const files = Array.isArray(req.files) ? req.files : [];
  const result = files.map(f => ({
    name: f.originalname,
    type: f.mimetype,
    url: `/uploads/portfolio/${f.filename}`,
  }));
  res.json({ success: true, files: result });
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

// Create JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'xzoxnco02983h4b2o3soj', {
    expiresIn: '30d',
  });
};

// Normalize email helper to avoid case/whitespace issues
const normalizeEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : e);

// Create email verification token
const generateEmailVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create password reset token
const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Email transporter configuration
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Send verification email
const sendVerificationEmail = async (email, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Verify Your Email Address',
    html: `
      <h2>Welcome to WorkLab!</h2>
      <p>Please click the link below to verify your email address:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Password Reset Request',
    html: `
      <h2>Password Reset Request</h2>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>This link will expire in 1 hour.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { 
    email, 
    password, 
    firstName, 
    lastName, 
    userType,
    country,
    bio,
    experiences,
    paymentOptions,
    companyName,
    companyWebsite
  } = req.body;

  // Normalize email and check if user already exists
  const normalizedEmail = normalizeEmail(email);
  const userExists = await db.User.findOne({ where: { email: normalizedEmail } });
  if (userExists) {
    return res.status(400).json({ error: 'User already exists' });
  }

  // Generate email verification OTP
  const emailVerificationOTP = emailService.generateOTP();
  const emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Handle profile image upload
  let profileImagePath = null;
  if (req.file) {
    profileImagePath = `/uploads/profiles/${req.file.filename}`;
  }

  // Parse JSON fields
  let parsedExperiences = [];
  let parsedPaymentOptions = [];
  
  try {
    if (experiences) {
      parsedExperiences = typeof experiences === 'string' ? JSON.parse(experiences) : experiences;
    }
    if (paymentOptions) {
      parsedPaymentOptions = typeof paymentOptions === 'string' ? JSON.parse(paymentOptions) : paymentOptions;
    }
  } catch (error) {
    return res.status(400).json({ error: 'Invalid JSON format for experiences or payment options' });
  }

  // Create user (email not verified yet, store OTP fields)
  const user = await db.User.create({
    email: normalizedEmail,
    password,
    firstName,
    lastName,
    userType,
    country,
    bio,
    experiences: parsedExperiences,
    paymentOptions: parsedPaymentOptions,
    companyName,
    companyWebsite,
    profileImage: profileImagePath,
    isEmailVerified: false,
    emailVerificationOTP,
    emailVerificationOTPExpires,
    connectBalance: 20, // Give 20 free connects on signup
  });

  // Create appropriate profile based on user type
  if (userType === 'freelancer') {
    await db.Freelancer.create({
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      shortBio: 'New freelancer',
      yearsOfExperience: '0-1 years',
      expertise: 'General',
      userType: 'it',
      visibility: 'public'
    });
  } else if (userType === 'client') {
    await db.Organization.create({
      userId: user.id,
      name: `${firstName} ${lastName}`,
      email: user.email,
      organizationType: 'individual',
      size: '1-10',
      industry: 'Technology',
      website: '',
      description: 'New client organization'
    });
  } else if (userType === 'agency') {
    // Create agency profile for new agency users
    await db.Agency.create({
      userId: user.id,
      agencyName: companyName || `${firstName} ${lastName} Agency`,
      description: bio || 'New agency on WorkLab',
      website: companyWebsite || '',
      city: '',
      country: country || '',
      businessType: 'other',
      specializations: [],
      teamSize: 1,
      yearsInBusiness: 0,
      isActive: true,
      isVerified: false
    });
  }

  // Create connect record for the 20 free connects
  await db.Connect.create({
    userId: user.id,
    type: 'bonus',
    amount: 0, // Free connects
    quantity: 20,
    status: 'completed',
    remaining: 20,
    metadata: {
      description: 'Welcome bonus - 20 free connects for new users',
      source: 'signup_bonus'
    }
  });

  // Send verification OTP email
  try {
    await emailService.sendVerificationOTP(user.email, emailVerificationOTP, user.firstName);
  } catch (error) {
    console.error('Error sending verification OTP on register:', error);
  }

  res.status(201).json({
    message: 'User registered successfully. We sent a verification code to your email. You received 20 free connects!',
    requiresVerification: true,
    email: user.email,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);

  // Check if user exists
  const user = await db.User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if password is correct
  const isPasswordCorrect = await user.checkPassword(password);
  if (!isPasswordCorrect) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check if user is active
  if (!user.isActive) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  // Block login until email is verified
  if (!user.isEmailVerified) {
    return res.status(403).json({
      error: 'Please verify your email to sign in',
      requiresVerification: true,
      email: user.email,
    });
  }

  // If OTP is required for login, send code and stop here
  if (REQUIRE_LOGIN_OTP) {
    const now = new Date();
    const lastAttempt = user.otpLastAttempt;
    const attempts = user.otpAttempts || 0;
    // reset hourly window
    if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
      await user.update({ otpAttempts: 0 });
    } else if (attempts >= 3) {
      return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
    }

    const loginOTP = emailService.generateOTP();
    const loginOTPExpires = new Date(Date.now() + 10 * 60 * 1000);
    await user.update({
      loginOTP,
      loginOTPExpires,
      otpAttempts: attempts + 1,
      otpLastAttempt: now,
    });

    try {
      await emailService.sendLoginOTP(user.email, loginOTP, user.firstName);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to send login code' });
    }

    return res.json({
      requiresOTP: true,
      message: 'We sent a login code to your email',
      email: user.email,
    });
  }

  // Otherwise, proceed to create session immediately
  await user.update({ lastLogin: new Date() });
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const sessionData = await sessionService.createSession(user.id, userAgent, ipAddress);

  res.json({
    message: 'Login successful',
    token: sessionData.token,
    sessionId: sessionData.sessionId,
    expiresAt: sessionData.expiresAt,
    user: {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
    },
  });
});

// @desc    Verify email with OTP
// @route   POST /api/auth/verify-email
// @access  Public
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  // Find user with valid OTP
  const user = await db.User.findOne({
    where: {
      email: normalizedEmail,
      emailVerificationOTP: otp,
      emailVerificationOTPExpires: {
        [db.Sequelize.Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Check OTP attempts
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;

  // Reset attempts if more than 1 hour has passed
  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 5) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  // Update user
  await user.update({
    isEmailVerified: true,
    emailVerificationOTP: null,
    emailVerificationOTPExpires: null,
    otpAttempts: 0,
    otpLastAttempt: null,
  });

  // Send welcome email
  try {
    await emailService.sendWelcomeEmail(user.email, user.firstName, user.userType);
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }

  res.json({ 
    message: 'Email verified successfully! Welcome to WorkLab!',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
    }
  });
});

// @desc    Resend verification OTP
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);

  const user = await db.User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  if (user.isEmailVerified) {
    return res.status(400).json({ error: 'Email already verified' });
  }

  // Check rate limiting for OTP resend
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;

  // Reset attempts if more than 1 hour has passed
  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 3) {
    return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
  }

  // Generate new OTP
  const emailVerificationOTP = emailService.generateOTP();
  const emailVerificationOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.update({
    emailVerificationOTP,
    emailVerificationOTPExpires,
    otpAttempts: attempts + 1,
    otpLastAttempt: now,
  });

  // Send verification OTP email
  try {
  await emailService.sendVerificationOTP(user.email, emailVerificationOTP, user.firstName);
    res.json({ message: 'Verification OTP sent successfully' });
  } catch (error) {
    console.error('Error sending verification OTP:', error);
    res.status(500).json({ error: 'Failed to send verification OTP' });
  }
});

// @desc    Request login OTP (passwordless)
// @route   POST /api/auth/login/otp/request
// @access  Public
const requestLoginOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await db.User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    // Don't reveal if user exists
    return res.json({ message: 'If an account exists, a login code has been sent' });
  }

  if (!user.isActive) {
    return res.status(401).json({ error: 'Account is deactivated' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      error: 'Please verify your email before requesting a login code',
      requiresVerification: true,
      email: user.email,
    });
  }

  // Rate limit: max 3 per hour
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;

  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 3) {
    return res.status(429).json({ error: 'Too many OTP requests. Please try again later.' });
  }

  const loginOTP = emailService.generateOTP();
  const loginOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.update({
    loginOTP,
    loginOTPExpires,
    otpAttempts: attempts + 1,
    otpLastAttempt: now,
  });

  try {
    await emailService.sendLoginOTP(user.email, loginOTP, user.firstName);
    res.json({ message: 'Login code sent successfully' });
  } catch (error) {
    console.error('Error sending login OTP:', error);
    res.status(500).json({ error: 'Failed to send login code' });
  }
});

// @desc    Verify login OTP and create session
// @route   POST /api/auth/login/otp/verify
// @access  Public
const verifyLoginOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const normalizedEmail = normalizeEmail(email);
  const user = await db.User.findOne({
    where: {
      email: normalizedEmail,
      loginOTP: otp,
      loginOTPExpires: { [db.Sequelize.Op.gt]: new Date() },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      error: 'Please verify your email to sign in',
      requiresVerification: true,
      email: user.email,
    });
  }

  // Additional brute-force guard
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;
  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 5) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  // Clear OTP fields
  await user.update({
    loginOTP: null,
    loginOTPExpires: null,
    otpAttempts: 0,
    otpLastAttempt: null,
    lastLogin: new Date(),
  });

  // Create session
  const userAgent = req.get('User-Agent') || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const sessionData = await sessionService.createSession(user.id, userAgent, ipAddress);

  res.json({
    message: 'Login successful',
    token: sessionData.token,
    sessionId: sessionData.sessionId,
    expiresAt: sessionData.expiresAt,
    user: {
      id: user.id,
      uuid: user.uuid,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      profileImage: user.profileImage,
    },
  });
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const normalizedEmail = normalizeEmail(email);
  const user = await db.User.findOne({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check rate limiting for password reset
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;

  // Reset attempts if more than 1 hour has passed
  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 3) {
    return res.status(429).json({ error: 'Too many password reset requests. Please try again later.' });
  }

  // Generate password reset OTP
  const passwordResetOTP = emailService.generateOTP();
  const passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await user.update({
    passwordResetOTP,
    passwordResetOTPExpires,
    otpAttempts: attempts + 1,
    otpLastAttempt: now,
  });

  // Send password reset OTP email
  try {
    await emailService.sendPasswordResetOTP(user.email, passwordResetOTP, user.firstName);
    res.json({ message: 'Password reset OTP sent successfully' });
  } catch (error) {
    console.error('Error sending password reset OTP:', error);
    res.status(500).json({ error: 'Failed to send password reset OTP' });
  }
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;

  if (!email || !otp || !password) {
    return res.status(400).json({ error: 'Email, OTP, and password are required' });
  }

  // Find user with valid OTP
  const normalizedEmail = normalizeEmail(email);
  const user = await db.User.findOne({
    where: {
      email: normalizedEmail,
      passwordResetOTP: otp,
      passwordResetOTPExpires: {
        [db.Sequelize.Op.gt]: new Date(),
      },
    },
  });

  if (!user) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  // Check OTP attempts
  const now = new Date();
  const lastAttempt = user.otpLastAttempt;
  const attempts = user.otpAttempts || 0;

  // Reset attempts if more than 1 hour has passed
  if (!lastAttempt || (now - lastAttempt) > 60 * 60 * 1000) {
    await user.update({ otpAttempts: 0 });
  } else if (attempts >= 5) {
    return res.status(429).json({ error: 'Too many OTP attempts. Please try again later.' });
  }

  // Update password and clear OTP
  await user.update({
    password,
    passwordResetOTP: null,
    passwordResetOTPExpires: null,
    otpAttempts: 0,
    otpLastAttempt: null,
  });

  res.json({ message: 'Password reset successfully' });
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.userId, {
    attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] },
  });

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, timezone, language, emailNotifications, pushNotifications, bio, hourlyRate, availability, location, companyName, companyWebsite } = req.body;

  const user = await db.User.findByPk(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Prepare payload
  const payload = {
    firstName,
    lastName,
    timezone,
    language,
    emailNotifications,
    pushNotifications,
    bio,
    hourlyRate,
    availability,
    location,
    companyName,
    companyWebsite,
  };

  // If a file was uploaded by multer, save relative path to user.profileImage
  if (req.file) {
    payload.profileImage = `/uploads/profiles/${req.file.filename}`;
  }

  await user.update(payload);
  // Fire Novu notification for profile update
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(user.id) },
      payload: {
        type: 'profile_update',
        title: 'Profile updated',
        message: 'Your profile details were updated successfully.',
      },
    });
  } catch (e) {
    // non-blocking
  }

  res.json({ message: 'Profile updated successfully', user });
});

// @desc    Update user skills
// @route   PUT /api/auth/profile/skills
// @access  Private
const updateSkills = asyncHandler(async (req, res) => {
  const { skills } = req.body;
  const user = await db.User.findByPk(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const skillsArray = Array.isArray(skills) ? skills : (typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : []);
  await user.update({ skills: skillsArray });
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(user.id) },
      payload: {
        type: 'skills_update',
        title: 'Skills updated',
        message: 'Your skills were updated successfully.',
      },
    });
  } catch {}
  res.json({ message: 'Skills updated successfully', skills: user.skills });
});

// @desc    Update user experiences
// @route   PUT /api/auth/profile/experiences
// @access  Private
const updateExperiences = asyncHandler(async (req, res) => {
  const { experiences } = req.body;
  const user = await db.User.findByPk(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let exp = experiences;
  if (typeof exp === 'string') {
    try { exp = JSON.parse(exp); } catch { return res.status(400).json({ error: 'Invalid JSON for experiences' }); }
  }
  if (!Array.isArray(exp)) return res.status(400).json({ error: 'experiences must be an array' });
  await user.update({ experiences: exp });
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(user.id) },
      payload: {
        type: 'experiences_update',
        title: 'Experience updated',
        message: 'Your experiences were updated successfully.',
      },
    });
  } catch {}
  res.json({ message: 'Experiences updated successfully', experiences: user.experiences });
});

// @desc    Update user portfolio items
// @route   PUT /api/auth/profile/portfolio
// @access  Private
const updatePortfolio = asyncHandler(async (req, res) => {
  const { portfolioItems } = req.body;
  const user = await db.User.findByPk(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  let items = portfolioItems;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { return res.status(400).json({ error: 'Invalid JSON for portfolioItems' }); }
  }
  if (!Array.isArray(items)) return res.status(400).json({ error: 'portfolioItems must be an array' });
  await user.update({ portfolioItems: items });
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(user.id) },
      payload: {
        type: 'portfolio_update',
        title: 'Portfolio updated',
        message: 'Your portfolio was updated successfully.',
      },
    });
  } catch {}
  res.json({ message: 'Portfolio updated successfully', portfolioItems: user.portfolioItems });
});

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await db.User.findByPk(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check current password
  const isCurrentPasswordCorrect = await user.checkPassword(currentPassword);
  if (!isCurrentPasswordCorrect) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  // Update password
  await user.update({ password: newPassword });

  res.json({ message: 'Password changed successfully' });
});

// @desc    Logout user (invalidate current session)
// @route   POST /api/auth/logout
// @access  Private
const logout = asyncHandler(async (req, res) => {
  const sessionId = req.sessionId;
  
  if (sessionId) {
    await sessionService.invalidateSession(sessionId);
  }

  res.json({ message: 'Logout successful' });
});

// @desc    Logout from all devices (invalidate all sessions)
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  await sessionService.invalidateUserSessions(userId);

  res.json({ message: 'Logged out from all devices successfully' });
});

// @desc    Get active sessions
// @route   GET /api/auth/sessions
// @access  Private
const getActiveSessions = asyncHandler(async (req, res) => {
  const userId = req.userId;
  
  const sessions = await sessionService.getUserActiveSessions(userId);

  res.json({ 
    sessions: sessions.map(session => ({
      id: session.id,
      sessionId: session.sessionId,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.sessionId === req.sessionId
    }))
  });
});

// @desc    Invalidate specific session
// @route   DELETE /api/auth/sessions/:sessionId
// @access  Private
const invalidateSession = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.userId;

  // Get the session to verify ownership
  const session = await sessionService.getSession(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to invalidate this session' });
  }

  await sessionService.invalidateSession(sessionId);

  res.json({ message: 'Session invalidated successfully' });
});

// @desc    Deactivate account
// @route   DELETE /api/auth/deactivate
// @access  Private
const deactivateAccount = asyncHandler(async (req, res) => {
  const user = await db.User.findByPk(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Invalidate all sessions before deactivating
  await sessionService.invalidateUserSessions(req.userId);
  
  await user.update({ isActive: false });

  res.json({ message: 'Account deactivated successfully' });
});

// @desc    Send a test Novu notification to current user
// @route   POST /api/auth/notify-test
// @access  Private
const notifyTest = asyncHandler(async (req, res) => {
  const userId = req.userId;
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(userId) },
      payload: {
        type: 'test',
        title: 'Test notification',
        message: 'This is a test notification from WorkLab.',
      },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e?.message || 'Failed to send test notification' });
  }
});

module.exports = { 
  register,
  login,
  requestLoginOTP,
  verifyLoginOTP,
  logout,
  logoutAll,
  getActiveSessions,
  invalidateSession,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  updateSkills,
  updateExperiences,
  updatePortfolio,
  uploadPortfolioItems,
  changePassword,
  deactivateAccount,
  notifyTest,
};