const asyncHandler = require('express-async-handler');
const db = require('../db');
const { validationResult } = require('express-validator');
const { Novu } = require('@novu/node');
const novu = new Novu("a709df8448e3f85dc113d808f3d1c5a5");
// @desc    Apply for a job
// @route   POST /api/job-applications
// @access  Private
const applyForJob = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { jobPostId, coverLetter, proposedRate, proposedTimeline, additionalInfo, attachments } = req.body;
  const userId = req.userId;

  // Get user details to check user type
  const user = await db.User.findByPk(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Check if job post exists and is active
  const jobPost = await db.JobPost.findByPk(jobPostId, {
    include: [
      { model: db.User, as: 'client' },
      { model: db.Organization, as: 'organization' }
    ]
  });

  console.log(jobPost);

  if (!jobPost) {
    return res.status(404).json({ error: 'Job post not found' });
  }

  if (jobPost.status !== 'active') {
    return res.status(400).json({ error: 'Job post is not active' });
  }

  // CHECK HIRETYPE PREFERENCE
  // Validate if applicant type matches job's hireType preference
  const applicantType = user.userType; // 'freelancer', 'agency', or 'client'
  const jobHireType = jobPost.hireType || 'both'; // Default to 'both' if not set
  
  if (jobHireType === 'freelancer' && applicantType !== 'freelancer') {
    return res.status(403).json({ 
      success: false,
      error: 'Application not allowed',
      message: 'This job is only open to freelancers. As an agency, you cannot apply to freelancer-only jobs.'
    });
  }
  
  if (jobHireType === 'agency' && applicantType !== 'agency') {
    return res.status(403).json({ 
      success: false,
      error: 'Application not allowed',
      message: 'This job is only open to agencies. As a freelancer, you cannot apply to agency-only jobs.'
    });
  }
  
  // Note: Agencies should NOT be able to apply to other agency's posts
  if (applicantType === 'agency' && jobPost.client.userType === 'agency') {
    return res.status(403).json({ 
      success: false,
      error: 'Application not allowed',
      message: 'Agencies cannot apply to other agency job posts. You can only apply to client job postings.'
    });
  }

  // Check if application deadline has passed
  if (jobPost.applicationDeadline && new Date() > jobPost.applicationDeadline) {
    return res.status(400).json({ error: 'Application deadline has passed' });
  }

  // Check if user has already applied (exclude withdrawn applications)
  const existingApplication = await db.JobApplication.findOne({
    where: { 
      userId, 
      jobPostId,
      status: { [db.Sequelize.Op.ne]: 'withdrawn' }
    }
  });

  if (existingApplication) {
    return res.status(400).json({ error: 'You have already applied for this job' });
  }

  // Detect if there's a withdrawn application we can reuse to allow re-apply
  const withdrawnApplication = await db.JobApplication.findOne({
    where: { userId, jobPostId, status: 'withdrawn' }
  });

  // Check if user has enough connects
  if (jobPost.connectRequired > 0) {
    const user = await db.User.findByPk(userId);
    if (user.connectBalance < jobPost.connectRequired) {
      return res.status(400).json({ 
        error: 'Insufficient connects', 
        required: jobPost.connectRequired,
        available: user.connectBalance 
      });
    }
  }

  // Use transaction to ensure atomicity
  const transaction = await db.sequelize.transaction();
  
  try {
    let jobApplication;
    if (withdrawnApplication) {
      // Reuse withdrawn application and set back to pending with updated details
      if (jobPost.connectRequired > 0) {
        const user = await db.User.findByPk(userId, { transaction });
        if (user.connectBalance < jobPost.connectRequired) {
          return res.status(400).json({ 
            error: 'Insufficient connects', 
            required: jobPost.connectRequired,
            available: user.connectBalance 
          });
        }
        await user.update({ connectBalance: user.connectBalance - jobPost.connectRequired }, { transaction });
      }

      await withdrawnApplication.update({
        coverLetter,
        proposedRate,
        proposedTimeline,
        additionalInfo,
        attachments,
        status: 'pending',
        appliedAt: new Date(),
        reviewedAt: null,
        respondedAt: null,
      }, { transaction });
      jobApplication = withdrawnApplication;
    } else {
      // Create new job application
      jobApplication = await db.JobApplication.create({
        userId,
        jobPostId,
        coverLetter,
        proposedRate,
        proposedTimeline,
        additionalInfo,
        attachments,
        status: 'pending'
      }, { transaction });
    }

    // Deduct connects if required (only when creating new application; for reused withdrawn handled above)
    if (!withdrawnApplication && jobPost.connectRequired > 0) {
      const user = await db.User.findByPk(userId, { transaction });
      await user.update({ connectBalance: user.connectBalance - jobPost.connectRequired }, { transaction });
    }

    // Get application with relations
    const applicationWithDetails = await db.JobApplication.findByPk(jobApplication.id, {
      include: [
        { model: db.User, as: 'applicant' },
        { model: db.JobPost, as: 'jobPost' }
      ],
      transaction
    });

    try {
      const clientId = jobPost?.clientId.toString();
      console.log(clientId);
      const freelancerName = `${applicationWithDetails.applicant.firstName} ${applicationWithDetails.applicant.lastName}`;

// Get client (job owner)
const client = applicationWithDetails.jobPost.client;
const jobTitle = applicationWithDetails.jobPost.title;
      await novu.trigger('freelancer-app-notification', {
        to: {
          subscriberId:clientId,
        },
        payload: {
          clientName: jobPost.client.name,
          freelancerName: freelancerName,
          jobTitle: jobTitle,
          jobPostId: jobPost.id,
        },
      });
    } catch (notifyError) {
      console.error('Novu notification failed:', notifyError.message);
    }
    // Commit transaction
    await transaction.commit();

    // Notify applicant (confirmation)
    try {
      await novu.trigger('freelancer-app-notification', {
        to: { subscriberId: String(userId) },
        payload: {
          type: 'application_submitted',
          title: 'Application submitted',
          message: `You applied to "${jobPost.title}"`,
          jobPostId: jobPost.id,
          applicationId: jobApplication.id,
        },
      });
    } catch {}

    res.status(201).json({
      message: 'Job application submitted successfully',
      application: applicationWithDetails
    });
  } catch (error) {
    // Rollback transaction on error
    await transaction.rollback();
    throw error;
  }
});

