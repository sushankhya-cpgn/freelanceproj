const express = require('express');
const router = express.Router();

const jobApplicationController = require('../controllers/jobApplicationController');
const { authenticateToken, requireJobApplicationAccess } = require('../middleware/auth');
const {
  validateJobApplication,
  validateApplicationId,
  validateJobPostId,
  validatePagination
} = require('../middleware/validation');

// @route   POST /api/job-applications
// @desc    Apply for a job
// @access  Private
router.post('/', authenticateToken, validateJobApplication, jobApplicationController.applyForJob);

// @route   GET /api/job-applications
// @desc    Get user's job applications (alias of /my-applications)
// @access  Private
router.get('/', authenticateToken, validatePagination, jobApplicationController.getMyApplications);

// @route   GET /api/job-applications/my-applications
// @desc    Get user's job applications
// @access  Private
router.get('/my-applications', authenticateToken, validatePagination, jobApplicationController.getMyApplications);

// @route   GET /api/job-applications/statistics
// @desc    Get application statistics
// @access  Private
router.get('/statistics', authenticateToken, jobApplicationController.getApplicationStatistics);

// @route   GET /api/job-applications/job/:jobPostId
// @desc    Get job applications for a job post
// @access  Private
router.get('/job/:jobPostId', authenticateToken, validateJobPostId, validatePagination, jobApplicationController.getJobApplications);

// @route   GET /api/job-applications/:applicationId
// @desc    Get application details
// @access  Private
router.get('/:applicationId', authenticateToken, validateApplicationId, requireJobApplicationAccess, jobApplicationController.getApplicationDetails);

// @route   PUT /api/job-applications/:applicationId/status
// @desc    Update application status
// @access  Private
router.put('/:applicationId/status', authenticateToken, validateApplicationId, requireJobApplicationAccess, jobApplicationController.updateApplicationStatus);

// @route   PUT /api/job-applications/:applicationId/withdraw
// @desc    Withdraw application
// @access  Private
router.put('/:applicationId/withdraw', authenticateToken, validateApplicationId, requireJobApplicationAccess, jobApplicationController.withdrawApplication);

// @route   GET /api/job-applications/statistics
// @desc    Get application statistics
// @access  Private
router.get('/statistics', authenticateToken, jobApplicationController.getApplicationStatistics);

module.exports = router;