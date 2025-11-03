const asyncHandler = require('express-async-handler');
const db = require('../db');
const { validationResult } = require('express-validator');
const CentrifugoService = require('../services/centrifugoService');
const novuService = require('../services/novuService');

// @desc    Send message
// @route   POST /api/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  console.log('🔵 sendMessage called - receiverId:', req.body.receiverId, 'senderId:', req.userId);
  
  // Parse body - could be JSON or multipart form data
  let {
    receiverId,
    content,
    messageType = 'text',
    contractId,
    jobApplicationId
  } = req.body;

  // Handle file uploads from multer
  let attachments = [];
  if (req.files && req.files.length > 0) {
    // Get base URL from environment or construct from request
    const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
    
    attachments = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `${baseUrl}/uploads/messages/${file.filename}`
    }));
    
    // Auto-detect message type based on first file
    if (!messageType || messageType === 'text') {
      messageType = req.files[0].mimetype.startsWith('image/') ? 'image' : 'file';
    }
  } else if (req.body.attachments) {
    // Parse attachments from JSON if provided
    attachments = typeof req.body.attachments === 'string' 
      ? JSON.parse(req.body.attachments) 
      : req.body.attachments;
  }

  // Convert receiverId to number if it's a string
  receiverId = parseInt(receiverId);

  const senderId = req.userId;

  // Check if receiver exists
  const receiver = await db.User.findByPk(receiverId);
  if (!receiver) {
    return res.status(404).json({ error: 'Receiver not found' });
  }

  // Check if user is authorized to send message
  if (contractId) {
    const contract = await db.Contract.findByPk(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }
    if (contract.clientId !== senderId && contract.freelancerId !== senderId) {
      return res.status(403).json({ error: 'Not authorized to send message for this contract' });
    }
  }

  if (jobApplicationId) {
    const jobApplication = await db.JobApplication.findByPk(jobApplicationId, {
      include: [{ model: db.JobPost, as: 'jobPost' }]
    });
    if (!jobApplication) {
      return res.status(404).json({ error: 'Job application not found' });
    }
    
    // Check if user is part of this application (poster or applicant)
    const isApplicant = jobApplication.userId === senderId;
    const isPoster = jobApplication.jobPost.clientId === senderId;
    
    if (!isApplicant && !isPoster) {
      return res.status(403).json({ error: 'Not authorized to send message for this application' });
    }
    
    // POSTER-FIRST MESSAGING RULE: Check if this is the first message
    const existingMessages = await db.Message.count({
      where: { jobApplicationId }
    });
    
    if (existingMessages === 0) {
      // This is the first message - only the poster (job owner) can send it
      if (!isPoster) {
        return res.status(403).json({ 
          error: 'Only the job poster can initiate conversation with applicants',
          message: 'Please wait for the job poster to contact you first'
        });
      }
    }
  }

  // Create message
  const message = await db.Message.create({
    senderId,
    receiverId,
    content,
    messageType,
    attachments,
    contractId,
    jobApplicationId,
    sentAt: new Date()
  });

  // Update or create conversation
  try {
    await db.Conversation.updateWithMessage(senderId, receiverId, message.id, senderId);
  } catch (convError) {
    console.error('⚠️ Failed to update conversation:', convError.message);
    // Don't fail the message send if conversation update fails
  }

  // Get message with sender details
  const messageWithDetails = await db.Message.findByPk(message.id, {
    include: [
      { model: db.User, as: 'sender' },
      { model: db.User, as: 'receiver' }
    ]
  });

  // 🚀 Broadcast message to Centrifugo channel
  try {
    const conversationChannel = CentrifugoService.getConversationChannel(senderId, receiverId);
    console.log(`📡 Broadcasting message to channel: ${conversationChannel}`);
    
    await CentrifugoService.publishMessage(conversationChannel, {
      id: messageWithDetails.id,
      senderId: messageWithDetails.senderId,
      receiverId: messageWithDetails.receiverId,
      content: messageWithDetails.content,
      messageType: messageWithDetails.messageType,
      attachments: messageWithDetails.attachments,
      sentAt: messageWithDetails.sentAt,
      sender: {
        id: messageWithDetails.sender.id,
        firstName: messageWithDetails.sender.firstName,
        lastName: messageWithDetails.sender.lastName
      }
    });
    
    console.log(`✅ Message broadcasted successfully to ${conversationChannel}`);
  } catch (error) {
    console.error('⚠️ Failed to broadcast message to Centrifugo:', {
      channel: conversationChannel,
      error: error.message,
      details: error.response?.data || error
    });
    // Don't fail the request if broadcasting fails - message is saved in DB
  }

  // 🔔 Send real-time notification to receiver
  try {
    const userChannel = CentrifugoService.getUserChannel(receiverId.toString());
    console.log(`🔔 Sending notification to channel: ${userChannel}`);
    console.log(`🔔 Notification data:`, {
      type: 'message_notification',
      senderId: messageWithDetails.senderId,
      receiverId: receiverId,
      content: messageWithDetails.content.substring(0, 50)
    });
    
    await CentrifugoService.publishMessage(userChannel, {
      type: 'message_notification',
      data: {
        id: messageWithDetails.id,
        senderId: messageWithDetails.senderId,
        sender: {
          id: messageWithDetails.sender.id,
          firstName: messageWithDetails.sender.firstName,
          lastName: messageWithDetails.sender.lastName,
          profileImage: messageWithDetails.sender.profileImage
        },
        content: messageWithDetails.content,
        messageType: messageWithDetails.messageType,
        sentAt: messageWithDetails.sentAt
      }
    });
    console.log(`✅ Notification successfully sent to user:${receiverId}`);
  } catch (error) {
    console.error('⚠️ Failed to send notification to Centrifugo:', {
      userChannel: userChannel,
      receiverId: receiverId,
      error: error.message,
      details: error.response?.data || error
    });
    // Don't fail the request if notification fails
  }

  // 🔔 Send Novu notification
  try {
    await novuService.sendMessageNotification(receiverId, {
      id: messageWithDetails.id,
      senderId: messageWithDetails.senderId,
      senderName: `${messageWithDetails.sender.firstName} ${messageWithDetails.sender.lastName}`,
      senderAvatar: messageWithDetails.sender.profile_image,
      content: messageWithDetails.content
    });
  } catch (error) {
    console.error('❌ Error sending Novu notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(201).json({
    message: 'Message sent successfully',
    data: messageWithDetails
  });
});

