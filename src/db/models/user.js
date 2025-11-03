'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // User can be a freelancer
      this.hasOne(models.Freelancer, {
        foreignKey: 'userId',
        as: 'freelancerProfile'
      });
      
      // User can be an organization
      this.hasOne(models.Organization, {
        foreignKey: 'userId',
        as: 'organizationProfile'
      });
      
      // User can be an agency
      this.hasOne(models.Agency, {
        foreignKey: 'userId',
        as: 'agencyProfile'
      });
      
      // User can have multiple job applications
      this.hasMany(models.JobApplication, {
        foreignKey: 'userId',
        as: 'jobApplications'
      });
      
      // User can have multiple connects
      this.hasMany(models.Connect, {
        foreignKey: 'userId',
        as: 'connects'
      });
      
      // User can have multiple contracts
      this.hasMany(models.Contract, {
        foreignKey: 'clientId',
        as: 'clientContracts'
      });
      
      this.hasMany(models.Contract, {
        foreignKey: 'freelancerId',
        as: 'freelancerContracts'
      });
      
      // User can have multiple messages
      this.hasMany(models.Message, {
        foreignKey: 'senderId',
        as: 'sentMessages'
      });
      
      this.hasMany(models.Message, {
        foreignKey: 'receiverId',
        as: 'receivedMessages'
      });
    }

    // Instance method to check password
    async checkPassword(password) {
      return await bcrypt.compare(password, this.password);
    }

    // Instance method to hash password
    async hashPassword() {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  User.init({
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
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true // Can be null for OAuth users
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    profileImage: {
      type: DataTypes.STRING,
      allowNull: true
    },
    userType: {
      type: DataTypes.ENUM('freelancer', 'client', 'agency', 'admin'),
      allowNull: false
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // OTP fields
    emailVerificationOTP: {
      type: DataTypes.STRING,
      allowNull: true
    },
    emailVerificationOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    passwordResetOTP: {
      type: DataTypes.STRING,
      allowNull: true
    },
    passwordResetOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    loginOTP: {
      type: DataTypes.STRING,
      allowNull: true
    },
    loginOTPExpires: {
      type: DataTypes.DATE,
      allowNull: true
    },
    otpAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    otpLastAttempt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // OAuth fields
    googleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    facebookId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    linkedinId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    appleId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    },
    // Account status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Preferences
    timezone: {
      type: DataTypes.STRING,
      defaultValue: 'UTC'
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: 'en'
    },
    // Notification preferences
    emailNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    pushNotifications: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // Profile completion
    profileCompletionPercentage: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Stripe customer ID for payments
    stripeCustomerId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Connect balance
    connectBalance: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    // Enhanced profile fields
    country: {
      type: DataTypes.STRING,
      allowNull: true
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    experiences: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    paymentOptions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    companyName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    companyWebsite: {
      type: DataTypes.STRING,
      allowNull: true
    }
    ,
    // Extended profile fields
    hourlyRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    availability: {
      type: DataTypes.STRING,
      allowNull: true
    },
    skills: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    portfolioItems: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    // Rating system for freelancers
    averageRating: {
      type: DataTypes.DECIMAL(2, 1),
      allowNull: true,
      defaultValue: 0.0
    },
    totalRatings: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    totalReviews: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      }
    }
  });

  return User;
};