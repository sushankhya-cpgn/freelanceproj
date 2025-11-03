'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add hourlyRate and availability to Users
    await queryInterface.addColumn('Users', 'hourlyRate', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
    });
    await queryInterface.addColumn('Users', 'availability', {
      type: Sequelize.STRING,
      allowNull: true,
    });

    // Add skills and portfolioItems to Users as JSON arrays
    await queryInterface.addColumn('Users', 'skills', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
    await queryInterface.addColumn('Users', 'portfolioItems', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'hourlyRate');
    await queryInterface.removeColumn('Users', 'availability');
    await queryInterface.removeColumn('Users', 'skills');
    await queryInterface.removeColumn('Users', 'portfolioItems');
  }
};
