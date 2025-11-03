const express = require('express');
const router = express.Router();

const contractController = require('../controllers/contractController');
const { authenticateToken, requireContractAccess } = require('../middleware/auth');
const {
  validateContractCreation,
  validateContractId,
  validatePagination
} = require('../middleware/validation');

// @route   POST /api/contracts
// @desc    Create contract
// @access  Private
router.post('/', authenticateToken, validateContractCreation, contractController.createContract);

// @route   GET /api/contracts
// @desc    Get user's contracts
// @access  Private
router.get('/', authenticateToken, validatePagination, contractController.getContracts);

// @route   GET /api/contracts/:contractId
// @desc    Get contract details
// @access  Private
router.get('/:contractId', authenticateToken, validateContractId, requireContractAccess, contractController.getContractDetails);

// @route   PUT /api/contracts/:contractId/accept
// @desc    Accept contract
// @access  Private
router.put('/:contractId/accept', authenticateToken, validateContractId, requireContractAccess, contractController.acceptContract);

// @route   PUT /api/contracts/:contractId/decline
// @desc    Decline contract
// @access  Private
router.put('/:contractId/decline', authenticateToken, validateContractId, requireContractAccess, contractController.declineContract);

// @route   DELETE /api/contracts/:contractId
// @desc    Delete contract
// @access  Private
router.delete('/:contractId', authenticateToken, validateContractId, requireContractAccess, contractController.deleteContract);

// @route   POST /api/contracts/:contractId/request-payment
// @desc    Request payment
// @access  Private
router.post('/:contractId/request-payment', authenticateToken, validateContractId, requireContractAccess, contractController.requestPayment);

// @route   POST /api/contracts/:contractId/release-payment
// @desc    Release payment
// @access  Private
router.post('/:contractId/release-payment', authenticateToken, validateContractId, requireContractAccess, contractController.releasePayment);

// @route   PUT /api/contracts/:contractId/complete-work
// @desc    Mark work as completed
// @access  Private
router.put('/:contractId/complete-work', authenticateToken, validateContractId, requireContractAccess, contractController.completeWork);

// @route   POST /api/contracts/:contractId/dispute
// @desc    Dispute contract
// @access  Private
router.post('/:contractId/dispute', authenticateToken, validateContractId, requireContractAccess, contractController.disputeContract);

// @route   PUT /api/contracts/:contractId/resolve-dispute
// @desc    Resolve dispute
// @access  Private
router.put('/:contractId/resolve-dispute', authenticateToken, validateContractId, requireContractAccess, contractController.resolveDispute);

// @route   POST /api/contracts/:contractId/rate
// @desc    Rate freelancer on completed contract
// @access  Private (Client only)
router.post('/:contractId/rate', authenticateToken, validateContractId, contractController.rateFreelancer);

// @route   GET /api/contracts/statistics
// @desc    Get contract statistics
// @access  Private
router.get('/statistics', authenticateToken, contractController.getContractStatistics);

module.exports = router;