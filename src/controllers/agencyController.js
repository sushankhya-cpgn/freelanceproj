const asyncHandler = require('express-async-handler');
const db = require('../db');
const { validationResult } = require('express-validator');

// @desc    Create agency profile
// @route   POST /api/agencies
// @access  Private
const createAgencyProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }

  const {
    agencyName,
    description,
    website,
    phone,
    address,
    city,
    country,
    businessType,
    taxId,
    specializations,
    teamSize,
    yearsInBusiness
  } = req.body;

  const userId = req.userId;

  try {
    // Check if user already has an agency
    const existingAgency = await db.Agency.findOne({ where: { userId } });
    if (existingAgency) {
      return res.status(400).json({ 
        success: false,
        error: 'Agency profile already exists',
        message: 'You already have an agency profile. Please update your existing profile instead.'
      });
    }

    // Validate required fields
    if (!agencyName || !agencyName.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Agency name is required',
        message: 'Please provide a valid agency name'
      });
    }

    // Create agency
    const agency = await db.Agency.create({
      userId,
      agencyName: agencyName.trim(),
      description: description?.trim() || null,
      website,
      phone,
      address,
      city,
      country,
      businessType,
      taxId,
      specializations: Array.isArray(specializations) ? specializations : [],
      teamSize: teamSize ? parseInt(teamSize) : 1,
      yearsInBusiness: yearsInBusiness ? parseInt(yearsInBusiness) : 0
    });

    // Get agency with user details
    const agencyWithDetails = await db.Agency.findByPk(agency.id, {
      include: [{ model: db.User, as: 'agencyUser' }]
    });

    res.status(201).json({
      success: true,
      message: 'Agency profile created successfully',
      agency: agencyWithDetails
    });
  } catch (error) {
    console.error('Error creating agency profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agency profile',
      message: 'An error occurred while creating your agency profile. Please try again later.'
    });
  }
});

// @desc    Get agency profile
// @route   GET /api/agencies/profile
// @access  Private
const getAgencyProfile = asyncHandler(async (req, res) => {
  const userId = req.userId;

  try {
    const agency = await db.Agency.findOne({
      where: { userId },
      include: [{ model: db.User, as: 'agencyUser' }]
    });

    if (!agency) {
      return res.status(404).json({ 
        success: false,
        error: 'Agency profile not found',
        message: 'No agency profile found for this account. Please create one to continue.'
      });
    }

    res.json({ 
      success: true,
      agency 
    });
  } catch (error) {
    console.error('Error fetching agency profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency profile',
      message: 'An error occurred while loading your profile. Please try again later.'
    });
  }
});

// @desc    Update agency profile
// @route   PUT /api/agencies/profile
// @access  Private
const updateAgencyProfile = asyncHandler(async (req, res) => {
  const {
    agencyName,
    description,
    website,
    phone,
    address,
    city,
    country,
    businessType,
    taxId,
    specializations,
    teamSize,
    yearsInBusiness
  } = req.body;

  const userId = req.userId;

  try {
    const agency = await db.Agency.findOne({ where: { userId } });
    if (!agency) {
      return res.status(404).json({ 
        success: false,
        error: 'Agency profile not found',
        message: 'No agency profile found. Please create one first.'
      });
    }

    // Validate agency name if provided
    if (agencyName !== undefined && (!agencyName || !agencyName.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid agency name',
        message: 'Agency name cannot be empty'
      });
    }

    // Update agency
    await agency.update({
      agencyName: agencyName ? agencyName.trim() : agency.agencyName,
      description: description !== undefined ? (description?.trim() || null) : agency.description,
      website: website !== undefined ? website : agency.website,
      phone: phone !== undefined ? phone : agency.phone,
      address: address !== undefined ? address : agency.address,
      city: city !== undefined ? city : agency.city,
      country: country !== undefined ? country : agency.country,
      businessType: businessType !== undefined ? businessType : agency.businessType,
      taxId: taxId !== undefined ? taxId : agency.taxId,
      specializations: specializations !== undefined ? (Array.isArray(specializations) ? specializations : []) : agency.specializations,
      teamSize: teamSize !== undefined ? parseInt(teamSize) : agency.teamSize,
      yearsInBusiness: yearsInBusiness !== undefined ? parseInt(yearsInBusiness) : agency.yearsInBusiness
    });

    res.json({
      success: true,
      message: 'Agency profile updated successfully',
      agency
    });
  } catch (error) {
    console.error('Error updating agency profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update agency profile',
      message: 'An error occurred while updating your profile. Please try again later.'
    });
  }
});

