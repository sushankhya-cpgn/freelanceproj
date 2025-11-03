'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Message extends Model {
    static associate(models) {
      // Message belongs to a sender
      this.belongsTo(models.User, {
        foreignKey: 'senderId',
        as: 'sender'
      });
      
      // Message belongs to a receiver
      this.belongsTo(models.User, {
        foreignKey: 'receiverId',
        as: 'receiver'
      });
      
      // Message can belong to a job application
      this.belongsTo(models.JobApplication, {
        foreignKey: 'jobApplicationId',
        as: 'jobApplication'
      });
      
      // Message can belong to a contract
      this.belongsTo(models.Contract, {
        foreignKey: 'contractId',
        as: 'contract'
      });
    }
  }

  Message.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    uuid: {
      type: DataTypes.UUID,
      defaultValue: UUIDV4,
      allowNull: false,
      unique: true
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    jobApplicationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'job_applications',
        key: 'id'
      }
    },
    contractId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'contracts',
        key: 'id'
      }
    },
    // Message content
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    messageType: {
      type: DataTypes.ENUM('text', 'image', 'file', 'system', 'contract', 'video_call'),
      defaultValue: 'text'
    },
    // Attachments
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    // Message status
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Message metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    // Timestamps
    sentAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'Message',
    tableName: 'messages',
    indexes: [
      {
        fields: ['senderId', 'receiverId']
      },
      {
        fields: ['jobApplicationId']
      },
      {
        fields: ['contractId']
      },
      {
        fields: ['sentAt']
      }
    ]
  });

  return Message;
};