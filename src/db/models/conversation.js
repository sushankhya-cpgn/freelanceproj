module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define('Conversation', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    participant1Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    participant2Id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    lastMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    lastMessageAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    unreadCount1: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    unreadCount2: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'conversations',
    timestamps: true
  });

  Conversation.associate = (models) => {
    // Participant 1
    Conversation.belongsTo(models.User, {
      foreignKey: 'participant1Id',
      as: 'participant1'
    });

    // Participant 2
    Conversation.belongsTo(models.User, {
      foreignKey: 'participant2Id',
      as: 'participant2'
    });

    // Last message
    Conversation.belongsTo(models.Message, {
      foreignKey: 'lastMessageId',
      as: 'lastMessage'
    });
  };

  /**
   * Get or create a conversation between two users
   * Ensures participant IDs are always stored in ascending order
   */
  Conversation.findOrCreateConversation = async function(user1Id, user2Id) {
    const [id1, id2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];
    
    const [conversation, created] = await this.findOrCreate({
      where: {
        participant1Id: id1,
        participant2Id: id2
      },
      defaults: {
        participant1Id: id1,
        participant2Id: id2
      }
    });

    return conversation;
  };

  /**
   * Update conversation with new message
   */
  Conversation.updateWithMessage = async function(user1Id, user2Id, messageId, currentUserId) {
    const conversation = await this.findOrCreateConversation(user1Id, user2Id);
    
    // Determine which participant is the other one (to increment their unread count)
    const isParticipant1 = conversation.participant1Id === currentUserId;
    const unreadField = isParticipant1 ? 'unreadCount2' : 'unreadCount1';
    
    await conversation.update({
      lastMessageId: messageId,
      lastMessageAt: new Date(),
      [unreadField]: sequelize.literal(`${unreadField} + 1`)
    });

    return conversation;
  };

  /**
   * Mark conversation as read for a user
   */
  Conversation.markAsRead = async function(user1Id, user2Id, currentUserId) {
    const conversation = await this.findOrCreateConversation(user1Id, user2Id);
    
    const isParticipant1 = conversation.participant1Id === currentUserId;
    const unreadField = isParticipant1 ? 'unreadCount1' : 'unreadCount2';
    
    await conversation.update({
      [unreadField]: 0
    });

    return conversation;
  };

  return Conversation;
};
