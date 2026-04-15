const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MeetingRequest = sequelize.define('MeetingRequest', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'posts', key: 'id' },
  },
  requesterId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  postOwnerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: true, // İlgi mesajı (isteğe bağlı)
  },
  ndaAccepted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  ndaAcceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'accepted', 'declined', 'scheduled', 'cancelled'),
    defaultValue: 'pending',
  },
  // time_slots tablosu yerine basit tek tarih alanı
  proposedTime: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  confirmedSlot: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'meeting_requests',
});

module.exports = MeetingRequest;
