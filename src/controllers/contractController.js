const asyncHandler = require('express-async-handler');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { validationResult } = require('express-validator');
const CentrifugoService = require('../services/centrifugoService');

// @desc    Create contract
// @route   POST /api/contracts
// @access  Private
const createContract = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    freelancerId,
    jobApplicationId,
    workTitle,
    workDescription,
    deliverables,
    milestones,
    totalAmount,
    hourlyRate,
    paymentSchedule,
    contractStartDate,
    contractEndDate,
    terms // Add terms field
  } = req.body;

  const clientId = req.userId;

  // If freelancerId is actually a userId, find the freelancer record
  let actualFreelancerId = freelancerId;
  let freelancerUserId = freelancerId; // Default to the provided ID
  
  // First try to find as freelancer ID
  let freelancer = await db.Freelancer.findByPk(freelancerId, {
    include: [{ model: db.User, as: 'freelancerUser' }]
  });

  // If not found, try to find by userId
  if (!freelancer) {
    freelancer = await db.Freelancer.findOne({
      where: { userId: freelancerId },
      include: [{ model: db.User, as: 'freelancerUser' }]
    });
    
    if (freelancer) {
      actualFreelancerId = freelancer.id;
      freelancerUserId = freelancer.userId;
      console.log(`📝 Found freelancer by userId. Freelancer ID: ${actualFreelancerId}, User ID: ${freelancerUserId}`);
    }
  } else {
    // If found by freelancer ID, get the userId
    freelancerUserId = freelancer.userId;
    console.log(`📝 Found freelancer by ID. Freelancer ID: ${actualFreelancerId}, User ID: ${freelancerUserId}`);
  }

  if (!freelancer) {
    return res.status(404).json({ error: 'Freelancer not found' });
  }

  // Check if job application exists (if provided)
  if (jobApplicationId) {
    const jobApplication = await db.JobApplication.findByPk(jobApplicationId);
    if (!jobApplication) {
      return res.status(404).json({ error: 'Job application not found' });
    }
  }

  // Create contract
  const contract = await db.Contract.create({
    clientId,
    freelancerId: actualFreelancerId, // Use the actual freelancer ID
    jobApplicationId,
    workTitle,
    workDescription,
    deliverables,
    milestones,
    totalAmount,
    hourlyRate,
    paymentSchedule,
    contractStartDate,
    contractEndDate,
    contractTerms: terms, // Map terms to contractTerms
    contractStatus: 'draft',
    status: 'active',
    // Required fields with default values
    name: workTitle || 'Contract', // Use workTitle as name
    organizationId: 1 // Default organization ID (we'll create one if needed)
  });

  // Get contract with relations
  const contractWithDetails = await db.Contract.findByPk(contract.id, {
    include: [
      { model: db.User, as: 'client' },
      { model: db.Freelancer, as: 'freelancer', include: [{ model: db.User, as: 'freelancerUser' }] },
      { model: db.JobApplication, as: 'jobApplication' }
    ]
  });

  // 📨 Send contract as a message in chat
  try {
    const contractMessage = await db.Message.create({
      senderId: clientId,
      receiverId: freelancerUserId,
      content: JSON.stringify({
        type: 'contract',
        contractId: contractWithDetails.id,
        workTitle: contractWithDetails.workTitle,
        totalAmount: contractWithDetails.totalAmount,
        contractStartDate: contractWithDetails.contractStartDate,
        contractEndDate: contractWithDetails.contractEndDate,
        contractStatus: contractWithDetails.contractStatus,
        message: `Contract sent: ${contractWithDetails.workTitle}`
      }),
      messageType: 'contract',
      contractId: contractWithDetails.id,
      sentAt: new Date()
    });

    // Update conversation
    await db.Conversation.updateWithMessage(clientId, freelancerUserId, contractMessage.id, clientId);

    // Broadcast contract message to conversation channel
    const conversationChannel = CentrifugoService.getConversationChannel(clientId, freelancerUserId);
    await CentrifugoService.publishMessage(conversationChannel, {
      id: contractMessage.id,
      senderId: clientId,
      receiverId: freelancerUserId,
      content: contractMessage.content,
      messageType: 'contract',
      contractId: contractWithDetails.id,
      sentAt: contractMessage.sentAt,
      sender: {
        id: contractWithDetails.client.id,
        firstName: contractWithDetails.client.firstName,
        lastName: contractWithDetails.client.lastName
      }
    });

    console.log(`📨 Contract message sent to conversation:${clientId}:${freelancerUserId}`);
  } catch (error) {
    console.error('❌ Error sending contract message:', error);
  }

  // �🚀 Send notification to freelancer about new contract
  try {
    const userChannel = CentrifugoService.getUserChannel(freelancerUserId);
    
    await CentrifugoService.publishMessage(userChannel, {
      type: 'contract_notification',
      data: {
        id: contractWithDetails.id,
        title: 'New Contract Received',
        message: `You have received a new contract from ${contractWithDetails.client.firstName} ${contractWithDetails.client.lastName}`,
        contract: {
          id: contractWithDetails.id,
          workTitle: contractWithDetails.workTitle,
          totalAmount: contractWithDetails.totalAmount,
          contractStatus: contractWithDetails.contractStatus,
          client: {
            id: contractWithDetails.client.id,
            firstName: contractWithDetails.client.firstName,
            lastName: contractWithDetails.client.lastName
          }
        },
        timestamp: new Date(),
        action: {
          type: 'view_contract',
          url: `/contracts/${contractWithDetails.id}`
        }
      }
    });
    
    console.log(`📋 Contract notification sent to freelancer ${freelancerUserId}`);
  } catch (error) {
    console.error('❌ Error sending contract notification:', error);
    // Don't fail the request if notification fails
  }

  res.status(201).json({
    message: 'Contract created successfully',
    contract: contractWithDetails
  });
});