// @desc    Get all agencies
// @route   GET /api/agencies
// @access  Public
const getAgencies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, specialization, location } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = { isActive: true };

  if (search) {
    whereClause[db.Sequelize.Op.or] = [
      { agencyName: { [db.Sequelize.Op.like]: `%${search}%` } },
      { description: { [db.Sequelize.Op.like]: `%${search}%` } }
    ];
  }

  if (specialization) {
    whereClause.specializations = {
      [db.Sequelize.Op.contains]: [specialization]
    };
  }

  if (location) {
    whereClause[db.Sequelize.Op.or] = [
      { city: { [db.Sequelize.Op.like]: `%${location}%` } },
      { country: { [db.Sequelize.Op.like]: `%${location}%` } }
    ];
  }

  const agencies = await db.Agency.findAndCountAll({
    where: whereClause,
    include: [{ model: db.User, as: 'user' }],
    limit: parseInt(limit),
    offset: offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    agencies: agencies.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(agencies.count / parseInt(limit)),
      totalAgencies: agencies.count,
      agenciesPerPage: parseInt(limit)
    }
  });
});

// @desc    Get agency details
// @route   GET /api/agencies/:agencyId
// @access  Public
const getAgencyDetails = asyncHandler(async (req, res) => {
  const { agencyId } = req.params;

  const agency = await db.Agency.findByPk(agencyId, {
    include: [
      { model: db.User, as: 'user' },
      { model: db.AgencyFreelancer, as: 'freelancers', include: [{ model: db.Freelancer, as: 'freelancer' }] }
    ]
  });

  if (!agency) {
    return res.status(404).json({ error: 'Agency not found' });
  }

  res.json({ agency });
});

// @desc    Add freelancer to agency
// @route   POST /api/agencies/:agencyId/freelancers
// @access  Private
const addFreelancerToAgency = asyncHandler(async (req, res) => {
  const { agencyId } = req.params;
  const { freelancerId, role, commissionRate } = req.body;
  const userId = req.userId;

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  // Check if freelancer exists
  const freelancer = await db.Freelancer.findByPk(freelancerId);
  if (!freelancer) {
    return res.status(404).json({ error: 'Freelancer not found' });
  }

  // Check if freelancer is already in agency
  const existingRelationship = await db.AgencyFreelancer.findOne({
    where: { agencyId, freelancerId }
  });

  if (existingRelationship) {
    return res.status(400).json({ error: 'Freelancer is already in this agency' });
  }

  // Create agency-freelancer relationship
  const agencyFreelancer = await db.AgencyFreelancer.create({
    agencyId,
    freelancerId,
    role,
    commissionRate,
    status: 'pending'
  });

  res.status(201).json({
    message: 'Freelancer added to agency successfully',
    relationship: agencyFreelancer
  });
});

// @desc    Get agency freelancers
// @route   GET /api/agencies/:agencyId/freelancers
// @access  Private
const getAgencyFreelancers = asyncHandler(async (req, res) => {
  const { agencyId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  const whereClause = { agencyId };
  if (status) {
    whereClause.status = status;
  }

  const relationships = await db.AgencyFreelancer.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.Freelancer, as: 'freelancer', include: [{ model: db.User, as: 'user' }] }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    freelancers: relationships.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(relationships.count / parseInt(limit)),
      totalFreelancers: relationships.count,
      freelancersPerPage: parseInt(limit)
    }
  });
});

// @desc    Update freelancer status in agency
// @route   PUT /api/agencies/:agencyId/freelancers/:freelancerId
// @access  Private
const updateFreelancerStatus = asyncHandler(async (req, res) => {
  const { agencyId, freelancerId } = req.params;
  const { status, role, commissionRate } = req.body;
  const userId = req.userId;

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  const relationship = await db.AgencyFreelancer.findOne({
    where: { agencyId, freelancerId }
  });

  if (!relationship) {
    return res.status(404).json({ error: 'Freelancer not found in agency' });
  }

  // Update relationship
  await relationship.update({
    status,
    role,
    commissionRate
  });

  res.json({
    message: 'Freelancer status updated successfully',
    relationship
  });
});

// @desc    Remove freelancer from agency
// @route   DELETE /api/agencies/:agencyId/freelancers/:freelancerId
// @access  Private
const removeFreelancerFromAgency = asyncHandler(async (req, res) => {
  const { agencyId, freelancerId } = req.params;
  const userId = req.userId;

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  const relationship = await db.AgencyFreelancer.findOne({
    where: { agencyId, freelancerId }
  });

  if (!relationship) {
    return res.status(404).json({ error: 'Freelancer not found in agency' });
  }

  // Remove relationship
  await relationship.destroy();

  res.json({ message: 'Freelancer removed from agency successfully' });
});

