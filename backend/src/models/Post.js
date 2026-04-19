const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Post = sequelize.define('Post', {
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  domain: {
    type: DataTypes.STRING(100),
    allowNull: false, // Örn: "Cardiology", "Machine Learning"
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  requiredExpertise: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  projectStage: {
    type: DataTypes.ENUM('idea', 'concept_validation', 'prototype', 'pilot', 'pre_deployment'),
    allowNull: true,
  },
  commitmentLevel: {
    type: DataTypes.ENUM('advisor', 'co_founder', 'research_partner'),
    allowNull: true,
  },
  confidentiality: {
    type: DataTypes.ENUM('public', 'meeting_only'),
    defaultValue: 'public',
  },
  status: {
    type: DataTypes.ENUM(
      'draft',
      'active',
      'meeting_scheduled',
      'partner_found',
      'expired',
      'removed_by_admin'
    ),
    defaultValue: 'draft',
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  expiryDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
  },
  autoClose: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'posts',
});

module.exports = Post;