// @desc    Get user's contracts
// @route   GET /api/contracts
// @access  Private
const getContracts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, role, jobApplicationId } = req.query;
  const userId = req.userId;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let whereClause = {};
  
  // If filtering by job application ID
  if (jobApplicationId) {
    whereClause.jobApplicationId = parseInt(jobApplicationId);
  }
  
  if (role === 'client') {
    whereClause.clientId = userId;
  } else if (role === 'freelancer') {
    // For freelancers, we need to find contracts where the freelancer's userId matches
    // First, find the freelancer record for this user
    let freelancer = await db.Freelancer.findOne({
      where: { userId: userId }
    });
    
    if (freelancer) {
      whereClause.freelancerId = freelancer.id;
    } else {
      // If no freelancer record exists, return empty results
      whereClause.freelancerId = -1;
    }
  } else {
    // For both roles, check both client and freelancer associations
    let freelancer = await db.Freelancer.findOne({
      where: { userId: userId }
    });
    
    
    whereClause = {
      [db.Sequelize.Op.or]: [
        { clientId: userId },
        freelancer ? { freelancerId: freelancer.id } : { freelancerId: -1 }
      ]
    };
  }

  if (status) {
    whereClause.contractStatus = status;
  }

  const contracts = await db.Contract.findAndCountAll({
    where: whereClause,
    include: [
      { model: db.User, as: 'client' },
      { model: db.Freelancer, as: 'freelancer', include: [{ model: db.User, as: 'freelancerUser' }] },
      { model: db.JobApplication, as: 'jobApplication' }
    ],
    limit: parseInt(limit),
    offset: offset,
    order: [['createdAt', 'DESC']]
  });

  res.json({
    contracts: contracts.rows,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(contracts.count / parseInt(limit)),
      totalContracts: contracts.count,
      contractsPerPage: parseInt(limit)
    }
  });
});

// @desc    Get contract details
// @route   GET /api/contracts/:contractId
// @access  Private
const getContractDetails = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId, {
    include: [
      { model: db.User, as: 'client' },
      { model: db.Freelancer, as: 'freelancer', include: [{ model: db.User, as: 'freelancerUser' }] },
      { model: db.JobApplication, as: 'jobApplication' },
      { model: db.Message, as: 'messages' }
    ]
  });

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is authorized to view this contract
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to view this contract' });
  }

  res.json({ contract });
});

