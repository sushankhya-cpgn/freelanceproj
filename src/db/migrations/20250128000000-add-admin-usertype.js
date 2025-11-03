'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Modify the userType ENUM to include 'admin'
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN userType ENUM('client', 'freelancer', 'agency', 'admin') NOT NULL
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original ENUM without 'admin'
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      MODIFY COLUMN userType ENUM('client', 'freelancer', 'agency') NOT NULL
    `);
  }
};
