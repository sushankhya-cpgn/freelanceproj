const { User, Freelancer, JobPost, JobApplication, Contract, sequelize } = require('../db');
const { Op } = require('sequelize');
const asyncHandler = require('express-async-handler');

/**
 * @swagger
 * components:
 *   schemas:
 *     FreelancerSearchRequest:
 *       type: object
 *       properties:
 *         searchTerm:
 *           type: string
 *           example: "react developer"
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["javascript", "react", "node.js"]
 *         hourlyRateMin:
 *           type: number
 *           example: 20
 *         hourlyRateMax:
 *           type: number
 *           example: 100
 *         experienceLevel:
 *           type: string
 *           enum: [entry, intermediate, expert]
 *           example: "intermediate"
 *         location:
 *           type: string
 *           example: "New York"
 *         availability:
 *           type: string
 *           enum: [available, busy, not_available]
 *           example: "available"
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *     
 *     JobPostRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - budget
 *         - budgetType
 *       properties:
 *         title:
 *           type: string
 *           example: "Build a React Website"
 *         description:
 *           type: string
 *           example: "I need a professional website built with React..."
 *         budget:
 *           type: number
 *           example: 1500
 *         budgetType:
 *           type: string
 *           enum: [fixed, hourly, range]
 *           example: "fixed"
 *         minBudget:
 *           type: number
 *           example: 1000
 *         maxBudget:
 *           type: number
 *           example: 2000
 *         skills:
 *           type: array
 *           items:
 *             type: string
 *           example: ["react", "javascript", "css"]
 *         experienceLevel:
 *           type: string
 *           enum: [entry, intermediate, expert]
 *           example: "intermediate"
 *         projectDuration:
 *           type: string
 *           example: "2-4 weeks"
 *         timezone:
 *           type: string
 *           example: "EST"
 *         connectRequired:
 *           type: integer
 *           example: 2
 *         isUrgent:
 *           type: boolean
 *           example: false
 *         isFeatured:
 *           type: boolean
 *           example: false
 */

// @desc    Search freelancers
// @route   GET /api/client/freelancers/search
// @access  Private (Client)
const searchFreelancers = asyncHandler(async (req, res) => {
  const {
    searchTerm,
    skills = [],
    hourlyRateMin,
    hourlyRateMax,
    experienceLevel,
    location,
    availability,
    page = 1,
    limit = 10
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = {
    visibility: 'public'
  };

  // Search by name, expertise, or shortBio
  if (searchTerm) {
    whereClause[Op.or] = [
      { firstName: { [Op.like]: `%${searchTerm}%` } },
      { lastName: { [Op.like]: `%${searchTerm}%` } },
      { expertise: { [Op.like]: `%${searchTerm}%` } },
      { shortBio: { [Op.like]: `%${searchTerm}%` } }
    ];
  }

  // Filter by location
  if (location) {
    whereClause[Op.or] = [
      { city: { [Op.like]: `%${location}%` } },
      { country: { [Op.like]: `%${location}%` } }
    ];
  }

  // Filter by skills in category
  if (skills.length > 0) {
    whereClause.category = {
      [Op.contains]: skills
    };
  }

  const { count, rows: freelancers } = await Freelancer.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: User,
        as: 'freelancerUser',
        attributes: [
          'id', 
          'email', 
          'firstName', 
          'lastName', 
          'profileImage', 
          'connectBalance',
          'averageRating',
          'totalRatings',
          'totalReviews'
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  // Attach simple platform stats to each freelancer (small N, acceptable for UI page)
  await Promise.all(
    freelancers.map(async (f) => {
      try {
        const fid = f.id;
        const [completedContracts, activeContracts, totalContracts] = await Promise.all([
          Contract.count({ where: { freelancerId: fid, contractStatus: 'completed' } }),
          Contract.count({ where: { freelancerId: fid, contractStatus: 'active' } }),
          Contract.count({ where: { freelancerId: fid } }),
        ]);
        // Get real ratings from user model
        const avgRating = f.freelancerUser?.averageRating || 0;
        const reviewsCount = f.freelancerUser?.totalReviews || 0;
        
        f.dataValues.stats = {
          completedContracts,
          activeContracts,
          totalContracts,
          avgRating: parseFloat(avgRating),
          reviewsCount,
        };
      } catch {}
    })
  );

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    freelancers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalFreelancers: count,
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// @desc    Get freelancer profile
// @route   GET /api/client/freelancers/:id
// @access  Private (Client)
const getFreelancerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const freelancer = await Freelancer.findByPk(id, {
    include: [
      {
        model: User,
        as: 'freelancerUser',
        attributes: [
          'id', 
          'email', 
          'firstName', 
          'lastName', 
          'profileImage',
          'bio',
          'country',
          'hourlyRate',
          'availability',
          'skills',
          'experiences',
          'portfolioItems',
          'averageRating',
          'totalRatings',
          'totalReviews'
        ]
      }
    ]
  });

  if (!freelancer) {
    return res.status(404).json({
      success: false,
      message: 'Freelancer not found'
    });
  }

  // Compute simple platform stats for this freelancer
  const [completedContracts, activeContracts, totalContracts] = await Promise.all([
    Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'completed' } }),
    Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'active' } }),
    Contract.count({ where: { freelancerId: freelancer.id } }),
  ]);

  // Get real rating from user model
  const avgRating = freelancer.freelancerUser?.averageRating || 0;
  const reviewsCount = freelancer.freelancerUser?.totalReviews || 0;

  res.json({
    success: true,
    freelancer,
    stats: {
      completedContracts,
      activeContracts,
      totalContracts,
      avgRating: parseFloat(avgRating),
      reviewsCount,
    }
  });
});

