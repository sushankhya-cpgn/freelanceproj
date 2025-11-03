'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE messages 
      MODIFY COLUMN messageType ENUM('text', 'image', 'file', 'system', 'contract', 'video_call') 
      DEFAULT 'text'
    `);
  },

  async down(queryInterface, Sequelize) {
    // Remove video_call from the enum
    await queryInterface.sequelize.query(`
      ALTER TABLE messages 
      MODIFY COLUMN messageType ENUM('text', 'image', 'file', 'system', 'contract') 
      DEFAULT 'text'
    `);
  }
};
