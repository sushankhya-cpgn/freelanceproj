const { JobPost, User, JobApplication, Freelancer, sequelize } = require('../db');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');
const searchService = require('../services/search/opensearchService');

/**
 * @swagger
 * components:
 *   schemas:
 *     JobPostUpdate:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           example: "Updated Job Title"
 *         description:
 *           type: string
 *           example: "Updated job description..."
 *         budget:
 *           type: number
 *           example: 2000
 *         status:
 *           type: string
 *           enum: [draft, active, paused, closed, completed]
 *           example: "active"
 *         isUrgent:
 *           type: boolean
 *           example: true
 *         isFeatured:
 *           type: boolean
 *           example: false
 */

// @desc    Create a new job post
// @desc    Create job post
// @route   POST /api/jobs
// @access  Private (Client or Agency)
const createJobPost = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    budget,
    budgetType,
    minBudget,
    maxBudget,
    skills = [],
    experienceLevel,
    projectDuration,
    timezone,
    status = 'draft',
    connectRequired = 0,
    isFeatured = false,
    isUrgent = false,
    hireType = 'both'
  } = req.body;

  const clientId = req.user.id;
  const userType = req.user.userType;

  // Validate required fields
  if (!title || !description || !budget || !budgetType) {
    return res.status(400).json({
      success: false,
      message: 'Title, description, budget, and budgetType are required'
    });
  }

  // Validate hireType
  if (!['freelancer', 'agency', 'both'].includes(hireType)) {
    return res.status(400).json({
      success: false,
      message: 'hireType must be one of: freelancer, agency, both'
    });
  }

  // If agency is posting a job, hireType should be 'freelancer' (agencies hire freelancers)
  // If client is posting, they can specify any hireType
  const finalHireType = userType === 'agency' ? 'freelancer' : hireType;

  // Create job post
  const job = await JobPost.create({
    title,
    description,
    budget,
    budgetType,
    minBudget,
    maxBudget,
    skills,
    experienceLevel,
    projectDuration,
    timezone,
    status,
    connectRequired,
    isFeatured,
    isUrgent,
    hireType: finalHireType,
    clientId,
    isPublic: status === 'active'
  });

  // Get job with client details
  const jobWithClient = await JobPost.findByPk(job.id, {
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      }
    ]
  });

  try {
    await searchService.indexJob(jobWithClient);
  } catch (e) {}

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    job: jobWithClient
  });
});

// @desc    Get all public job posts
// @route   GET /api/jobs
// @access  Public
const getAllJobs = asyncHandler(async (req, res) => {
  const {
    search,
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

  // Search functionality
  if (search) {
    whereClause[Op.or] = [
      { title: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } }
    ];
  }

  // Filter by skills
  if (skills.length > 0) {
    whereClause.skills = {
      [Op.contains]: skills
    };
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

  const { count, rows: jobs } = await JobPost.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      }
    ],
    order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true, // Ensure accurate count with joins
    subQuery: false // Optimize for better performance with includes
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

// @desc    Get single job post
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = asyncHandler(async (req, res) => {
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

// @desc    Update job post
// @route   PUT /api/jobs/:id
// @access  Private (Client)
const updateJobPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;
  const updateData = req.body;

  const job = await JobPost.findOne({
    where: { id, clientId }
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or access denied'
    });
  }

  await job.update(updateData);

  try {
    await searchService.updateJob(job);
  } catch (e) {}

  res.json({
    success: true,
    message: 'Job updated successfully',
    job
  });
});

