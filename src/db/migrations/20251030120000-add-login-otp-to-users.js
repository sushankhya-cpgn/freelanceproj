"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "loginOTP", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("users", "loginOTPExpires", {
      type: Sequelize.DATE,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("users", "loginOTP");
    await queryInterface.removeColumn("users", "loginOTPExpires");
  },
};
