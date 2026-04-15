const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
      isEduEmail(value) {
        const eduRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/i;
        const blocked = ['gmail.edu', 'yahoo.edu', 'hotmail.edu', 'outlook.edu'];
        const domain = value.split('@')[1]?.toLowerCase();
        if (!eduRegex.test(value)) {
          throw new Error('Sadece kurumsal .edu e-posta adresleri kabul edilir.');
        }
        if (blocked.includes(domain)) {
          throw new Error('Bu e-posta sağlayıcısına izin verilmiyor.');
        }
      },
    },
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('engineer', 'healthcare', 'admin'),
    allowNull: false,
  },
  firstName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  lastName: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  institution: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  city: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  country: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  expertise: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  verifyToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  verifyExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  resetToken: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  resetExpiry: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'users',
  // passwordHash ve token alanlarını JSON çıktısından gizle
  defaultScope: {
    attributes: {
      exclude: ['passwordHash', 'verifyToken', 'verifyExpiry', 'resetToken', 'resetExpiry'],
    },
  },
  scopes: {
    withPassword: { attributes: {} }, // Tüm alanları döndür (login için)
  },
});

module.exports = User;