// @desc    Delete job post
// @route   DELETE /api/jobs/:id
// @access  Private (Client)
const deleteJobPost = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const job = await JobPost.findOne({
    where: { id, clientId }
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or access denied'
    });
  }

  await job.destroy();

  try {
    await searchService.deleteJob(id);
  } catch (e) {}

  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// @desc    Search jobs via OpenSearch (fallback to DB if OpenSearch unavailable)
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = asyncHandler(async (req, res) => {
  const {
    q,
    skills,
    budgetMin,
    budgetMax,
    jobType,
    experienceLevel,
    page = 1,
    limit = 10,
  } = req.query;

  const skillsArr = typeof skills === 'string' && skills.length
    ? skills.split(',').map(s => s.trim()).filter(Boolean)
    : Array.isArray(skills) ? skills : [];

  try {
    const result = await searchService.searchJobs({
      q,
      skills: skillsArr,
      budgetMin: budgetMin != null ? Number(budgetMin) : undefined,
      budgetMax: budgetMax != null ? Number(budgetMax) : undefined,
      jobType,
      experienceLevel,
      page: Number(page),
      limit: Number(limit),
    });

    const totalPages = Math.ceil(result.total / Number(limit || 10));
    return res.json({
      success: true,
      jobs: result.results,
      pagination: {
        currentPage: Number(page || 1),
        totalPages,
        totalJobs: result.total,
        hasNext: Number(page || 1) < totalPages,
        hasPrev: Number(page || 1) > 1
      }
    });
  } catch (e) {
    // Fallback: DB search over public jobs
    const whereClause = { status: 'active', isPublic: true };
    if (q) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { description: { [Op.like]: `%${q}%` } },
      ];
    }
    if (skillsArr.length) {
      whereClause.skills = { [Op.contains]: skillsArr };
    }
    if (budgetMin != null || budgetMax != null) {
      whereClause.budget = {};
      if (budgetMin != null) whereClause.budget[Op.gte] = Number(budgetMin);
      if (budgetMax != null) whereClause.budget[Op.lte] = Number(budgetMax);
    }
    if (jobType) whereClause.budgetType = jobType;
    if (experienceLevel) whereClause.experienceLevel = experienceLevel;

    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows } = await JobPost.findAndCountAll({
      where: whereClause,
      include: [
        { model: User, as: 'client', attributes: ['id', 'firstName', 'lastName', 'profileImage'] },
      ],
      order: [['isFeatured', 'DESC'], ['createdAt', 'DESC']],
      limit: Number(limit),
      offset: Number(offset),
      distinct: true,
      subQuery: false,
    });

    const totalPages = Math.ceil(count / Number(limit || 10));
    return res.json({
      success: true,
      jobs: rows,
      pagination: {
        currentPage: Number(page || 1),
        totalPages,
        totalJobs: count,
        hasNext: Number(page || 1) < totalPages,
        hasPrev: Number(page || 1) > 1,
      },
      // optional meta for observability
      _fallback: true,
    });
  }
});

// @desc    Suggest job titles for typeahead
// @route   GET /api/jobs/suggest
// @access  Public
const suggestJobs = asyncHandler(async (req, res) => {
  const { q, limit = 5 } = req.query;
  const suggestions = await searchService.suggestJobTitles({ q, limit: Number(limit) });
  res.json({ success: true, suggestions });
});

// @desc    Get job statistics
// @route   GET /api/jobs/:id/stats
// @access  Private (Client)
const getJobStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const clientId = req.user.id;

  const job = await JobPost.findOne({
    where: { id, clientId }
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or access denied'
    });
  }

  const totalApplications = await JobApplication.count({
    where: { jobPostId: id }
  });

  const applicationsByStatus = await JobApplication.findAll({
    where: { jobPostId: id },
    attributes: ['status'],
    group: ['status'],
    raw: true
  });

  const statusCounts = applicationsByStatus.reduce((acc, app) => {
    acc[app.status] = (acc[app.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    stats: {
      totalApplications,
      statusCounts,
      jobViews: job.views || 0
    }
  });
});

// @desc    Get featured jobs
// @route   GET /api/jobs/featured
// @access  Public
const getFeaturedJobs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const jobs = await JobPost.findAll({
    where: {
      status: 'active',
      isPublic: true,
      isFeatured: true
    },
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    jobs
  });
});

// @desc    Get urgent jobs
// @route   GET /api/jobs/urgent
// @access  Public
const getUrgentJobs = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  const jobs = await JobPost.findAll({
    where: {
      status: 'active',
      isPublic: true,
      isUrgent: true
    },
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit)
  });

  res.json({
    success: true,
    jobs
  });
});

// @desc    Get jobs posted by the authenticated client
// @desc    Get current user's posted jobs
// @route   GET /api/jobs/my-jobs
// @access  Private (Client or Agency)
const getMyJobs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const clientId = req.user.id;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = { clientId };
  if (status) {
    whereClause.status = status;
  }

  const { count, rows: jobs } = await JobPost.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'client',
        attributes: ['id', 'firstName', 'lastName', 'profileImage']
      },
      {
        model: JobApplication,
        as: 'applications',
        attributes: ['id'],
        required: false
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    distinct: true,
    subQuery: false
  });

  // Add application count to each job
  const jobsWithCounts = jobs.map(job => ({
    ...job.toJSON(),
    applicationCount: job.applications ? job.applications.length : 0
  }));

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    jobs: jobsWithCounts,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalJobs: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

module.exports = {
  createJobPost,
  getAllJobs,
  getJobById,
  updateJobPost,
  deleteJobPost,
  getJobStats,
  getFeaturedJobs,
  getUrgentJobs,
  getMyJobs,
  searchJobs,
  suggestJobs
};