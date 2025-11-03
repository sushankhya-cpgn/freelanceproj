const express = require('express');
const passport = require('passport');
const router = express.Router();

const oauthController = require('../controllers/oauthController');

// @route   GET /api/auth/google
// @desc    Google OAuth login
// @access  Public
router.get('/google', (req, res, next) => {
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return res.status(501).json({ 
        success: false,
        error: 'Google OAuth not configured',
        message: 'Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!passport._strategy('google')) {
      return res.status(501).json({ 
        success: false,
        error: 'Google OAuth strategy not loaded',
        message: 'Google OAuth strategy failed to load. Please check your configuration.',
        timestamp: new Date().toISOString()
      });
    }
    
    passport.authenticate('google', {
      scope: ['profile', 'email']
    })(req, res, next);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'OAuth service unavailable',
      message: 'OAuth service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/auth/google/callback
// @desc    Google OAuth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`
  }),
  oauthController.googleCallback
);

// @route   GET /api/auth/facebook
// @desc    Facebook OAuth login
// @access  Public
router.get('/facebook', (req, res, next) => {
  try {
    // Check if Facebook OAuth is configured
    if (!process.env.FACEBOOK_APP_ID || !process.env.FACEBOOK_APP_SECRET) {
      return res.status(501).json({ 
        success: false,
        error: 'Facebook OAuth not configured',
        message: 'Please configure FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in your environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!passport._strategy('facebook')) {
      return res.status(501).json({ 
        success: false,
        error: 'Facebook OAuth strategy not loaded',
        message: 'Facebook OAuth strategy failed to load. Please check your configuration.',
        timestamp: new Date().toISOString()
      });
    }
    
    passport.authenticate('facebook', {
      scope: ['email']
    })(req, res, next);
  } catch (error) {
    console.error('Facebook OAuth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'OAuth service unavailable',
      message: 'OAuth service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/auth/facebook/callback
// @desc    Facebook OAuth callback
// @access  Public
router.get('/facebook/callback',
  passport.authenticate('facebook', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`
  }),
  oauthController.facebookCallback
);

// @route   GET /api/auth/apple
// @desc    Apple OAuth login
// @access  Public
router.get('/apple', (req, res, next) => {
  try {
    // Check if Apple OAuth is configured
    if (!process.env.APPLE_CLIENT_ID || !process.env.APPLE_TEAM_ID || !process.env.APPLE_KEY_ID || !process.env.APPLE_PRIVATE_KEY) {
      return res.status(501).json({ 
        success: false,
        error: 'Apple OAuth not configured',
        message: 'Please configure Apple OAuth credentials in your environment variables',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!passport._strategy('apple')) {
      return res.status(501).json({ 
        success: false,
        error: 'Apple OAuth strategy not loaded',
        message: 'Apple OAuth strategy failed to load. Please check your configuration.',
        timestamp: new Date().toISOString()
      });
    }
    
    passport.authenticate('apple', {
      scope: ['name', 'email']
    })(req, res, next);
  } catch (error) {
    console.error('Apple OAuth error:', error);
    res.status(500).json({ 
      success: false,
      error: 'OAuth service unavailable',
      message: 'OAuth service is temporarily unavailable',
      timestamp: new Date().toISOString()
    });
  }
});

// @route   GET /api/auth/apple/callback
// @desc    Apple OAuth callback
// @access  Public
router.get('/apple/callback',
  passport.authenticate('apple', { 
    session: false,
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`
  }),
  oauthController.appleCallback
);

// @route   GET /api/auth/oauth-urls
// @desc    Get OAuth URLs for frontend
// @access  Public
router.get('/oauth-urls', oauthController.getOAuthUrls);

module.exports = router;
