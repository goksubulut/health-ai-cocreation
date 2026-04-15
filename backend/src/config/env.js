require('dotenv').config();

const required = [
  'DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS',
  'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET',
  'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS',
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Eksik ortam değişkeni: ${key}`);
  }
}

module.exports = {
  port: parseInt(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbAutoSync: process.env.DB_AUTO_SYNC === 'true' || process.env.NODE_ENV === 'development',
  skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',

  db: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'HEALTH AI <no-reply@healthai.edu>',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12,
};
