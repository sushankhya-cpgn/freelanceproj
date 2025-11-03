const express = require('express');
const router = express.Router();
const callNoteController = require('../controllers/callNoteController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// GET /api/call-notes - Get all notes for user (by room or conversation)
router.get('/', callNoteController.getCallNotes);

// GET /api/call-notes/:id - Get specific note by ID
router.get('/:id', callNoteController.getCallNoteById);

// POST /api/call-notes - Create or update notes
router.post('/', callNoteController.saveCallNotes);

// DELETE /api/call-notes/:id - Delete notes
router.delete('/:id', callNoteController.deleteCallNotes);

module.exports = router;
