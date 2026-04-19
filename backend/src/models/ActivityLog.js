const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const LOGGABLE_ACTIONS = [
  'LOGIN',
  'FAILED_LOGIN',
  'LOGOUT',
  'REGISTER',
  'EMAIL_VERIFIED',
  'PASSWORD_RESET',
  'POST_CREATE',
  'POST_CLOSE',
  'POST_ADMIN_REMOVE',
  'MEETING_REQUEST',
  'MEETING_ACCEPT',
  'MEETING_DECLINE',
  'SLOT_CONFIRMED',
  'MEETING_CANCEL',
  'ACCOUNT_SUSPEND',
  'ACCOUNT_REACTIVATE',
];

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: true, // FAILED_LOGIN durumunda kullanıcı bulunamayabilir
    references: { model: 'users', key: 'id' },
  },
  role: {
    type: DataTypes.ENUM('engineer', 'healthcare', 'admin'),
    allowNull: true,
  },
  actionType: {
    type: DataTypes.ENUM(...LOGGABLE_ACTIONS),
    allowNull: false,
  },
  targetEntity: {
    type: DataTypes.STRING(100),
    allowNull: true, // 'post', 'meeting_request'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  resultStatus: {
    type: DataTypes.ENUM('success', 'failure'),
    defaultValue: 'success',
  },
  ipHash: {
    type: DataTypes.STRING(64), // SHA-256 hex, ham IP tutulmaz
    allowNull: true,
  },
}, {
  tableName: 'activity_logs',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['action_type'] },
    { fields: ['created_at'] },
  ],
});

ActivityLog.LOGGABLE_ACTIONS = LOGGABLE_ACTIONS;

module.exports = ActivityLog;
