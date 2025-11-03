'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create table if not exists
    const [tables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'conversations'");
    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      await queryInterface.createTable('conversations', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      participant1Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      participant2Id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      lastMessageId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'messages',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      lastMessageAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      unreadCount1: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Unread count for participant1'
      },
      unreadCount2: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Unread count for participant2'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
      });
    }

    // Helper to add index if not exists
    async function addIndexIfMissing(indexName, options) {
      const [rows] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM conversations WHERE Key_name = '${indexName}'`
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      if (!exists) {
        await queryInterface.addIndex('conversations', { ...options, name: indexName });
      }
    }

    // Add unique constraint to ensure only one conversation between two users
    await addIndexIfMissing('unique_conversation_participants', {
      fields: ['participant1Id', 'participant2Id'],
      unique: true,
    });

    // Add index for faster queries
    await addIndexIfMissing('idx_conversations_participant1', {
      fields: ['participant1Id'],
    });

    await addIndexIfMissing('idx_conversations_participant2', {
      fields: ['participant2Id'],
    });

    await addIndexIfMissing('idx_conversations_last_message', {
      fields: ['lastMessageAt'],
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('conversations');
  }
};
