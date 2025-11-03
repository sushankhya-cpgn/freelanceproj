/**
 * Centrifugo Service
 * Handles real-time messaging via Centrifugo
 */
require('dotenv').config();
const axios = require('axios');
const { CENTRIFUGO } = require('../constants');
const { ExternalServiceError } = require('../exceptions/AppError');

class CentrifugoService {
  constructor() {
    this.centrifugoUrl = process.env.CENTRIFUGO_URL || CENTRIFUGO.DEFAULT_URL;
    this.apiUrl = process.env.CENTRIFUGO_API_URL || CENTRIFUGO.API_URL;
    // Use the credentials from centrifugo.json if not in env
    this.apiKey = process.env.CENTRIFUGO_API_KEY || 'worklab_centrifugo_api_key_2024';
    this.secret = process.env.CENTRIFUGO_SECRET || 'worklab_centrifugo_secret_key_2024';
    
    if (!this.apiKey || !this.secret) {
      console.error('❌ Centrifugo API key or secret not configured');
      throw new Error('Centrifugo configuration missing');
    }
    
    // Create axios instance for Centrifugo API calls
    this.client = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `apikey ${this.apiKey}`
      }
    });
    
    console.log('🔧 Centrifugo Service initialized');
    console.log('🔑 Using API Key:', this.apiKey.substring(0, 20) + '...');
    console.log('🔐 Using Secret:', this.secret.substring(0, 20) + '...');
  }

  /**
   * Generate authentication token for client
   * @param {string} userId - User ID
   * @param {Object} userInfo - Additional user information
   * @returns {string} JWT token
   */
  generateToken(userId, userInfo = {}) {
    try {
      const payload = {
        sub: userId.toString(),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
        iat: Math.floor(Date.now() / 1000),
        ...userInfo
      };

      const jwt = require('jsonwebtoken');
      return jwt.sign(payload, this.secret, {
        algorithm: 'HS256',
        issuer: 'worklab',
        audience: 'centrifugo'
      });
    } catch (error) {
      console.error('Error generating Centrifugo token:', error);
      throw new ExternalServiceError('Centrifugo', 'Failed to generate token');
    }
  }

  /**
   * Publish message to channel
   * @param {string} channel - Channel name
   * @param {Object} data - Message data
   * @returns {Promise<boolean>} Success status
   */
  async publishMessage(channel, data) {
    try {
      console.log(`🔧 Publishing to Centrifugo API: ${this.apiUrl}`);
      console.log(`📡 Channel: ${channel}`);
      console.log(`📦 Data:`, JSON.stringify(data).substring(0, 200) + (JSON.stringify(data).length > 200 ? '...' : ''));
      
      const response = await this.client.post('/publish', {
        channel: channel,
        data: data
      });
      
      console.log(`✅ Publish successful to channel '${channel}'`);
      console.log(`📋 Publish result:`, response.data?.result || response.data);
      return true;
    } catch (error) {
      const errorMsg = error.response?.data?.error || error.message || 'Unknown error';
      const errorCode = error.response?.status || 'N/A';
      console.error(`❌ Error publishing message via Centrifugo (status: ${errorCode}):`, errorMsg);
      console.error(`❌ Request details - Channel: ${channel}, API URL: ${this.apiUrl}`);
      console.error(`❌ Error details:`, error.response?.data || error);
      
      // Still throw but provide detailed information
      throw new ExternalServiceError('Centrifugo', `Failed to publish message to channel '${channel}': ${errorMsg}`);
    }
  }

  /**
   * Get channel history
   * @param {string} channel - Channel name
   * @param {Object} options - History options
   * @returns {Promise<Array>} Message history
   */
  async getHistory(channel, options = {}) {
    try {
      const response = await this.client.post('/history', {
        channel: channel,
        ...options
      });
      const result = response.data.result;
      return result && result.publications ? result.publications : [];
    } catch (error) {
      console.error('Error getting history via Centrifugo:', error.response?.data || error.message);
      throw new ExternalServiceError('Centrifugo', 'Failed to get history');
    }
  }

  /**
   * Get channel presence
   * @param {string} channel - Channel name
   * @returns {Promise<Object>} Presence information
   */
  async getPresence(channel) {
    try {
      const response = await this.client.post('/presence', {
        channel: channel
      });
      return response.data.result;
    } catch (error) {
      console.error('Error getting presence via Centrifugo:', error.response?.data || error.message);
      throw new ExternalServiceError('Centrifugo', 'Failed to get presence');
    }
  }

  /**
   * Get conversation channel name
   * @param {string} userId1 - First user ID
   * @param {string} userId2 - Second user ID
   * @returns {string} Channel name
   */
  getConversationChannel(userId1, userId2) {
    // Sort user IDs to ensure consistent channel naming
    const sortedIds = [userId1, userId2].sort();
    return `conversation:${sortedIds[0]}:${sortedIds[1]}`;
  }

  /**
   * Get user channel name
   * @param {string} userId - User ID
   * @returns {string} Channel name
   */
  getUserChannel(userId) {
    return `user:${userId}`;
  }

  /**
   * Broadcast typing indicator
   * @param {string} senderId - Sender user ID
   * @param {string} receiverId - Receiver user ID
   * @param {boolean} isTyping - Typing status
   * @returns {Promise<boolean>} Success status
   */
  async broadcastTyping(senderId, receiverId, isTyping) {
    try {
      const conversationChannel = this.getConversationChannel(senderId, receiverId);
      
      await this.publishMessage(conversationChannel, {
        type: 'typing',
        data: {
          senderId,
          isTyping,
          timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error broadcasting typing indicator:', error);
      return false;
    }
  }

  /**
   * Broadcast user online/offline status
   * @param {string} userId - User ID
   * @param {boolean} isOnline - Online status
   * @returns {Promise<boolean>} Success status
   */
  async broadcastUserStatus(userId, isOnline) {
    try {
      const userChannel = this.getUserChannel(userId);
      
      await this.publishMessage(userChannel, {
        type: 'status_change',
        data: {
          userId,
          isOnline,
          timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error broadcasting user status:', error);
      return false;
    }
  }

  /**
   * Send notification to user
   * @param {string} userId - User ID
   * @param {Object} notification - Notification data
   * @returns {Promise<boolean>} Success status
   */
  async sendNotification(userId, notification) {
    try {
      const userChannel = this.getUserChannel(userId);
      
      await this.publishMessage(userChannel, {
        type: 'notification',
        data: {
          ...notification,
          timestamp: new Date()
        }
      });
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  /**
   * Get service status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      url: this.centrifugoUrl,
      apiUrl: this.apiUrl,
      isConnected: !!this.client,
      timestamp: new Date().toISOString()
    };
  }
}

// Export singleton instance
module.exports = new CentrifugoService();