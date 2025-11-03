const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserSession = sequelize.define('UserSession', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    sessionId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    token: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'user_sessions',
    timestamps: true,
    indexes: [
      {
        fields: ['userId']
      },
      {
        fields: ['sessionId']
      },
      {
        fields: ['isActive']
      },
      {
        fields: ['expiresAt']
      }
    ]
  });

  UserSession.associate = (models) => {
    UserSession.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return UserSession;
};

