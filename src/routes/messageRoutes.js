const express = require('express');
const router = express.Router();

const messageController = require('../controllers/messageController');
const { authenticateToken } = require('../middleware/auth');
const { uploadMessageFiles, handleUploadError } = require('../middleware/upload');
const {
  validateMessage,
  validateId,
  validateContractId,
  validateApplicationId,
  validateMessageId,
  validatePagination
} = require('../middleware/validation');

// @route   POST /api/messages
// @desc    Send message (with optional file attachments)
// @access  Private
router.post('/', authenticateToken, uploadMessageFiles, handleUploadError, messageController.sendMessage);

// @route   GET /api/messages/conversation/:userId
// @desc    Get messages for a conversation
// @access  Private
router.get('/conversation/:userId', authenticateToken, validateId, validatePagination, messageController.getConversation);

// @route   GET /api/messages/contract/:contractId
// @desc    Get messages for a contract
// @access  Private
router.get('/contract/:contractId', authenticateToken, validateContractId, validatePagination, messageController.getContractMessages);

// @route   GET /api/messages/job-application/:jobApplicationId
// @desc    Get messages for a job application
// @access  Private
router.get('/job-application/:jobApplicationId', authenticateToken, validateApplicationId, validatePagination, messageController.getJobApplicationMessages);

// @route   GET /api/messages/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', authenticateToken, validatePagination, messageController.getConversations);

// @route   PUT /api/messages/mark-read
// @desc    Mark messages as read
// @access  Private
router.put('/mark-read', authenticateToken, messageController.markMessagesAsRead);

// @route   DELETE /api/messages/:messageId
// @desc    Delete message
// @access  Private
router.delete('/:messageId', authenticateToken, validateMessageId, messageController.deleteMessage);

// @route   GET /api/messages/unread-count
// @desc    Get unread message count
// @access  Private
router.get('/unread-count', authenticateToken, messageController.getUnreadCount);

module.exports = router;