const jwt = require('jsonwebtoken');

/**
 * Generate a JaaS (8x8.vc) JWT for a given room.
 * Requires environment variables:
 *  - JAAS_APP_ID (the vpaas-magic-cookie app id suffix)
 *  - JAAS_API_KEY_ID (kid header)
 *  - JAAS_API_KEY_SECRET (HS256 secret)
 *
 * @param {object} opts
 * @param {string} opts.room - Room name (no slashes)
 * @param {boolean} [opts.moderator=false] - Whether the user should be moderator
 * @param {string} [opts.userName] - Display name for the JWT context
 * @param {number} [opts.ttlSeconds=3600] - Token validity in seconds
 * @returns {string} Signed JWT
 */
function generateJaasJwt({ room, moderator = false, userName = '', ttlSeconds = 3600 }) {
  const APP_ID = process.env.JAAS_APP_ID;
  const KID = process.env.JAAS_API_KEY_ID;
  const SECRET = process.env.JAAS_API_KEY_SECRET;

  if (!APP_ID || !KID || !SECRET) {
    const missing = [
      !APP_ID && 'JAAS_APP_ID',
      !KID && 'JAAS_API_KEY_ID',
      !SECRET && 'JAAS_API_KEY_SECRET',
    ].filter(Boolean).join(', ');
    const err = new Error(`Missing JAAS credentials: ${missing}`);
    err.code = 'JAAS_CONFIG_MISSING';
    throw err;
  }

  if (!room || /\//.test(room)) {
    const err = new Error('Invalid room name. Must be a non-empty string without slashes.');
    err.code = 'INVALID_ROOM';
    throw err;
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.max(60, Math.min(ttlSeconds, 24 * 3600)); // 1 min to 24h

  // JaaS required claims
  const payload = {
    aud: 'jitsi',
    iss: 'chat',
    sub: `vpaas-magic-cookie-${APP_ID}`,
    room,
    exp,
    nbf: now - 5,
    context: {
      user: {
        name: userName || 'WorkLab User',
        moderator,
      }
    }
  };

  const header = { kid: KID, typ: 'JWT', alg: 'HS256' };

  return jwt.sign(payload, SECRET, { algorithm: 'HS256', header });
}

module.exports = { generateJaasJwt };
