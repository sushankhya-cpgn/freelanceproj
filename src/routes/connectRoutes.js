const express = require('express');
const router = express.Router();

const connectController = require('../controllers/connectController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateConnectPurchase,
  validatePagination
} = require('../middleware/validation');

// @route   POST /api/connects/purchase
// @desc    Purchase connects
// @access  Private
router.post('/purchase', authenticateToken, validateConnectPurchase, connectController.purchaseConnects);

// @route   POST /api/connects/add
// @desc    Add connects directly (for testing)
// @access  Private
router.post('/add', authenticateToken, connectController.addConnects);

// @route   POST /api/connects/create-payment-intent
// @desc    Create payment intent for connects
// @access  Private
router.post('/create-payment-intent', authenticateToken, connectController.createPaymentIntent);

// @route   POST /api/connects/confirm-payment
// @desc    Confirm payment and add connects
// @access  Private
router.post('/confirm-payment', authenticateToken, connectController.confirmPayment);

// @route   POST /api/connects/use
// @desc    Use connects for job application
// @access  Private
router.post('/use', authenticateToken, connectController.useConnects);

// @route   GET /api/connects
// @desc    Get user's connects
// @access  Private
router.get('/', authenticateToken, validatePagination, connectController.getConnects);

// @route   GET /api/connects/statistics
// @desc    Get connect statistics
// @access  Private
router.get('/statistics', authenticateToken, connectController.getConnectStatistics);

// @route   GET /api/connects/packages
// @desc    Get connect packages
// @access  Public
router.get('/packages', connectController.getConnectPackages);

module.exports = router;