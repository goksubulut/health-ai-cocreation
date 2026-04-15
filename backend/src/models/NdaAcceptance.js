const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const NdaAcceptance = sequelize.define('NdaAcceptance', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'users', key: 'id' },
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'posts', key: 'id' },
  },
  ipHash: {
    type: DataTypes.STRING(64), // SHA-256 hex (ip_address hashed)
    allowNull: true,
  },
  acceptedAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'nda_acceptances',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'post_id'], // Bir kullanıcı aynı post için bir kez NDA imzalar
    },
  ],
  updatedAt: false, // Sadece createdAt yeterli
});

module.exports = NdaAcceptance;
