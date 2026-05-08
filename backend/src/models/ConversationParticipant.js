const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ConversationParticipant = sequelize.define('ConversationParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  conversationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'conversations', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  // Son mesajı görüntüleme zamanı — unread count hesabı için
  lastReadAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Kullanıcı konuşmayı arşivleyebilir veya sessize alabilir
  isArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isMuted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  // Group chat admin rolü
  role: {
    type: DataTypes.ENUM('member', 'admin'),
    defaultValue: 'member',
  },
  // Kullanıcının konuşmadan ayrılma tarihi (soft leave)
  leftAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'conversation_participants',
  indexes: [
    { unique: true, fields: ['conversation_id', 'user_id'] },
    { fields: ['user_id'] },
    { fields: ['conversation_id'] },
  ],
});

module.exports = ConversationParticipant;
