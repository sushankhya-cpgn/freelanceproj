const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const clientController = require('../controllers/clientController');

/**
 * @swagger
 * tags:
 *   name: Client
 *   description: Client related endpoints
 */

/**
 * @swagger
 * /api/client/freelancers/search:
 *   get:
 *     summary: Search freelancers
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         description: Search term for freelancer name or skills
 *       - in: query
 *         name: skills
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Array of required skills
 *       - in: query
 *         name: hourlyRateMin
 *         schema:
 *           type: number
 *         description: Minimum hourly rate
 *       - in: query
 *         name: hourlyRateMax
 *         schema:
 *           type: number
 *         description: Maximum hourly rate
 *       - in: query
 *         name: experienceLevel
 *         schema:
 *           type: string
 *           enum: [entry, intermediate, expert]
 *         description: Required experience level
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of freelancers per page
 *     responses:
 *       200:
 *         description: Freelancers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 freelancers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Freelancer'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalFreelancers:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.get('/freelancers/search', authenticateToken, requireRole('client'), clientController.searchFreelancers);
// Public read-only search
router.get('/freelancers/public/search', clientController.searchFreelancers);
// Suggestions (auth and public)
router.get('/freelancers/suggest', authenticateToken, requireRole('client'), clientController.suggestFreelancers);
router.get('/freelancers/public/suggest', clientController.suggestFreelancers);

/**
 * @swagger
 * /api/client/freelancers/{id}:
 *   get:
 *     summary: Get freelancer profile
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Freelancer ID
 *     responses:
 *       200:
 *         description: Freelancer profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 freelancer:
 *                   $ref: '#/components/schemas/Freelancer'
 *       404:
 *         description: Freelancer not found
 */
router.get('/freelancers/:id', authenticateToken, requireRole('client'), clientController.getFreelancerProfile);
// Public read-only profile view
router.get('/freelancers/public/:id', clientController.getFreelancerProfile);

/**
 * @swagger
 * /api/client/jobs:
 *   post:
 *     summary: Create job post
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/JobPostRequest'
 *     responses:
 *       201:
 *         description: Job post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 job:
 *                   $ref: '#/components/schemas/JobPost'
 *   get:
 *     summary: Get client's job posts
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of jobs per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, paused, closed, completed]
 *         description: Filter by job status
 *     responses:
 *       200:
 *         description: Job posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 jobs:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobPost'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalJobs:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.post('/jobs', authenticateToken, requireRole('client'), clientController.createJobPost);
router.get('/jobs', authenticateToken, requireRole('client'), clientController.getMyJobPosts);

/**
 * @swagger
 * /api/client/jobs/{jobId}/applications:
 *   get:
 *     summary: Get job applications
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Job ID
 *     responses:
 *       200:
 *         description: Applications retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 applications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/JobApplication'
 *       404:
 *         description: Job not found or access denied
 */
router.get('/jobs/:jobId/applications', authenticateToken, requireRole('client'), clientController.getJobApplications);

/**
 * @swagger
 * /api/client/applications/{applicationId}/status:
 *   put:
 *     summary: Update application status
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Application ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [reviewed, shortlisted, rejected, accepted]
 *                 example: "shortlisted"
 *     responses:
 *       200:
 *         description: Application status updated successfully
 *       404:
 *         description: Application not found or access denied
 */
router.put('/applications/:applicationId/status', authenticateToken, requireRole('client'), clientController.updateApplicationStatus);

/**
 * @swagger
 * /api/client/contracts:
 *   get:
 *     summary: Get client's contracts
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of contracts per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, pending, active, completed, cancelled, disputed]
 *         description: Filter by contract status
 *     responses:
 *       200:
 *         description: Contracts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 contracts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Contract'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalContracts:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 *   post:
 *     summary: Create contract
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Contract'
 *     responses:
 *       201:
 *         description: Contract created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 contract:
 *                   $ref: '#/components/schemas/Contract'
 */
router.get('/contracts', authenticateToken, requireRole('client'), clientController.getMyContracts);
router.post('/contracts', authenticateToken, requireRole('client'), clientController.createContract);

module.exports = router;
