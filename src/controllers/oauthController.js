const jwt = require('jsonwebtoken');
const { sendSuccess, sendError } = require('../utils/response');
const asyncHandler = require('express-async-handler');
const sessionService = require('../services/sessionService');

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
const googleCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Create session for OAuth user
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    const sessionData = await sessionService.createSession(
      user.id, 
      userAgent, 
      ipAddress
    );

    // Redirect to frontend with session data
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${sessionData.token}&sessionId=${sessionData.sessionId}&expiresAt=${sessionData.expiresAt}&provider=google`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

// @desc    Facebook OAuth callback
// @route   GET /api/auth/facebook/callback
// @access  Public
const facebookCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Create session for OAuth user
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    const sessionData = await sessionService.createSession(
      user.id, 
      userAgent, 
      ipAddress
    );

    // Redirect to frontend with session data
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${sessionData.token}&sessionId=${sessionData.sessionId}&expiresAt=${sessionData.expiresAt}&provider=facebook`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Facebook OAuth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

// @desc    Apple OAuth callback
// @route   GET /api/auth/apple/callback
// @access  Public
const appleCallback = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }

    // Create session for OAuth user
    const userAgent = req.get('User-Agent') || '';
    const ipAddress = req.ip || req.connection.remoteAddress || '';
    
    const sessionData = await sessionService.createSession(
      user.id, 
      userAgent, 
      ipAddress
    );

    // Redirect to frontend with session data
    const redirectUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${sessionData.token}&sessionId=${sessionData.sessionId}&expiresAt=${sessionData.expiresAt}&provider=apple`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Apple OAuth Callback Error:', error);
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
  }
});

// @desc    Get OAuth URLs
// @route   GET /api/auth/oauth-urls
// @access  Public
const getOAuthUrls = asyncHandler(async (req, res) => {
  const baseUrl = process.env.API_URL || 'http://localhost:3000';
  
  const urls = {
    google: `${baseUrl}/api/auth/google`,
    facebook: `${baseUrl}/api/auth/facebook`,
    apple: `${baseUrl}/api/auth/apple`
  };

  // Check which OAuth providers are configured
  const configured = {
    google: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    facebook: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
    apple: !!(process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY)
  };

  sendSuccess(res, {
    urls,
    configured,
    message: 'OAuth URLs retrieved successfully. Configure environment variables to enable OAuth providers.'
  }, 'OAuth URLs retrieved successfully');
});

module.exports = {
  googleCallback,
  facebookCallback,
  appleCallback,
  getOAuthUrls
};