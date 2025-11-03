'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('job_posts');
    if (!table.hireType) {
      await queryInterface.addColumn('job_posts', 'hireType', {
        type: Sequelize.ENUM('freelancer', 'agency', 'both'),
        allowNull: false,
        defaultValue: 'both',
        // 'after' is MySQL-specific; safe to include, ignored elsewhere
        after: 'isUrgent'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const table = await queryInterface.describeTable('job_posts');
    if (table.hireType) {
      await queryInterface.removeColumn('job_posts', 'hireType');
    }
    // Note: Do not DROP TYPE for MySQL. The earlier migration handled Postgres enum cleanup.
  }
};