// @desc    Get messages for a conversation
// @route   GET /api/messages/conversation/:userId
// @access  Private
const getConversation = asyncHandler(async (req, res) => {
  const { userId: otherUserId } = req.params;
  const { page = 1, limit = 50, contractId, jobApplicationId } = req.query;
  const currentUserId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  console.log(`📥 getConversation called: currentUser=${currentUserId}, otherUser=${otherUserId}, page=${page}, limit=${limit}`);

  // Check if other user exists
  const otherUser = await db.User.findByPk(otherUserId);
  if (!otherUser) {
    console.log(`❌ User ${otherUserId} not found`);
    return res.status(404).json({ error: 'User not found' });
  }

  let whereClause = {
    [db.Sequelize.Op.or]: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: currentUserId }
    ]
  };

  if (contractId) {
    whereClause.contractId = contractId;
  }

  if (jobApplicationId) {
    whereClause.jobApplicationId = jobApplicationId;
  }

  const messages = await db.Message.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.User, as: 'sender' },
      { model: db.User, as: 'receiver' }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['sentAt', 'DESC']] // Get newest messages first
  });

  // Reverse to show oldest first in UI (chat convention)
  messages.rows.reverse();

  // Transform attachment URLs to absolute URLs
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  const transformedMessages = messages.rows.map(msg => {
    const messageData = msg.toJSON();
    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      messageData.attachments = messageData.attachments.map(attachment => {
        // If URL is relative, make it absolute
        if (attachment.url && attachment.url.startsWith('/')) {
          return {
            ...attachment,
            url: `${baseUrl}${attachment.url}`
          };
        }
        return attachment;
      });
    }
    return messageData;
  });

  console.log(`✅ Found ${messages.count} messages, returning ${transformedMessages.length} messages`);
  if (transformedMessages.length > 0) {
    console.log(`📨 Latest message: ID=${transformedMessages[transformedMessages.length - 1].id}, content="${transformedMessages[transformedMessages.length - 1].content?.substring(0, 30)}"`);
  }

  // Mark messages as read
  await db.Message.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        isRead: false
      }
    }
  );

  res.json({
    messages: transformedMessages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(messages.count / parseInt(limit)),
      totalMessages: messages.count,
      messagesPerPage: parseInt(limit)
    }
  });
});

// @desc    Get messages for a contract
// @route   GET /api/messages/contract/:contractId
// @access  Private
const getContractMessages = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if contract exists and user is authorized
  const contract = await db.Contract.findByPk(contractId);
  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view messages for this contract' });
  }

  const messages = await db.Message.findAndCountAll({
    where: { contractId },
    include: [
      { model: db.User, as: 'sender' },
      { model: db.User, as: 'receiver' }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['sentAt', 'ASC']]
  });

  // Transform attachment URLs to absolute URLs
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  const transformedMessages = messages.rows.map(msg => {
    const messageData = msg.toJSON();
    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      messageData.attachments = messageData.attachments.map(attachment => {
        if (attachment.url && attachment.url.startsWith('/')) {
          return { ...attachment, url: `${baseUrl}${attachment.url}` };
        }
        return attachment;
      });
    }
    return messageData;
  });

  res.json({
    messages: transformedMessages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(messages.count / parseInt(limit)),
      totalMessages: messages.count,
      messagesPerPage: parseInt(limit)
    }
  });
});

