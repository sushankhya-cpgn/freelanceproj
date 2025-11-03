const { User, Freelancer, JobPost, JobApplication, Connect, sequelize } = require('../db');
const db = require('../db');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

/**
 * @swagger
 * components:
 *   schemas:
 *     JobSearchRequest:
 *       type: object
 *       properties:
 *         searchTerm:
 *           type: string
 *           example: "web development"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["javascript", "react", "node.js"]
 *         budgetMin:
 *           type: number
 *           example: 500
 *         budgetMax:
 *           type: number
 *           example: 5000
 *         jobType:
 *           type: string
 *           enum: [fixed, hourly]
 *           example: "fixed"
 *         experienceLevel:
 *           type: string
 *           enum: [entry, intermediate, expert]
 *           example: "intermediate"
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *     
 *     JobSearchResponse:
 *       type: object
 *       properties:
 *         jobs:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/JobPost'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalJobs:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 */

// @desc    Search jobs for freelancers
// @route   GET /api/freelancer/jobs/search
// @access  Private (Freelancer)
const searchJobs = asyncHandler(async (req, res) => {
  const {
    searchTerm,
    skills = [],
    budgetMin,
    budgetMax,
    jobType,
    experienceLevel,
    page = 1,
    limit = 10
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {
    status: 'active',
    isPublic: true
  };

  // Search by title or description
  if (searchTerm) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } }
    ];
  }

  // Filter by budget
  if (budgetMin || budgetMax) {
    whereClause.budget = {};
    if (budgetMin) whereClause.budget[Op.gte] = budgetMin;
    if (budgetMax) whereClause.budget[Op.lte] = budgetMax;
  }

  // Filter by job type
  if (jobType) {
    whereClause.budgetType = jobType;
  }

  // Filter by experience level
  if (experienceLevel) {
    whereClause.experienceLevel = experienceLevel;
  }

  // Filter by skills
  if (skills.length > 0) {
    whereClause.skills = {
      [Op.contains]: skills
    };
  }

  const { count, rows: jobs } = await JobPost.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true,
    subQuery: false
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    jobs,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalJobs: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// @desc    Get job details
// @route   GET /api/freelancer/jobs/:id
// @access  Private (Freelancer)
const getJobDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await JobPost.findByPk(id, {
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
      }
    ]
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  res.json({
    success: true,
    job
  });
});

// @desc    Get freelancer's applications
// @route   GET /api/freelancer/applications
// @access  Private (Freelancer)
const getMyApplications = asyncHandler(async (req, res) => {
  const freelancerId = req.user.freelancerId;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { freelancerId };

  if (status) {
    whereClause.status = status;
  }

  const { count, rows: applications } = await JobApplication.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: JobPost,
        as: 'jobPost',
        include: [
          {
            model: User,
            as: 'client',
            attributes: ['id', 'firstName', 'lastName', 'profileImage']
          }
        ]
      }
    ],
    order: [['appliedAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    applications,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalApplications: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// @desc    Get freelancer profile
// @route   GET /api/freelancer/profile
// @access  Private (Freelancer)
const getProfile = asyncHandler(async (req, res) => {
  const freelancerId = req.user.freelancerId;

  const freelancer = await Freelancer.findByPk(freelancerId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'profileImage', 'connectBalance']
      }
    ]
  });

  if (!freelancer) {
    return res.status(404).json({
      success: false,
      message: 'Freelancer profile not found'
    });
  }

  res.json({
    success: true,
    freelancer
  });
});

// @desc    Create or update freelancer profile
// @route   PUT /api/freelancer/profile
// @access  Private (Freelancer)
const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const updateData = req.body;

  // Check if freelancer profile exists
  let freelancer = await Freelancer.findOne({
    where: { userId },
    include: [{ model: db.User, as: 'freelancerUser' }]
  });

  if (!freelancer) {
    // Create new freelancer profile
    freelancer = await Freelancer.create({
      userId,
      firstName: updateData.firstName || req.user.firstName,
      lastName: updateData.lastName || req.user.lastName,
      email: updateData.email || req.user.email,
      shortBio: updateData.shortBio || 'New freelancer',
      yearsOfExperience: updateData.yearsOfExperience || '0-1 years',
      expertise: updateData.expertise || 'General',
      userType: updateData.userType || 'it',
      visibility: updateData.visibility || 'public'
    });
  } else {
    // Update existing profile
    await freelancer.update(updateData);
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    freelancer
  });
});

// @desc    Get freelancer's connect balance
// @route   GET /api/freelancer/connects
// @access  Private (Freelancer)
const getConnectBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const user = await User.findByPk(userId, {
    attributes: ['connectBalance']
  });

  res.json({
    success: true,
    connectBalance: user.connectBalance
  });
});

module.exports = {
  searchJobs,
  getJobDetails,
  getMyApplications,
  getProfile,
  updateProfile,
  getConnectBalance
};
