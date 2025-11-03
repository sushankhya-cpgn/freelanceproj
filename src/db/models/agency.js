'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Agency extends Model {
    static associate(models) {
      // Agency belongs to a user
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'agencyUser'
      });
      
      // Agency can have multiple freelancers
      this.hasMany(models.AgencyFreelancer, {
        foreignKey: 'agencyId',
        as: 'freelancers'
      });
      
      // Job applications are linked via User.userId, not agencyId
      // (Removed incorrect association)
      
      // Agency can have multiple contracts
      this.hasMany(models.Contract, {
        foreignKey: 'agencyId',
        as: 'contracts'
      });
    }
  }

  Agency.init({
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
        model: 'Users',
        key: 'id'
      }
    },
    // Agency details
    agencyName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    website: {
      type: DataTypes.STRING,
      allowNull: true
    },
    logo: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Contact information
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    city: {
      type: DataTypes.STRING,
      allowNull: true
    },
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Business details
    businessType: {
      type: DataTypes.ENUM('sole_proprietorship', 'partnership', 'corporation', 'llc', 'other'),
      allowNull: true
    },
    taxId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Agency capabilities
    specializations: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    teamSize: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    yearsInBusiness: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // Verification status
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    verificationDocuments: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    // Agency settings
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Statistics
    totalProjects: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    successRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0
    },
    averageRating: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'Agency',
    tableName: 'agencies'
  });

  return Agency;
};