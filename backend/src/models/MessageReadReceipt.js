const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// Kim hangi mesajı ne zaman okudu
const MessageReadReceipt = sequelize.define('MessageReadReceipt', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  messageId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'messages', key: 'id' },
    onDelete: 'CASCADE',
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
    onDelete: 'CASCADE',
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'message_read_receipts',
  timestamps: false,
  indexes: [
    { unique: true, fields: ['message_id', 'user_id'] },
    { fields: ['user_id'] },
    { fields: ['message_id'] },
  ],
});

module.exports = MessageReadReceipt;