// @desc    Accept contract
// @route   PUT /api/contracts/:contractId/accept
// @access  Private
const acceptContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the freelancer
  // First check if freelancerId matches userId directly (in case freelancerId is actually userId)
  if (contract.freelancerId !== userId) {
    // If not, check if the freelancer record belongs to this user
    const freelancer = await db.Freelancer.findByPk(contract.freelancerId);
    if (!freelancer || freelancer.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to accept this contract' });
    }
  }

  if (contract.contractStatus !== 'pending' && contract.contractStatus !== 'draft') {
    return res.status(400).json({ error: 'Contract cannot be accepted in current status' });
  }

  // Update contract status and set start date when freelancer accepts
  const currentDate = new Date();
  await contract.update({
    contractStatus: 'active',
    signedAt: currentDate,
    // Set the actual start date to current date when contract is accepted
    contractStartDate: currentDate
  });

  // If this contract is linked to a job application, update its status
  if (contract.jobApplicationId) {
    try {
      await db.JobApplication.update(
        { status: 'accepted' },
        { where: { id: contract.jobApplicationId } }
      );
      console.log(`✅ Updated job application ${contract.jobApplicationId} status to 'accepted'`);
    } catch (error) {
      console.error('❌ Error updating job application status:', error);
      // Don't fail the contract acceptance if job application update fails
    }
  }

  // 🚀 Broadcast contract acceptance to both parties via Centrifugo
  try {
    // Get client and freelancer user IDs
    const clientId = contract.clientId;
    let freelancerUserId = userId; // The user who accepted (current user)
    
    // Send system message to conversation channel
    const conversationChannel = CentrifugoService.getConversationChannel(clientId, freelancerUserId);
    await CentrifugoService.publishMessage(conversationChannel, {
      type: 'system',
      messageType: 'contract_status',
      content: '✅ Contract has been accepted! Work has started.',
      contractId: contract.id,
      contractStatus: 'active',
      sentAt: currentDate
    });
    console.log(`✅ Broadcasted contract acceptance to conversation ${conversationChannel}`);

    // Send notification to client
    const clientChannel = CentrifugoService.getUserChannel(clientId.toString());
    await CentrifugoService.publishMessage(clientChannel, {
      type: 'contract_notification',
      data: {
        title: 'Contract Accepted',
        message: 'The freelancer has accepted your contract!',
        contractId: contract.id,
        contractStatus: 'active'
      }
    });
    console.log(`✅ Sent notification to client ${clientId}`);
  } catch (error) {
    console.error('❌ Error broadcasting contract acceptance:', error);
    // Don't fail the request if broadcasting fails
  }

  res.json({
    message: 'Contract accepted successfully. Work has started!',
    contract
  });
});

// @desc    Decline contract
// @route   PUT /api/contracts/:contractId/decline
// @access  Private
const declineContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the freelancer
  if (contract.freelancerId !== userId) {
    const freelancer = await db.Freelancer.findByPk(contract.freelancerId);
    if (!freelancer || freelancer.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to decline this contract' });
    }
  }

  if (contract.contractStatus !== 'pending' && contract.contractStatus !== 'draft') {
    return res.status(400).json({ error: 'Contract cannot be declined in current status' });
  }

  // Update contract status to declined
  await contract.update({
    contractStatus: 'declined'
  });

  // If this contract is linked to a job application, update its status
  if (contract.jobApplicationId) {
    try {
      await db.JobApplication.update(
        { status: 'rejected' },
        { where: { id: contract.jobApplicationId } }
      );
      console.log(`✅ Updated job application ${contract.jobApplicationId} status to 'rejected'`);
    } catch (error) {
      console.error('❌ Error updating job application status:', error);
    }
  }

  // 🚀 Broadcast contract decline to both parties via Centrifugo
  try {
    // Get client and freelancer user IDs
    const clientId = contract.clientId;
    let freelancerUserId = userId; // The user who declined (current user)
    
    // Send system message to conversation channel
    const conversationChannel = CentrifugoService.getConversationChannel(clientId, freelancerUserId);
    await CentrifugoService.publishMessage(conversationChannel, {
      type: 'system',
      messageType: 'contract_status',
      content: '❌ Contract has been declined.',
      contractId: contract.id,
      contractStatus: 'declined',
      sentAt: new Date()
    });
    console.log(`✅ Broadcasted contract decline to conversation ${conversationChannel}`);

    // Send notification to client
    const clientChannel = CentrifugoService.getUserChannel(clientId.toString());
    await CentrifugoService.publishMessage(clientChannel, {
      type: 'contract_notification',
      data: {
        title: 'Contract Declined',
        message: 'The freelancer has declined your contract.',
        contractId: contract.id,
        contractStatus: 'declined'
      }
    });
    console.log(`✅ Sent notification to client ${clientId}`);
  } catch (error) {
    console.error('❌ Error broadcasting contract decline:', error);
    // Don't fail the request if broadcasting fails
  }

  res.json({
    message: 'Contract declined',
    contract
  });
});

