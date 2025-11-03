const { Novu } = require('@novu/node');

class NovuService {
  constructor() {
    const apiKey = process.env.NOVU_API_KEY;
    if (!apiKey) {
      console.warn('⚠️ Novu API key not found - notifications will be disabled');
      this.novu = null;
      return;
    }
    this.novu = new Novu(apiKey);
    console.log('🔔 Novu Service initialized');
  }

  /**
   * Subscribe a user to Novu
   * @param {number} userId - User ID
   * @param {object} userInfo - User information (email, firstName, lastName, etc.)
   */
  async subscribeUser(userId, userInfo) {
    if (!this.novu) {
      console.log('⚠️ Novu not initialized - skipping subscription');
      return false;
    }
    try {
      await this.novu.subscribers.identify(userId.toString(), {
        email: userInfo.email,
        firstName: userInfo.firstName || userInfo.full_name?.split(' ')[0],
        lastName: userInfo.lastName || userInfo.full_name?.split(' ')[1],
        avatar: userInfo.profile_image,
        data: {
          role: userInfo.role,
          username: userInfo.username
        }
      });
      console.log(`✅ User ${userId} subscribed to Novu`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to subscribe user ${userId} to Novu:`, error.message);
      return false;
    }
  }

  /**
   * Send a new message notification
   * @param {number} recipientId - Recipient user ID
   * @param {object} messageData - Message data
   */
  async sendMessageNotification(recipientId, messageData) {
    if (!this.novu) return false;
    try {
      await this.novu.trigger('new-message', {
        to: {
          subscriberId: recipientId.toString()
        },
        payload: {
          senderName: messageData.senderName,
          senderAvatar: messageData.senderAvatar,
          messageContent: messageData.content,
          messageId: messageData.id,
          conversationUrl: `/messages?userId=${messageData.senderId}`
        }
      });
      console.log(`📬 Message notification sent to user ${recipientId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send message notification:`, error.message);
      return false;
    }
  }

  /**
   * Send a job application notification
   * @param {number} recipientId - Recipient user ID (job poster)
   * @param {object} applicationData - Application data
   */
  async sendJobApplicationNotification(recipientId, applicationData) {
    if (!this.novu) return false;
    try {
      await this.novu.trigger('new-job-application', {
        to: {
          subscriberId: recipientId.toString()
        },
        payload: {
          applicantName: applicationData.applicantName,
          applicantAvatar: applicationData.applicantAvatar,
          jobTitle: applicationData.jobTitle,
          applicationId: applicationData.id,
          jobUrl: `/jobs/${applicationData.jobId}`
        }
      });
      console.log(`📬 Job application notification sent to user ${recipientId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send job application notification:`, error.message);
      return false;
    }
  }

  /**
   * Send a contract created notification
   * @param {number} recipientId - Recipient user ID
   * @param {object} contractData - Contract data
   */
  async sendContractNotification(recipientId, contractData) {
    if (!this.novu) return false;
    try {
      await this.novu.trigger('new-contract', {
        to: {
          subscriberId: recipientId.toString()
        },
        payload: {
          clientName: contractData.clientName,
          projectTitle: contractData.title,
          amount: contractData.amount,
          contractId: contractData.id,
          contractUrl: `/contracts/${contractData.id}`
        }
      });
      console.log(`📬 Contract notification sent to user ${recipientId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send contract notification:`, error.message);
      return false;
    }
  }

  /**
   * Send a general notification
   * @param {number} recipientId - Recipient user ID
   * @param {string} workflowId - Novu workflow ID
   * @param {object} payload - Notification payload
   */
  async sendNotification(recipientId, workflowId, payload) {
    if (!this.novu) return false;
    try {
      await this.novu.trigger(workflowId, {
        to: {
          subscriberId: recipientId.toString()
        },
        payload
      });
      console.log(`📬 Notification sent to user ${recipientId} (workflow: ${workflowId})`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send notification:`, error.message);
      return false;
    }
  }

  /**
   * Update subscriber preferences
   * @param {number} userId - User ID
   * @param {object} preferences - Notification preferences
   */
  async updatePreferences(userId, preferences) {
    if (!this.novu) return false;
    try {
      await this.novu.subscribers.update(userId.toString(), {
        data: {
          preferences
        }
      });
      console.log(`✅ Preferences updated for user ${userId}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to update preferences:`, error.message);
      return false;
    }
  }

  /**
   * Delete a subscriber
   * @param {number} userId - User ID
   */
  async unsubscribeUser(userId) {
    if (!this.novu) return false;
    try {
      await this.novu.subscribers.delete(userId.toString());
      console.log(`✅ User ${userId} unsubscribed from Novu`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to unsubscribe user:`, error.message);
      return false;
    }
  }
}

// Export singleton instance
module.exports = new NovuService();
