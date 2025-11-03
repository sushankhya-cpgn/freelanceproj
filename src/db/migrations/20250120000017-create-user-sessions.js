'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('user_sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      sessionId: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      token: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add index for faster lookups
    await queryInterface.addIndex('user_sessions', ['userId']);
    await queryInterface.addIndex('user_sessions', ['sessionId']);
    await queryInterface.addIndex('user_sessions', ['isActive']);
    await queryInterface.addIndex('user_sessions', ['expiresAt']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('user_sessions');
  }
};

