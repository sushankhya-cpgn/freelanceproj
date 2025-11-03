'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('call_notes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      conversation_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'conversations',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      room_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Jitsi room name for this call session'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        defaultValue: '',
        comment: 'User notes taken during the video call'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Index for quick lookup by conversation and user
    await queryInterface.addIndex('call_notes', ['conversation_id', 'user_id'], {
      name: 'idx_call_notes_conversation_user'
    });

    // Index for lookup by room name
    await queryInterface.addIndex('call_notes', ['room_name'], {
      name: 'idx_call_notes_room'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('call_notes');
  }
};
