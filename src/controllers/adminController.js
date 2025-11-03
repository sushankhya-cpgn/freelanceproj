const asyncHandler = require('express-async-handler');
const db = require('../db');

// GET /api/admin/metrics
exports.getMetrics = asyncHandler(async (req, res) => {
  const [totalUsers, totalClients, totalFreelancers, totalAgencies] = await Promise.all([
    db.User.count(),
    db.User.count({ where: { userType: 'client' } }),
    db.User.count({ where: { userType: 'freelancer' } }),
    db.User.count({ where: { userType: 'agency' } }),
  ]);

  const [totalJobs, openJobs, closedJobs] = await Promise.all([
    db.JobPost ? db.JobPost.count() : 0,
    db.JobPost ? db.JobPost.count({ where: { status: 'open' } }) : 0,
    db.JobPost ? db.JobPost.count({ where: { status: 'closed' } }) : 0,
  ]);

  const [totalApplications, pendingApplications, hiredApplications] = await Promise.all([
    db.JobApplication ? db.JobApplication.count() : 0,
    db.JobApplication ? db.JobApplication.count({ where: { status: 'pending' } }) : 0,
    db.JobApplication ? db.JobApplication.count({ where: { status: 'hired' } }) : 0,
  ]);

  const [totalContracts, activeContracts, completedContracts] = await Promise.all([
    db.Contract ? db.Contract.count() : 0,
    db.Contract ? db.Contract.count({ where: { status: 'active' } }) : 0,
    db.Contract ? db.Contract.count({ where: { status: 'completed' } }) : 0,
  ]);

  // Revenue stats (if Stripe/transactions exist)
  let totalRevenue = 0;
  if (db.Payment) {
    const result = await db.Payment.findOne({
      attributes: [[db.Sequelize.fn('SUM', db.Sequelize.col('amount')), 'sum']],
      raw: true
    });
    totalRevenue = Number(result?.sum || 0);
  }

  // Recent activity
  const recentUsers = await db.User.findAll({
    limit: 5,
    order: [['createdAt', 'DESC']],
    attributes: ['id', 'firstName', 'lastName', 'email', 'userType', 'createdAt']
  });

  res.json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        clients: totalClients,
        freelancers: totalFreelancers,
        agencies: totalAgencies,
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        closed: closedJobs,
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        hired: hiredApplications,
      },
      contracts: {
        total: totalContracts,
        active: activeContracts,
        completed: completedContracts,
      },
      revenue: {
        totalCents: totalRevenue,
      },
      recent: {
        users: recentUsers,
      },
    }
  });
});
