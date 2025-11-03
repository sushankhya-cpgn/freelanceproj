'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class JobPost extends Model {
    static associate(models) {
      // Job post belongs to a client (User)
      this.belongsTo(models.User, {
        foreignKey: 'clientId',
        as: 'client'
      });
      
      // Job post belongs to an organization
      this.belongsTo(models.Organization, {
        foreignKey: 'organizationId',
        as: 'organization'
      });
      
      // Job post can have multiple applications
      this.hasMany(models.JobApplication, {
        foreignKey: 'jobPostId',
        as: 'applications'
      });
      
      // Contracts are linked via job applications, not directly to job posts
      // (Removed incorrect association)
    }
  }
  JobPost.init({
    company_type: DataTypes.STRING,
    monthly_amount: DataTypes.DECIMAL,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    responsibilities: DataTypes.TEXT,
    requirements: DataTypes.TEXT,
    location: DataTypes.STRING,
    salary: DataTypes.DECIMAL,
    posted_date: DataTypes.DATE,
    last_date_to_apply: DataTypes.DATE,
    job_type: DataTypes.STRING,
    job_location: DataTypes.STRING,
    job_start_date: DataTypes.DATE,
    language: DataTypes.STRING,
    gender: DataTypes.STRING,
    contract_status: DataTypes.STRING,
    candidate_experience: DataTypes.STRING,
    candidate_age: DataTypes.STRING,
    work_type: DataTypes.STRING,
    organizationId: DataTypes.INTEGER,
    clientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    
    apply_status: DataTypes.STRING,   // Status of job application
    is_confirmed: DataTypes.BOOLEAN,  // Confirmation status
    
    // Enhanced job post fields
    budget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    budgetType: {
      type: DataTypes.ENUM('fixed', 'hourly', 'range'),
      allowNull: true
    },
    minBudget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    maxBudget: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    experienceLevel: {
      type: DataTypes.ENUM('entry', 'intermediate', 'expert'),
      allowNull: true
    },
    projectDuration: {
      type: DataTypes.STRING,
      allowNull: true
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Job status
    status: {
      type: DataTypes.ENUM('draft', 'active', 'paused', 'closed', 'completed'),
      defaultValue: 'draft'
    },
    // Application settings
    maxApplications: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    applicationDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Visibility
    isPublic: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Connect requirements
    connectRequired: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Featured job
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Urgent job
    isUrgent: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Hire type - who can apply (freelancer, agency, or both)
    hireType: {
      type: DataTypes.ENUM('freelancer', 'agency', 'both'),
      defaultValue: 'both',
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'JobPost',
    tableName: 'job_posts'
  });
  return JobPost;
};