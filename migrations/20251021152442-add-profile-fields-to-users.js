'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'country', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'bio', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'experiences', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('Users', 'paymentOptions', {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: []
    });

    await queryInterface.addColumn('Users', 'companyName', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'companyWebsite', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Users', 'country');
    await queryInterface.removeColumn('Users', 'bio');
    await queryInterface.removeColumn('Users', 'experiences');
    await queryInterface.removeColumn('Users', 'paymentOptions');
    await queryInterface.removeColumn('Users', 'companyName');
    await queryInterface.removeColumn('Users', 'companyWebsite');
  }
};