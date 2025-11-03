const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

class SessionService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'xzoxnco02983h4b2o3soj';
    this.tokenExpiry = '30d';
  }

  // Generate a unique session ID
  generateSessionId() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Generate JWT token with session ID
  generateToken(userId, sessionId) {
    return jwt.sign(
      { 
        id: userId, 
        sessionId: sessionId 
      }, 
      this.jwtSecret, 
      { 
        expiresIn: this.tokenExpiry 
      }
    );
  }

  // Create a new session and invalidate all previous sessions for the user
  async createSession(userId, userAgent, ipAddress) {
    try {
      // First, invalidate all existing sessions for this user
      await this.invalidateUserSessions(userId);

      // Create new session
      const sessionId = this.generateSessionId();
      const token = this.generateToken(userId, sessionId);
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const session = await db.UserSession.create({
        userId,
        sessionId,
        token,
        userAgent,
        ipAddress,
        isActive: true,
        expiresAt
      });

      return {
        sessionId,
        token,
        expiresAt
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  // Validate session and token
  async validateSession(token) {
    try {
      // Verify JWT token
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (!decoded.sessionId) {
        throw new Error('Invalid token format');
      }

      // Check if session exists and is active
      const session = await db.UserSession.findOne({
        where: {
          sessionId: decoded.sessionId,
          isActive: true,
          expiresAt: {
            [db.Sequelize.Op.gt]: new Date()
          }
        },
        include: [{
          model: db.User,
          as: 'user',
          attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
        }]
      });

      if (!session) {
        throw new Error('Session not found or expired');
      }

      if (!session.user || !session.user.isActive) {
        throw new Error('User not found or inactive');
      }

      return {
        userId: session.userId,
        sessionId: session.sessionId,
        user: session.user
      };
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      }
      throw error;
    }
  }

  // Invalidate a specific session
  async invalidateSession(sessionId) {
    try {
      await db.UserSession.update(
        { isActive: false },
        { where: { sessionId } }
      );
      return true;
    } catch (error) {
      console.error('Error invalidating session:', error);
      return false;
    }
  }

  // Invalidate all sessions for a user
  async invalidateUserSessions(userId) {
    try {
      await db.UserSession.update(
        { isActive: false },
        { where: { userId } }
      );
      return true;
    } catch (error) {
      console.error('Error invalidating user sessions:', error);
      return false;
    }
  }

  // Get active sessions for a user
  async getUserActiveSessions(userId) {
    try {
      const sessions = await db.UserSession.findAll({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            [db.Sequelize.Op.gt]: new Date()
          }
        },
        attributes: ['id', 'sessionId', 'userAgent', 'ipAddress', 'createdAt', 'expiresAt'],
        order: [['createdAt', 'DESC']]
      });

      return sessions;
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  // Clean up expired sessions
  async cleanupExpiredSessions() {
    try {
      const result = await db.UserSession.update(
        { isActive: false },
        {
          where: {
            expiresAt: {
              [db.Sequelize.Op.lt]: new Date()
            }
          }
        }
      );
      
      console.log(`Cleaned up ${result[0]} expired sessions`);
      return result[0];
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
      return 0;
    }
  }

  // Get session by session ID
  async getSession(sessionId) {
    try {
      const session = await db.UserSession.findOne({
        where: { sessionId },
        include: [{
          model: db.User,
          as: 'user',
          attributes: { exclude: ['password', 'emailVerificationToken', 'passwordResetToken'] }
        }]
      });

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }
}

module.exports = new SessionService();

