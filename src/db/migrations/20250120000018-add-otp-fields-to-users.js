'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'emailVerificationOTP', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'emailVerificationOTPExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'passwordResetOTP', {
      type: Sequelize.STRING,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'passwordResetOTPExpires', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'otpAttempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'otpLastAttempt', {
      type: Sequelize.DATE,
      allowNull: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('users', 'emailVerificationOTP');
    await queryInterface.removeColumn('users', 'emailVerificationOTPExpires');
    await queryInterface.removeColumn('users', 'passwordResetOTP');
    await queryInterface.removeColumn('users', 'passwordResetOTPExpires');
    await queryInterface.removeColumn('users', 'otpAttempts');
    await queryInterface.removeColumn('users', 'otpLastAttempt');
  }
};

