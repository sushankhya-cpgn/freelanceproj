'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add rating columns to contracts table
    const contractsTable = await queryInterface.describeTable('contracts');
    
    if (!contractsTable.clientRating) {
      await queryInterface.addColumn('contracts', 'clientRating', {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true,
        comment: 'Rating given by client to freelancer (1.0 to 5.0)'
      });
    }
    
    if (!contractsTable.clientReview) {
      await queryInterface.addColumn('contracts', 'clientReview', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Review text given by client'
      });
    }
    
    if (!contractsTable.ratedAt) {
      await queryInterface.addColumn('contracts', 'ratedAt', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Timestamp when client submitted rating'
      });
    }
    
    // Add cached rating fields to users table for freelancers
    const usersTable = await queryInterface.describeTable('users');
    
    if (!usersTable.averageRating) {
      await queryInterface.addColumn('users', 'averageRating', {
        type: Sequelize.DECIMAL(2, 1),
        allowNull: true,
        defaultValue: 0.0,
        comment: 'Cached average rating for freelancers'
      });
    }
    
    if (!usersTable.totalRatings) {
      await queryInterface.addColumn('users', 'totalRatings', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of ratings received'
      });
    }
    
    if (!usersTable.totalReviews) {
      await queryInterface.addColumn('users', 'totalReviews', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Total number of reviews received'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove columns from contracts
    const contractsTable = await queryInterface.describeTable('contracts');
    if (contractsTable.clientRating) {
      await queryInterface.removeColumn('contracts', 'clientRating');
    }
    if (contractsTable.clientReview) {
      await queryInterface.removeColumn('contracts', 'clientReview');
    }
    if (contractsTable.ratedAt) {
      await queryInterface.removeColumn('contracts', 'ratedAt');
    }
    
    // Remove columns from users
    const usersTable = await queryInterface.describeTable('users');
    if (usersTable.averageRating) {
      await queryInterface.removeColumn('users', 'averageRating');
    }
    if (usersTable.totalRatings) {
      await queryInterface.removeColumn('users', 'totalRatings');
    }
    if (usersTable.totalReviews) {
      await queryInterface.removeColumn('users', 'totalReviews');
    }
  }
};