// @desc    Request payment
// @route   POST /api/contracts/:contractId/request-payment
// @access  Private
const requestPayment = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { amount, description, workCompleted } = req.body;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the freelancer
  if (contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to request payment for this contract' });
  }

  if (contract.contractStatus !== 'active') {
    return res.status(400).json({ error: 'Contract must be active to request payment' });
  }

  // Create payment request
  const paymentRequest = await db.PaymentRequest.create({
    contractId,
    freelancerId: userId,
    amount,
    description,
    workCompleted,
    status: 'pending'
  });

  res.json({
    message: 'Payment request submitted successfully',
    paymentRequest
  });
});

// @desc    Release payment
// @route   POST /api/contracts/:contractId/release-payment
// @access  Private
const releasePayment = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { amount, paymentMethodId } = req.body;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId, {
    include: [
      { model: db.Freelancer, as: 'freelancer', include: [{ model: db.User, as: 'freelancerUser' }] }
    ]
  });

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the client
  if (contract.clientId !== userId) {
    return res.status(403).json({ error: 'Not authorized to release payment for this contract' });
  }

  if (contract.contractStatus !== 'active') {
    return res.status(400).json({ error: 'Contract must be active to release payment' });
  }

  try {
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.CLIENT_URL}/contracts/${contractId}/payment-success`,
      metadata: {
        contractId: contractId.toString(),
        freelancerId: contract.freelancerId.toString(),
        type: 'contract_payment'
      }
    });

    if (paymentIntent.status === 'succeeded') {
      // Update contract
      await contract.update({
        paymentReleased: true,
        paymentReleaseDate: new Date(),
        stripePaymentIntentId: paymentIntent.id
      });

      res.json({
        message: 'Payment released successfully',
        paymentIntentId: paymentIntent.id
      });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }
  } catch (error) {
    console.error('Stripe error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

// @desc    Mark work as completed
// @route   PUT /api/contracts/:contractId/complete-work
// @access  Private
const completeWork = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { completionNotes } = req.body;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the freelancer
  if (contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to complete work for this contract' });
  }

  if (contract.contractStatus !== 'active') {
    return res.status(400).json({ error: 'Contract must be active to complete work' });
  }

  // Update contract
  await contract.update({
    workCompleted: true,
    completionDate: new Date(),
    contractStatus: 'completed'
  });

  res.json({
    message: 'Work marked as completed successfully',
    contract
  });
});

// @desc    Dispute contract
// @route   POST /api/contracts/:contractId/dispute
// @access  Private
const disputeContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { disputeReason } = req.body;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is authorized to dispute this contract
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to dispute this contract' });
  }

  if (contract.contractStatus === 'disputed') {
    return res.status(400).json({ error: 'Contract is already in dispute' });
  }

  // Update contract
  await contract.update({
    contractStatus: 'disputed',
    disputeReason
  });

  res.json({
    message: 'Contract dispute submitted successfully',
    contract
  });
});

// @desc    Resolve dispute
// @route   PUT /api/contracts/:contractId/resolve-dispute
// @access  Private
const resolveDispute = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const { disputeResolution, newStatus } = req.body;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is authorized to resolve this dispute
  if (contract.clientId !== userId && contract.freelancerId !== userId) {
    return res.status(403).json({ error: 'Not authorized to resolve this dispute' });
  }

  if (contract.contractStatus !== 'disputed') {
    return res.status(400).json({ error: 'Contract is not in dispute' });
  }

  // Update contract
  await contract.update({
    contractStatus: newStatus,
    disputeResolution
  });

  res.json({
    message: 'Dispute resolved successfully',
    contract
  });
});

// @desc    Get contract statistics
// @route   GET /api/contracts/statistics
// @access  Private
const getContractStatistics = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userType = req.userType;

  let statistics = {};

  if (userType === 'freelancer') {
    const totalContracts = await db.Contract.count({ where: { freelancerId: userId } });
    const activeContracts = await db.Contract.count({ 
      where: { freelancerId: userId, contractStatus: 'active' } 
    });
    const completedContracts = await db.Contract.count({ 
      where: { freelancerId: userId, contractStatus: 'completed' } 
    });
    const totalEarnings = await db.Contract.sum('totalAmount', {
      where: { freelancerId: userId, paymentReleased: true }
    }) || 0;

    statistics = {
      totalContracts,
      activeContracts,
      completedContracts,
      totalEarnings
    };
  } else if (userType === 'client') {
    const totalContracts = await db.Contract.count({ where: { clientId: userId } });
    const activeContracts = await db.Contract.count({ 
      where: { clientId: userId, contractStatus: 'active' } 
    });
    const completedContracts = await db.Contract.count({ 
      where: { clientId: userId, contractStatus: 'completed' } 
    });
    const totalSpent = await db.Contract.sum('totalAmount', {
      where: { clientId: userId, paymentReleased: true }
    }) || 0;

    statistics = {
      totalContracts,
      activeContracts,
      completedContracts,
      totalSpent
    };
  }

  res.json({ statistics });
});

// @desc    Delete contract
// @route   DELETE /api/contracts/:contractId
// @access  Private
const deleteContract = asyncHandler(async (req, res) => {
  const { contractId } = req.params;
  const userId = req.userId;

  const contract = await db.Contract.findByPk(contractId);

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Check if user is the client who created the contract
  if (contract.clientId !== userId) {
    return res.status(403).json({ error: 'You do not have permission to delete this contract' });
  }

  // Only allow deletion of draft or pending contracts
  if (contract.contractStatus !== 'draft' && contract.contractStatus !== 'pending') {
    return res.status(400).json({ 
      error: 'Only draft or pending contracts can be deleted. Active contracts must be cancelled instead.' 
    });
  }

  await contract.destroy();

  res.json({ 
    message: 'Contract deleted successfully',
    deletedContractId: contractId 
  });
});

// @desc    Rate freelancer on completed contract
// @route   POST /api/contracts/:id/rate
// @access  Private (Client only)
const rateFreelancer = asyncHandler(async (req, res) => {
  const { id: contractId } = req.params;
  const { rating, review } = req.body;
  const clientId = req.userId;

  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ 
      error: 'Rating must be between 1 and 5' 
    });
  }

  // Find contract
  const contract = await db.Contract.findByPk(contractId, {
    include: [
      { 
        model: db.Freelancer, 
        as: 'freelancer',
        include: [{ model: db.User, as: 'freelancerUser' }]
      }
    ]
  });

  if (!contract) {
    return res.status(404).json({ error: 'Contract not found' });
  }

  // Verify client owns the contract
  if (contract.clientId !== clientId) {
    return res.status(403).json({ 
      error: 'Only the client who created the contract can rate it' 
    });
  }

  // Verify contract is completed
  if (contract.contractStatus !== 'completed') {
    return res.status(400).json({ 
      error: 'Can only rate completed contracts' 
    });
  }

  // Verify not already rated
  if (contract.clientRating) {
    return res.status(400).json({ 
      error: 'You have already rated this contract' 
    });
  }

  // Update contract with rating
  await contract.update({
    clientRating: rating,
    clientReview: review || null,
    ratedAt: new Date()
  });

  // Get freelancer's user ID
  const freelancerUserId = contract.freelancer.userId;

  // Update freelancer's cached rating statistics
  const ratedContracts = await db.Contract.findAll({
    where: {
      freelancerId: contract.freelancerId,
      clientRating: { [db.Sequelize.Op.ne]: null }
    },
    attributes: ['clientRating']
  });

  const totalRatings = ratedContracts.length;
  const sumRatings = ratedContracts.reduce((sum, c) => sum + parseFloat(c.clientRating), 0);
  const averageRating = totalRatings > 0 ? (sumRatings / totalRatings).toFixed(1) : 0;

  // Count reviews (ratings with review text)
  const totalReviews = ratedContracts.filter(c => contract.clientReview).length;

  // Update user's rating cache
  await db.User.update(
    {
      averageRating,
      totalRatings,
      totalReviews
    },
    {
      where: { id: freelancerUserId }
    }
  );

  // Get updated contract
  const updatedContract = await db.Contract.findByPk(contractId, {
    include: [
      { model: db.User, as: 'client' },
      { 
        model: db.Freelancer, 
        as: 'freelancer',
        include: [{ model: db.User, as: 'freelancerUser' }]
      }
    ]
  });

  res.json({
    success: true,
    message: 'Rating submitted successfully',
    contract: updatedContract,
    updatedRating: {
      averageRating,
      totalRatings,
      totalReviews
    }
  });
});

module.exports = {
  createContract,
  getContracts,
  getContractDetails,
  acceptContract,
  declineContract,
  deleteContract,
  requestPayment,
  releasePayment,
  completeWork,
  disputeContract,
  resolveDispute,
  getContractStatistics,
  rateFreelancer,
};