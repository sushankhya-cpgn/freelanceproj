'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CallNote extends Model {
    static associate(models) {
      // CallNote belongs to a user
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      
      // CallNote belongs to a conversation
      this.belongsTo(models.Conversation, {
        foreignKey: 'conversationId',
        as: 'conversation'
      });
    }
  }

  CallNote.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'conversation_id'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id'
    },
    roomName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'room_name'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    }
  }, {
    sequelize,
    modelName: 'CallNote',
    tableName: 'call_notes',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CallNote;
};

