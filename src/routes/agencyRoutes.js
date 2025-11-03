const express = require('express');
const router = express.Router();

const agencyController = require('../controllers/agencyController');
const { authenticateToken, requireAgency, requireOwnership } = require('../middleware/auth');
const {
  validateAgencyProfile,
  validateAgencyId,
  validateFreelancerId,
  validatePagination,
  validateSearch
} = require('../middleware/validation');

// @route   POST /api/agencies
// @desc    Create agency profile
// @access  Private
router.post('/', authenticateToken, validateAgencyProfile, agencyController.createAgencyProfile);

// @route   GET /api/agencies/profile
// @desc    Get agency profile
// @access  Private
router.get('/profile', authenticateToken, agencyController.getAgencyProfile);

// @route   PUT /api/agencies/profile
// @desc    Update agency profile
// @access  Private
router.put('/profile', authenticateToken, validateAgencyProfile, agencyController.updateAgencyProfile);

// @route   GET /api/agencies
// @desc    Get all agencies
// @access  Public
router.get('/', validatePagination, validateSearch, agencyController.getAgencies);

// @route   GET /api/agencies/:agencyId
// @desc    Get agency details
// @access  Public
router.get('/:agencyId', validateAgencyId, agencyController.getAgencyDetails);

// @route   POST /api/agencies/:agencyId/freelancers
// @desc    Add freelancer to agency
// @access  Private
router.post('/:agencyId/freelancers', authenticateToken, validateAgencyId, agencyController.addFreelancerToAgency);

// @route   GET /api/agencies/:agencyId/freelancers
// @desc    Get agency freelancers
// @access  Private
router.get('/:agencyId/freelancers', authenticateToken, validateAgencyId, validatePagination, agencyController.getAgencyFreelancers);

// @route   PUT /api/agencies/:agencyId/freelancers/:freelancerId
// @desc    Update freelancer status in agency
// @access  Private
router.put('/:agencyId/freelancers/:freelancerId', authenticateToken, validateAgencyId, validateFreelancerId, agencyController.updateFreelancerStatus);

// @route   DELETE /api/agencies/:agencyId/freelancers/:freelancerId
// @desc    Remove freelancer from agency
// @access  Private
router.delete('/:agencyId/freelancers/:freelancerId', authenticateToken, validateAgencyId, validateFreelancerId, agencyController.removeFreelancerFromAgency);

// @route   GET /api/agencies/:agencyId/jobs
// @desc    Get agency jobs
// @access  Private
router.get('/:agencyId/jobs', authenticateToken, validateAgencyId, validatePagination, agencyController.getAgencyJobs);

// @route   GET /api/agencies/:agencyId/statistics
// @desc    Get agency statistics
// @access  Private
router.get('/:agencyId/statistics', authenticateToken, validateAgencyId, agencyController.getAgencyStatistics);

// @route   GET /api/agencies/freelancers/search
// @desc    Search freelancers
// @access  Private (Agency)
router.get('/freelancers/search', authenticateToken, requireAgency, validatePagination, agencyController.searchFreelancers);

// @route   GET /api/agencies/freelancers/:id
// @desc    Get freelancer profile details
// @access  Private (Agency)
router.get('/freelancers/:id', authenticateToken, requireAgency, agencyController.getFreelancerProfile);

module.exports = router;