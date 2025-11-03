'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobApplication extends Model {
    static associate(models) {
      // Job application belongs to a user (freelancer)
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'applicant'
      });
      
      // Job application belongs to a job post
      this.belongsTo(models.JobPost, {
        foreignKey: 'jobPostId',
        as: 'jobPost'
      });
      
      // Job application can have a contract
      this.hasOne(models.Contract, {
        foreignKey: 'jobApplicationId',
        as: 'contract'
      });
    }
  }

  JobApplication.init({
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    jobPostId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'job_posts',
        key: 'id'
      }
    },
    // Application details
    coverLetter: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    proposedRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    proposedTimeline: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Application status
    status: {
      type: DataTypes.ENUM('pending', 'reviewed', 'shortlisted', 'rejected', 'accepted', 'withdrawn'),
      defaultValue: 'pending'
    },
    // Additional information
    additionalInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    // Attachments
    attachments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    // Client response
    clientFeedback: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    clientRating: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 5
      }
    },
    // Timestamps
    appliedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'JobApplication',
    tableName: 'job_applications',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'jobPostId']
      }
    ]
  });

  return JobApplication;
};