// @desc    Get messages for a job application
// @route   GET /api/messages/job-application/:jobApplicationId
// @access  Private
const getJobApplicationMessages = asyncHandler(async (req, res) => {
  const { jobApplicationId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if job application exists and user is authorized
  const jobApplication = await db.JobApplication.findByPk(jobApplicationId, {
    include: [{ model: db.JobPost, as: 'jobPost' }]
  });

  if (!jobApplication) {
    return res.status(404).json({ error: 'Job application not found' });
  }

  if (jobApplication.userId !== userId && jobApplication.jobPost.clientId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view messages for this application' });
  }

  const messages = await db.Message.findAndCountAll({
    where: { jobApplicationId },
    include: [
      { model: db.User, as: 'sender' },
      { model: db.User, as: 'receiver' }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['sentAt', 'ASC']]
  });

  // Transform attachment URLs to absolute URLs
  const baseUrl = process.env.API_URL || `${req.protocol}://${req.get('host')}`;
  const transformedMessages = messages.rows.map(msg => {
    const messageData = msg.toJSON();
    if (messageData.attachments && Array.isArray(messageData.attachments)) {
      messageData.attachments = messageData.attachments.map(attachment => {
        if (attachment.url && attachment.url.startsWith('/')) {
          return { ...attachment, url: `${baseUrl}${attachment.url}` };
        }
        return attachment;
      });
    }
    return messageData;
  });

  res.json({
    messages: transformedMessages,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(messages.count / parseInt(limit)),
      totalMessages: messages.count,
      messagesPerPage: parseInt(limit)
    }
  });
});

// @desc    Get user's conversations
// @route   GET /api/messages/conversations
// @access  Private
const getConversations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Get conversations from the Conversation model
  const { count, rows: conversations } = await db.Conversation.findAndCountAll({
    where: {
      [db.Sequelize.Op.or]: [
        { participant1Id: userId },
        { participant2Id: userId }
      ]
    },
    include: [
      { 
        model: db.User, 
        as: 'participant1',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
      },
      { 
        model: db.User, 
        as: 'participant2',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profileImage']
      },
      { 
        model: db.Message, 
        as: 'lastMessage',
        attributes: ['id', 'content', 'messageType', 'sentAt', 'senderId']
      }
    ],
    order: [['lastMessageAt', 'DESC']],
    limit: parseInt(limit),
    offset
  });

  // Format conversations for response
  const conversationList = conversations.map(conv => {
    const isParticipant1 = conv.participant1Id === userId;
    const otherUser = isParticipant1 ? conv.participant2 : conv.participant1;
    const unreadCount = isParticipant1 ? conv.unreadCount1 : conv.unreadCount2;

    return {
      id: otherUser.id,
      otherUser: {
        id: otherUser.id,
        firstName: otherUser.firstName,
        lastName: otherUser.lastName,
        email: otherUser.email,
        profile_image: otherUser.profile_image
      },
      lastMessage: conv.lastMessage ? {
        id: conv.lastMessage.id,
        content: conv.lastMessage.content,
        messageType: conv.lastMessage.messageType,
        sentAt: conv.lastMessage.sentAt,
        isFromMe: conv.lastMessage.senderId === userId
      } : null,
      lastMessageAt: conv.lastMessageAt,
      unreadCount
    };
  });

  res.json({
    conversations: conversationList,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / parseInt(limit)),
      totalConversations: count,
      conversationsPerPage: parseInt(limit)
    }
  });
});

// @desc    Mark messages as read
// @route   PUT /api/messages/mark-read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { messageIds, senderId } = req.body;
  const userId = req.userId;

  let whereClause = {
    receiverId: userId,
    isRead: false
  };

  if (messageIds && messageIds.length > 0) {
    whereClause.id = { [db.Sequelize.Op.in]: messageIds };
  }

  if (senderId) {
    whereClause.senderId = senderId;
  }

  await db.Message.update(
    { isRead: true, readAt: new Date() },
    { where: whereClause }
  );

  res.json({ message: 'Messages marked as read successfully' });
});

// @desc    Delete message
// @route   DELETE /api/messages/:messageId
// @access  Private
const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.userId;

  const message = await db.Message.findByPk(messageId);

  if (!message) {
    return res.status(404).json({ error: 'Message not found' });
  }

  // Check if user is the sender
  if (message.senderId !== userId) {
    return res.status(403).json({ error: 'Not authorized to delete this message' });
  }

  await message.destroy();

  res.json({ message: 'Message deleted successfully' });
});

// @desc    Get unread message count
// @route   GET /api/messages/unread-count
// @access  Private
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const unreadCount = await db.Message.count({
    where: {
      receiverId: userId,
      isRead: false
    }
  });

  res.json({ unreadCount });
});

module.exports = {
  sendMessage,
  getConversation,
  getContractMessages,
  getJobApplicationMessages,
  getConversations,
  markMessagesAsRead,
  deleteMessage,
  getUnreadCount,
};