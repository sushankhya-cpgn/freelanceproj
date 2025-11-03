'use strict';
const {
  Model,
  DataTypes
} = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
  class Organization extends Model {
    static associate(models) {
      // Organization belongs to a user
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'organizationUser'
      });
      
      // Organization can have multiple job posts
      this.hasMany(models.JobPost, {
        foreignKey: 'organizationId',
        as: 'jobPosts'
      });
      
      // Organization can have multiple contracts
      this.hasMany(models.Contract, {
        foreignKey: 'organizationId',
        as: 'contracts'
      });
    }
  }

  Organization.init({
    uuid: {
      type: DataTypes.UUID,
      defaultValue: uuidv4,
      allowNull: false,
      unique: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    companyName: DataTypes.STRING,
    password: DataTypes.STRING,
    tradeName: DataTypes.STRING,
    GSTIN: DataTypes.STRING,
    yearOfIncorporation: DataTypes.STRING,
    relationshipToCompany: DataTypes.STRING,
    contactPersonPhoneNumber: DataTypes.STRING,
    contactPersonEmail: DataTypes.STRING,
    numberOfEmployees: DataTypes.INTEGER,
    typeOfCompany: DataTypes.STRING,
    companyDirectorEmail: DataTypes.STRING,
    companyDirectorPhoneNumber: DataTypes.STRING,
    industry: DataTypes.STRING,
    sector: DataTypes.STRING,
    companyWebsite: DataTypes.STRING,
    aboutCompany: DataTypes.STRING,
    annualTurnover: DataTypes.INTEGER,
    servicesToExplore: DataTypes.STRING,
    termsAndConditionsAgreement: DataTypes.BOOLEAN,
    futureHiringPlans: DataTypes.STRING,
    softwareUsed_sourcing: DataTypes.STRING,
    softwareUsed_accounting: DataTypes.STRING,
    softwareUsed_hiring: DataTypes.STRING,
    softwareUsed_employeeDataManagement: DataTypes.STRING,
    exploreAutomationSolutions: DataTypes.STRING,
    hasAccountingSoftware: DataTypes.BOOLEAN,
    hasHRManagementSoftware: DataTypes.BOOLEAN,
    hasCRMSoftware: DataTypes.BOOLEAN,
    email: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Organization',
    tableName: 'organizations',
  });

  return Organization;
};