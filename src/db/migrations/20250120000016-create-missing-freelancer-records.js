'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🔧 Creating missing freelancer records for existing users...');

    // Find all users with userType 'freelancer' who don't have freelancer records
    const usersWithoutFreelancerRecords = await queryInterface.sequelize.query(`
      SELECT u.id, u.email, u.firstName, u.lastName, u.userType
      FROM users u
      LEFT JOIN freelancers f ON u.id = f.userId
      WHERE u.userType = 'freelancer' AND f.id IS NULL
    `, {
      type: Sequelize.QueryTypes.SELECT
    });

    console.log(`📊 Found ${usersWithoutFreelancerRecords.length} users without freelancer records`);

    if (usersWithoutFreelancerRecords.length === 0) {
      console.log('✅ All freelancer users already have freelancer records');
      return;
    }

    // Create freelancer records for these users
    const freelancerRecords = usersWithoutFreelancerRecords.map(user => ({
      uuid: uuidv4(),
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      shortBio: 'Freelancer profile created via migration',
      yearsOfExperience: '0-1 years',
      expertise: 'General',
      userType: 'it',
      visibility: 'public',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

  await queryInterface.bulkInsert('freelancers', freelancerRecords);

    console.log(`✅ Created ${freelancerRecords.length} freelancer records`);
  },

  async down(queryInterface, Sequelize) {
    console.log('🔄 Removing freelancer records created by migration...');

    // Remove freelancer records that were created by this migration
    await queryInterface.sequelize.query(`
      DELETE FROM freelancers 
      WHERE shortBio = 'Freelancer profile created via migration'
    `);

    console.log('✅ Removed migration-created freelancer records');
  }
};