// @desc    Get agency jobs
// @route   GET /api/agencies/:agencyId/jobs
// @access  Private
const getAgencyJobs = asyncHandler(async (req, res) => {
  const { agencyId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  // Get freelancers in agency
  const freelancerRelationships = await db.AgencyFreelancer.findAll({
    where: { agencyId, status: 'active' }
  });

  const freelancerIds = freelancerRelationships.map(rel => rel.freelancerId);

  // Get job applications by agency freelancers
  const whereClause = {
    userId: { [db.Sequelize.Op.in]: freelancerIds }
  };

  if (status) {
    whereClause.status = status;
  }

  const applications = await db.JobApplication.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.JobPost, as: 'jobPost' },
      { model: db.User, as: 'applicant' }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['appliedAt', 'DESC']]
  });

  res.json({
    applications: applications.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(applications.count / parseInt(limit)),
      totalApplications: applications.count,
      applicationsPerPage: parseInt(limit)
    }
  });
});

// @desc    Get agency statistics
// @route   GET /api/agencies/:agencyId/statistics
// @access  Private
const getAgencyStatistics = asyncHandler(async (req, res) => {
  const { agencyId } = req.params;
  const userId = req.userId;

  // Check if user owns the agency
  const agency = await db.Agency.findOne({ where: { id: agencyId, userId } });
  if (!agency) {
    return res.status(404).json({ error: 'Agency not found or not authorized' });
  }

  // Get freelancers in agency
  const freelancerRelationships = await db.AgencyFreelancer.findAll({
    where: { agencyId, status: 'active' }
  });

  const freelancerIds = freelancerRelationships.map(rel => rel.freelancerId);

  // Get statistics
  const totalFreelancers = freelancerRelationships.length;
  const totalApplications = await db.JobApplication.count({
    where: { userId: { [db.Sequelize.Op.in]: freelancerIds } }
  });
  const acceptedApplications = await db.JobApplication.count({
    where: { 
      userId: { [db.Sequelize.Op.in]: freelancerIds },
      status: 'accepted'
    }
  });
  const totalContracts = await db.Contract.count({
    where: { freelancerId: { [db.Sequelize.Op.in]: freelancerIds } }
  });

  res.json({
    totalFreelancers,
    totalApplications,
    acceptedApplications,
    totalContracts,
    successRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(2) : 0
  });
});

// @desc    Search freelancers
// @route   GET /api/agencies/freelancers/search
// @access  Private (Agency)
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

  const { Op } = db.Sequelize;
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

  const { count, rows: freelancers } = await db.Freelancer.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: db.User,
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

  // Attach simple platform stats to each freelancer
  await Promise.all(
    freelancers.map(async (f) => {
      try {
        const fid = f.id;
        const [completedContracts, activeContracts, totalContracts] = await Promise.all([
          db.Contract.count({ where: { freelancerId: fid, contractStatus: 'completed' } }),
          db.Contract.count({ where: { freelancerId: fid, contractStatus: 'active' } }),
          db.Contract.count({ where: { freelancerId: fid } }),
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

// @desc    Get freelancer profile details
// @route   GET /api/agencies/freelancers/:id
// @access  Private (Agency)
const getFreelancerProfile = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const freelancer = await db.Freelancer.findByPk(id, {
    include: [
      {
        model: db.User,
        as: 'freelancerUser',
        attributes: [
          'id', 
          'email', 
          'firstName', 
          'lastName', 
          'profileImage', 
          'createdAt',
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
      error: 'Freelancer not found' 
    });
  }

  // Get freelancer stats
  const [completedContracts, activeContracts, totalContracts] = await Promise.all([
    db.Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'completed' } }),
    db.Contract.count({ where: { freelancerId: freelancer.id, contractStatus: 'active' } }),
    db.Contract.count({ where: { freelancerId: freelancer.id } }),
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

module.exports = {
  createAgencyProfile,
  getAgencyProfile,
  updateAgencyProfile,
  getAgencies,
  getAgencyDetails,
  addFreelancerToAgency,
  getAgencyFreelancers,
  updateFreelancerStatus,
  removeFreelancerFromAgency,
  getAgencyJobs,
  getAgencyStatistics,
  searchFreelancers,
  getFreelancerProfile,
};