// @desc    Get user's job applications
// @route   GET /api/job-applications/my-applications
// @access  Private
const getMyApplications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const whereClause = { userId };
  if (status) {
    whereClause.status = status;
  }

  const applications = await db.JobApplication.findAndCountAll({
    where: whereClause,
    include: [
      { 
        model: db.JobPost, 
        as: 'jobPost',
        include: [
          { model: db.User, as: 'client', attributes: ['id','firstName','lastName','email'] }
        ]
      },
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

// @desc    Get job applications for a job post
// @route   GET /api/job-applications/job/:jobPostId
// @access  Private
const getJobApplications = asyncHandler(async (req, res) => {
  const { jobPostId } = req.params;
  const { page = 1, limit = 10, status } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  // Check if user owns the job post
  const jobPost = await db.JobPost.findByPk(jobPostId);
  if (!jobPost) {
    return res.status(404).json({ error: 'Job post not found' });
  }

  if (jobPost.clientId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view these applications' });
  }

  const whereClause = { jobPostId };
  if (status) {
    whereClause.status = status;
  }

  const applications = await db.JobApplication.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.User, as: 'applicant' },
      { 
        model: db.JobPost, 
        as: 'jobPost',
        include: [
          { model: db.User, as: 'client', attributes: ['id','firstName','lastName','email'] }
        ]
      }
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

// @desc    Update application status
// @route   PUT /api/job-applications/:applicationId/status
// @access  Private
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status, clientFeedback, clientRating } = req.body;
  const userId = req.userId;

  const application = await db.JobApplication.findByPk(applicationId, {
    include: [{ model: db.JobPost, as: 'jobPost' }]
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Check if user owns the job post
  if (application.jobPost.clientId !== userId) {
    return res.status(403).json({ error: 'Not authorized to update this application' });
  }

  // Update application
  await application.update({
    status,
    clientFeedback,
    clientRating,
    reviewedAt: new Date(),
    respondedAt: new Date()
  });

  // Notify applicant about status change
  try {
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(application.userId) },
      payload: {
        type: 'application_status_update',
        title: 'Application status updated',
        message: `Your application for "${application.jobPost.title}" is now ${status}.`,
        applicationId: application.id,
        jobPostId: application.jobPostId,
      },
    });
  } catch {}

  res.json({
    message: 'Application status updated successfully',
    application
  });
});

