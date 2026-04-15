const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const TimeSlot = sequelize.define('TimeSlot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  meetingRequestId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'meeting_requests', key: 'id' },
  },
  proposedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  slotDatetime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  isSelected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'time_slots',
});

module.exports = TimeSlot;
