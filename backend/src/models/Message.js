const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
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
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  // Mesaj türü
  type: {
    type: DataTypes.ENUM('text', 'file', 'image', 'system'),
    defaultValue: 'text',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  // Dosya eki metadata (JSON olarak saklanır)
  attachmentUrl: {
    type: DataTypes.STRING(512),
    allowNull: true,
  },
  attachmentName: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  attachmentSize: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  attachmentMime: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  // Reply-to
  replyToId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: 'messages', key: 'id' },
  },
  // Soft delete
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  deletedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  // Düzenleme
  editedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Emoji reactions — { "👍": [userId, ...], "❤️": [...] }
  reactions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {},
  },
}, {
  tableName: 'messages',
  indexes: [
    { fields: ['conversation_id', 'created_at'] },
    { fields: ['sender_id'] },
    { fields: ['reply_to_id'] },
    { fields: ['deleted_at'] },
  ],
});

module.exports = Message;
