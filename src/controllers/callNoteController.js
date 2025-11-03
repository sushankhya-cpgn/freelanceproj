const asyncHandler = require('express-async-handler');
const db = require('../db');
const CallNote = db.CallNote;
const { Op } = require('sequelize');

/**
 * Get call notes for a specific room or conversation
 * GET /api/call-notes?roomName=xxx or ?conversationId=123
 */
exports.getCallNotes = asyncHandler(async (req, res) => {
  const { roomName, conversationId } = req.query;
  const userId = req.user.id;

  if (!roomName && !conversationId) {
    return res.status(400).json({
      success: false,
      error: 'Either roomName or conversationId is required'
    });
  }

  const where = { userId };
  if (roomName) {
    where.roomName = roomName;
  }
  if (conversationId) {
    where.conversationId = parseInt(conversationId);
  }

  const notes = await CallNote.findAll({
    where,
    order: [['updated_at', 'DESC']]
  });

  res.status(200).json({
    success: true,
    data: notes
  });
});

/**
 * Get a specific call note by ID
 * GET /api/call-notes/:id
 */
exports.getCallNoteById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const note = await CallNote.findOne({
    where: { id, userId }
  });

  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Call note not found'
    });
  }

  res.status(200).json({
    success: true,
    data: note
  });
});

/**
 * Create or update call notes
 * POST /api/call-notes
 * Body: { conversationId, roomName, notes }
 */
exports.saveCallNotes = asyncHandler(async (req, res) => {
  const { conversationId, roomName, notes } = req.body;
  const userId = req.user.id;

  if (!conversationId || !roomName) {
    return res.status(400).json({
      success: false,
      error: 'conversationId and roomName are required'
    });
  }

  // Check if notes already exist for this user and room
  let callNote = await CallNote.findOne({
    where: {
      userId,
      conversationId,
      roomName
    }
  });

  if (callNote) {
    // Update existing notes
    callNote.notes = notes || '';
    await callNote.save();
  } else {
    // Create new notes
    callNote = await CallNote.create({
      userId,
      conversationId,
      roomName,
      notes: notes || ''
    });
  }

  res.status(200).json({
    success: true,
    message: 'Notes saved successfully',
    data: callNote
  });
});

/**
 * Delete call notes
 * DELETE /api/call-notes/:id
 */
exports.deleteCallNotes = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const note = await CallNote.findOne({
    where: { id, userId }
  });

  if (!note) {
    return res.status(404).json({
      success: false,
      error: 'Call note not found'
    });
  }

  await note.destroy();

  res.status(200).json({
    success: true,
    message: 'Notes deleted successfully'
  });
});
