const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  // Tipler: meeting_request | meeting_accepted | meeting_declined | meeting_scheduled | slot_proposed
  type: { type: DataTypes.STRING(50), allowNull: false },
  title: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: true },
  // İlgili kayda deep-link için
  refType: { type: DataTypes.STRING(30), allowNull: true },  // 'meeting' | 'post'
  refId: { type: DataTypes.INTEGER, allowNull: true },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'notifications',
});

module.exports = Notification;
