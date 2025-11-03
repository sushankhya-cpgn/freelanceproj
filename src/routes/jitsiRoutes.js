const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const { generateJaasJwt } = require('../services/jitsiService');

// POST /api/jitsi/token
// Body or query: room (string), moderator (boolean), userName (string)
router.post('/token', asyncHandler(async (req, res) => {
  const room = (req.body.room || req.query.room || '').toString().trim();
  const moderator = String(req.body.moderator ?? req.query.moderator ?? 'false') === 'true';
  const userName = (req.body.userName || req.query.userName || '').toString();

  try {
    const token = generateJaasJwt({ room, moderator, userName });
    return res.status(200).json({ success: true, token });
  } catch (err) {
    if (err.code === 'JAAS_CONFIG_MISSING') {
      return res.status(400).json({ success: false, error: 'JAAS configuration missing', details: err.message });
    }
    if (err.code === 'INVALID_ROOM') {
      return res.status(400).json({ success: false, error: 'Invalid room', details: err.message });
    }
    console.error('Error generating JaaS token:', err);
    return res.status(500).json({ success: false, error: 'Failed to generate token' });
  }
}));

module.exports = router;
