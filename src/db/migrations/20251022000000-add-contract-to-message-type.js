'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check the current ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE messages 
      MODIFY COLUMN messageType ENUM('text', 'image', 'file', 'system', 'contract') 
      DEFAULT 'text'
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert back to original ENUM values
    await queryInterface.sequelize.query(`
      ALTER TABLE messages 
      MODIFY COLUMN messageType ENUM('text', 'image', 'file', 'system') 
      DEFAULT 'text'
    `);
  }
};