// @desc    Create job post
// @route   POST /api/client/jobs
// @access  Private (Client)
const createJobPost = asyncHandler(async (req, res) => {
  const clientId = req.user.id;
  const jobData = {
    ...req.body,
    clientId,
    status: 'draft'
  };

  const job = await JobPost.create(jobData);

  res.status(201).json({
    success: true,
    message: 'Job post created successfully',
    job
  });
});

// @desc    Get client's job posts
// @route   GET /api/client/jobs
// @access  Private (Client)
const getMyJobPosts = asyncHandler(async (req, res) => {
  const clientId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { clientId };

  if (status) {
    whereClause.status = status;
  }

  const { count, rows: jobs } = await JobPost.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
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

// @desc    Get job applications for a specific job
// @route   GET /api/client/jobs/:jobId/applications
// @access  Private (Client)
const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const clientId = req.user.id;

  // Verify the job belongs to the client
  const job = await JobPost.findOne({
    where: { id: jobId, clientId }
  });

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found or access denied'
    });
  }

  const applications = await JobApplication.findAll({
    where: { jobPostId: jobId },
    include: [
      {
        model: Freelancer,
        as: 'freelancer',
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
          }
        ]
      }
    ],
    order: [['appliedAt', 'DESC']]
  });

  res.json({
    success: true,
    applications
  });
});

// @desc    Update job application status
// @route   PUT /api/client/applications/:applicationId/status
// @access  Private (Client)
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  const clientId = req.user.id;

  const application = await JobApplication.findByPk(applicationId, {
    include: [
      {
        model: JobPost,
        as: 'jobPost',
        where: { clientId }
      }
    ]
  });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found or access denied'
    });
  }

  await application.update({ status });

  res.json({
    success: true,
    message: 'Application status updated successfully',
    application
  });
});

// @desc    Get client's contracts
// @route   GET /api/client/contracts
// @access  Private (Client)
const getMyContracts = asyncHandler(async (req, res) => {
  const clientId = req.user.id;
  const { page = 1, limit = 10, status } = req.query;

  const offset = (page - 1) * limit;
  const whereClause = { clientId };

  if (status) {
    whereClause.contractStatus = status;
  }

  const { count, rows: contracts } = await Contract.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Freelancer,
        as: 'freelancer',
        include: [
          {
            model: User,
            as: 'freelancerUser',
            attributes: ['id', 'firstName', 'lastName', 'profileImage', 'email']
          }
        ]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset)
  });

  const totalPages = Math.ceil(count / limit);

  res.json({
    success: true,
    contracts,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalContracts: count,
      contractsPerPage: parseInt(limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  });
});

// @desc    Create contract
// @route   POST /api/client/contracts
// @access  Private (Client)
const createContract = asyncHandler(async (req, res) => {
  const clientId = req.user.id;
  const contractData = {
    ...req.body,
    clientId,
    contractStatus: 'draft'
  };

  const contract = await Contract.create(contractData);

  res.status(201).json({
    success: true,
    message: 'Contract created successfully',
    contract
  });
});

module.exports = {
  searchFreelancers,
  getFreelancerProfile,
  // New: public handle-based lookup
  getFreelancerByUsername: asyncHandler(async (req, res) => {
    const { username } = req.params;
    if (!username) {
      return res.status(400).json({ success: false, message: 'username is required' });
    }

    // Find freelancer by joining the associated User.username
    const freelancer = await Freelancer.findOne({
      include: [
        {
          model: User,
          as: 'freelancerUser',
          where: { username },
          attributes: ['id', 'email', 'firstName', 'lastName', 'profileImage', 'username']
        }
      ]
    });

    if (!freelancer) {
      return res.status(404).json({ success: false, message: 'Freelancer not found' });
    }

    const [completedContracts, activeContracts, totalContracts] = await Promise.all([
      Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'completed' } }),
      Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'active' } }),
      Contract.count({ where: { freelancerId: freelancer.id } }),
    ]);

    return res.json({
      success: true,
      freelancer,
      stats: {
        completedContracts,
        activeContracts,
        totalContracts,
        avgRating: typeof freelancer.avgRating === 'number' ? freelancer.avgRating : 0,
        reviewsCount: typeof freelancer.reviewsCount === 'number' ? freelancer.reviewsCount : 0,
      }
    });
  }),
  createJobPost,
  getMyJobPosts,
  getJobApplications,
  updateApplicationStatus,
  getMyContracts,
  createContract
};

// Lightweight suggestions for freelancer search (public or auth)
module.exports.suggestFreelancers = asyncHandler(async (req, res) => {
  const { q, limit = 5 } = req.query;
  const lim = Number(limit) || 5;
  let suggestions = [];
  try {
    suggestions = await osFreelancers.suggestFreelancers({ q, limit: lim });
  } catch (e) {
    // ignore and fallback
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    // Fallback to DB LIKE search (visibility: public)
    const term = (q || '').trim();
    if (term) {
      const whereClause = { visibility: 'public' };
      // We will filter by name/expertise/shortBio via include and ORs
      const rows = await Freelancer.findAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'freelancerUser',
            attributes: ['firstName', 'lastName'],
            where: {
              [Op.or]: [
                { firstName: { [Op.like]: `%${term}%` } },
                { lastName: { [Op.like]: `%${term}%` } },
              ]
            }
          }
        ],
        limit: lim,
      });
      suggestions = rows.map(r => ({
        id: r.id,
        name: `${r.freelancerUser?.firstName || ''} ${r.freelancerUser?.lastName || ''}`.trim(),
        expertise: r.expertise || r.shortBio || undefined,
      })).filter(x => x.name);
    }
  }

  res.json({ success: true, suggestions });
});
