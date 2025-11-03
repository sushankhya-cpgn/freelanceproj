'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('job_posts', 'hireType', {
      type: Sequelize.ENUM('freelancer', 'agency', 'both'),
      defaultValue: 'both',
      allowNull: false,
      after: 'isUrgent'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('job_posts', 'hireType');
    // Clean up the ENUM type
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_job_posts_hireType";');
  }
};
