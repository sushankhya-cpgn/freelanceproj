'use strict';
const { Model, DataTypes } = require('sequelize');
const { UUIDV4 } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Connect extends Model {
    static associate(models) {
      // Connect belongs to a user
      this.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'connectUser'
      });
      
      // Connect usage is tracked via metadata, not direct foreign key
      // (Removed incorrect association)
    }
  }

  Connect.init({
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
    // Connect details
    type: {
      type: DataTypes.ENUM('purchased', 'earned', 'bonus', 'refund'),
      allowNull: false,
      defaultValue: 'purchased'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    // Payment details
    stripePaymentIntentId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stripeChargeId: {
      type: DataTypes.STRING,
      allowNull: true
    },
    // Status
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    // Usage tracking
    used: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    remaining: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // Expiry
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Metadata
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    }
  }, {
    sequelize,
    modelName: 'Connect',
    tableName: 'connects',
    hooks: {
      beforeCreate: (connect) => {
        if (!connect.remaining) {
          connect.remaining = connect.quantity;
        }
      }
    }
  });

  return Connect;
};