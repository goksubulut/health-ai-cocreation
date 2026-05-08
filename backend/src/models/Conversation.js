const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Conversation = sequelize.define('Conversation', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  type: {
    type: DataTypes.ENUM('direct', 'group'),
    allowNull: false,
    defaultValue: 'direct',
  },
  name: {
    // Sadece group chat için
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  // direct chat için iki tarafın ID'lerini hızlı lookup için tut
  directKey: {
    // "min_id:max_id" formatında — unique constraint ile duplicate önler
    type: DataTypes.STRING(40),
    allowNull: true,
    unique: true,
  },
  lastMessageAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastMessagePreview: {
    type: DataTypes.STRING(200),
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
}, {
  tableName: 'conversations',
  indexes: [
    { fields: ['direct_key'] },
    { fields: ['last_message_at'] },
    { fields: ['type'] },
  ],
});

module.exports = Conversation;
