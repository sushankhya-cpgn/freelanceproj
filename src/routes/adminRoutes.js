const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticateToken, requireAdmin);

router.get('/metrics', adminController.getMetrics);

module.exports = router;
