const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const novuService = require('../services/novuService');
const db = require('../db');

/**
 * @swagger
 * /api/novu/subscribe:
 *   post:
 *     tags: [Novu]
 *     summary: Subscribe user to Novu notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User subscribed successfully
 */
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const user = await db.User.findByPk(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const result = await novuService.subscribeUser(user.id, {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      full_name: user.full_name,
      profile_image: user.profile_image,
      role: user.userType,
      username: user.username
    });

    if (result) {
      res.json({ message: 'Successfully subscribed to notifications' });
    } else {
      res.status(500).json({ error: 'Failed to subscribe to notifications' });
    }
  } catch (error) {
    console.error('Error subscribing to Novu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/novu/unsubscribe:
 *   post:
 *     tags: [Novu]
 *     summary: Unsubscribe user from Novu notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User unsubscribed successfully
 */
router.post('/unsubscribe', authenticateToken, async (req, res) => {
  try {
    const result = await novuService.unsubscribeUser(req.userId);
    
    if (result) {
      res.json({ message: 'Successfully unsubscribed from notifications' });
    } else {
      res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
    }
  } catch (error) {
    console.error('Error unsubscribing from Novu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
