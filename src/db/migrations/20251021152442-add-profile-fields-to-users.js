'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'experiences', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('users', 'paymentOptions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('users', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'companyWebsite', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'country');
    await queryInterface.removeColumn('users', 'bio');
    await queryInterface.removeColumn('users', 'experiences');
    await queryInterface.removeColumn('users', 'paymentOptions');
    await queryInterface.removeColumn('users', 'companyName');
    await queryInterface.removeColumn('users', 'companyWebsite');
  }
};