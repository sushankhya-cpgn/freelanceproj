'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create default organization
    await queryInterface.bulkInsert('organizations', [{
      uuid: uuidv4(),
      companyName: 'WorkLab Default Organization',
      email: 'admin@worklab.com',
      createdAt: new Date(),
      updatedAt: new Date()
    }], {});

    // Create test users
    const users = [
      {
        uuid: uuidv4(),
        email: 'john@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        firstName: 'John',
        lastName: 'Doe',
        userType: 'freelancer',
        isEmailVerified: true,
        connectBalance: 50,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uuid: uuidv4(),
        email: 'jane@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        firstName: 'Jane',
        lastName: 'Smith',
        userType: 'client',
        isEmailVerified: true,
        connectBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uuid: uuidv4(),
        email: 'prajwal@example.com',
        password: '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password
        firstName: 'Prajwal',
        lastName: 'Gaire',
        userType: 'freelancer',
        isEmailVerified: true,
        connectBalance: 100,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

  await queryInterface.bulkInsert('users', users, {});

    // Get the inserted user IDs
    const insertedUsers = await queryInterface.sequelize.query(
      'SELECT id, email FROM users WHERE email IN (?, ?, ?)',
      {
        replacements: ['john@example.com', 'jane@example.com', 'prajwal@example.com'],
        type: Sequelize.QueryTypes.SELECT
      }
    );

    const userMap = {};
    insertedUsers.forEach(user => {
      userMap[user.email] = user.id;
    });

    // Create freelancer records
    const freelancers = [
      {
        uuid: uuidv4(),
        userId: userMap['john@example.com'],
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        shortBio: 'Experienced React developer with 5+ years of experience',
        yearsOfExperience: '5+ years',
        expertise: 'React, JavaScript, Node.js, TypeScript',
        userType: 'it',
        visibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        uuid: uuidv4(),
        userId: userMap['prajwal@example.com'],
        firstName: 'Prajwal',
        lastName: 'Gaire',
        email: 'prajwal@example.com',
        shortBio: 'Full-stack developer specializing in modern web technologies',
        yearsOfExperience: '3-5 years',
        expertise: 'React, Node.js, Python, AWS',
        userType: 'it',
        visibility: 'public',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

  await queryInterface.bulkInsert('freelancers', freelancers, {});

    // Create a sample job post
    const jobPosts = [
      {
        title: 'React Developer Needed',
        description: 'Looking for an experienced React developer to build a modern web application with TypeScript and modern UI components.',
        budgetType: 'fixed',
        minBudget: 5000,
        maxBudget: 10000,
        projectDuration: '2-4 weeks',
        experienceLevel: 'intermediate',
        skills: JSON.stringify(['React', 'TypeScript', 'CSS', 'JavaScript']),
        location: 'Remote',
        connectRequired: 2,
        status: 'active',
        isPublic: true,
        clientId: userMap['jane@example.com'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    await queryInterface.bulkInsert('job_posts', jobPosts, {});
  },

  async down(queryInterface, Sequelize) {
    // Remove all test data
    await queryInterface.bulkDelete('job_posts', null, {});
    await queryInterface.bulkDelete('freelancers', null, {});
    await queryInterface.bulkDelete('users', null, {});
    await queryInterface.bulkDelete('organizations', null, {});
  }
};