// @desc    Withdraw application
// @route   PUT /api/job-applications/:applicationId/withdraw
// @access  Private
const withdrawApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.userId;

  const application = await db.JobApplication.findByPk(applicationId);

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  if (application.userId !== userId) {
    return res.status(403).json({ error: 'Not authorized to withdraw this application' });
  }

  // If a contract has already been created/accepted for this application, block withdraw
  const blockingContract = await db.Contract.findOne({
    where: {
      jobApplicationId: application.id,
      contractStatus: { [db.Sequelize.Op.in]: ['pending', 'active'] }
    }
  });

  if (blockingContract) {
    return res.status(400).json({ error: 'Cannot withdraw application after contract has been created' });
  }

  // Allow withdraw from any status except already withdrawn
  if (application.status === 'withdrawn') {
    return res.status(400).json({ error: 'Application already withdrawn' });
  }

  await application.update({
    status: 'withdrawn',
    respondedAt: new Date()
  });

  // Notify both applicant and client about withdrawal
  try {
    // Notify applicant (confirmation)
    await novu.trigger('freelancer-app-notification', {
      to: { subscriberId: String(application.userId) },
      payload: {
        type: 'application_withdrawn',
        title: 'Application withdrawn',
        message: 'You withdrew your application.',
        applicationId: application.id,
        jobPostId: application.jobPostId,
      },
    });
  } catch {}

  res.json({
    message: 'Application withdrawn successfully',
    application
  });
});

// @desc    Get application details
// @route   GET /api/job-applications/:applicationId
// @access  Private
const getApplicationDetails = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.userId;

  const application = await db.JobApplication.findByPk(applicationId, {
    include: [
      { model: db.User, as: 'applicant' },
      { 
        model: db.JobPost, 
        as: 'jobPost',
        include: [
          { model: db.User, as: 'client', attributes: ['id','firstName','lastName','email'] }
        ]
      }
    ]
  });

  if (!application) {
    return res.status(404).json({ error: 'Application not found' });
  }

  // Check if user is authorized to view this application
  if (application.userId !== userId && application.jobPost.clientId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view this application' });
  }

  res.json({ application });
});

// @desc    Get application statistics
// @route   GET /api/job-applications/statistics
// @access  Private
const getApplicationStatistics = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userType = req.userType;

  let statistics = {};

  if (userType === 'freelancer') {
    // Freelancer statistics
    const totalApplications = await db.JobApplication.count({ where: { userId } });
    const pendingApplications = await db.JobApplication.count({ 
      where: { userId, status: 'pending' } 
    });
    const acceptedApplications = await db.JobApplication.count({ 
      where: { userId, status: 'accepted' } 
    });
    const rejectedApplications = await db.JobApplication.count({ 
      where: { userId, status: 'rejected' } 
    });

    statistics = {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      rejectedApplications,
      acceptanceRate: totalApplications > 0 ? (acceptedApplications / totalApplications * 100).toFixed(2) : 0
    };
  } else if (userType === 'client') {
    // Client statistics
    const jobPosts = await db.JobPost.findAll({ where: { clientId: userId } });
    const jobPostIds = jobPosts.map(job => job.id);

    const totalApplications = await db.JobApplication.count({ 
      where: { jobPostId: { [db.Sequelize.Op.in]: jobPostIds } } 
    });
    const pendingApplications = await db.JobApplication.count({ 
      where: { jobPostId: { [db.Sequelize.Op.in]: jobPostIds }, status: 'pending' } 
    });
    const acceptedApplications = await db.JobApplication.count({ 
      where: { jobPostId: { [db.Sequelize.Op.in]: jobPostIds }, status: 'accepted' } 
    });

    statistics = {
      totalApplications,
      pendingApplications,
      acceptedApplications,
      totalJobPosts: jobPosts.length
    };
  }

  res.json({ statistics });
});

module.exports = {
  applyForJob,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationDetails,
  getApplicationStatistics,
};