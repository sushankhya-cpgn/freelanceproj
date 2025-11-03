const { Model, DataTypes } = require('sequelize');
'use strict';
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Freelancer extends Model {
    static associate(models) {
      // Freelancer belongs to a user
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'freelancerUser'
      });
      
      // Job applications are linked via User.userId, not freelancerId
      // (Removed incorrect association)
      
      // Freelancer can have multiple contracts
      this.hasMany(models.Contract, {
        foreignKey: 'freelancerId',
        as: 'contracts'
      });
      
      // Freelancer can belong to multiple agencies
      this.hasMany(models.AgencyFreelancer, {
        foreignKey: 'freelancerId',
        as: 'agencyRelationships'
      });
    }
  }
  Freelancer.init({
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
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    profileImg: DataTypes.STRING,
    country: DataTypes.STRING,
    city: DataTypes.STRING,
    gender: DataTypes.STRING,
    email: DataTypes.STRING,
    dateOfBirth: DataTypes.STRING,
    password: DataTypes.STRING,
    yearsOfExperience: DataTypes.STRING,
    expertise: DataTypes.STRING,
    interestedProducts: DataTypes.STRING,
    freelancerInterest: DataTypes.STRING,
    remoteWorkSuccessKey: DataTypes.STRING,
    resume: DataTypes.STRING,
    shortBio: DataTypes.STRING,
    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userType: {
      type: DataTypes.ENUM('it', 'non-it'),
      allowNull: true,
      defaultValue: 'it'
    },
    localFreelance: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // New fields for dashboard
    visibility: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'public'
    },
    hours: {
      type: DataTypes.STRING,
      allowNull: true
    },
    category: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    languages: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    education: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    portfolio: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    certification: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    employmentHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    otherExperiences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    introVideo: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'Freelancer',
    tableName: 'freelancers',
  });
  return Freelancer;
};