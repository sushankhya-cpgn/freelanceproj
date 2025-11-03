'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AgencyFreelancer extends Model {
    static associate(models) {
      // AgencyFreelancer belongs to an agency
      this.belongsTo(models.Agency, {
        foreignKey: 'agencyId',
        as: 'agency'
      });
      
      // AgencyFreelancer belongs to a freelancer
      this.belongsTo(models.Freelancer, {
        foreignKey: 'freelancerId',
        as: 'freelancer'
      });
    }
  }

  AgencyFreelancer.init({
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
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'agencies',
        key: 'id'
      }
    },
    freelancerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'freelancers',
        key: 'id'
      }
    },
    // Relationship details
    role: {
      type: DataTypes.STRING,
      allowNull: true
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.ENUM('pending', 'active', 'inactive', 'terminated'),
      defaultValue: 'pending'
    },
    // Contract details
    contractStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contractEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Permissions
    canApplyJobs: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    canManageProjects: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    // Notes
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AgencyFreelancer',
    tableName: 'agency_freelancers',
    indexes: [
      {
        unique: true,
        fields: ['agencyId', 'freelancerId']
      }
    ]
  });

  return AgencyFreelancer;
};