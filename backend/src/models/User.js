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
        const blocked = ['gmail.edu', 'yahoo.edu', 'hotmail.edu', 'outlook.edu'];
        const domain = value.split('@')[1]?.toLowerCase();
        if (blocked.includes(domain)) {
          throw new Error('This email domain is not allowed.');
        }
        const eduIntl = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu(\.[a-z]{2})?$/i;
        const eduTr = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.edu\.tr$/i;
        if (!eduIntl.test(value) && !eduTr.test(value)) {
          throw new Error('Only institutional .edu or .edu.tr email addresses are accepted.');
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
