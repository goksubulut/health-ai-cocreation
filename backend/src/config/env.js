require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL?.trim() || null;

const requiredCommon = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'SMTP_HOST', 'SMTP_USER', 'SMTP_PASS'];

for (const key of requiredCommon) {
  if (!process.env[key]) {
    throw new Error(`Eksik ortam değişkeni: ${key}`);
  }
}

if (!databaseUrl) {
  for (const key of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASS']) {
    if (!process.env[key]) {
      throw new Error(`Eksik ortam değişkeni: ${key} (veya DATABASE_URL)`);
    }
  }
}

const parsedPort = parseInt(process.env.PORT, 10);
const port = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

/** Render managed PostgreSQL için genelde DB_SSL=true gerekir (TLS). */
const dbSsl = process.env.DB_SSL === 'true';

module.exports = {
  port,
  /** E-posta logları ve doğrudan API doğrulama linki */
  apiPublicUrl: process.env.API_PUBLIC_URL || `http://localhost:${port}`,
  nodeEnv: process.env.NODE_ENV || 'development',
  dbAutoSync: process.env.DB_AUTO_SYNC === 'true' || process.env.NODE_ENV === 'development',
  dbSyncAlter: process.env.DB_SYNC_ALTER === 'false',
  db: {
    databaseUrl,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    ssl: dbSsl,
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || 'HEALTH AI <no-reply@healthai.edu>',
  },

  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  bcryptRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
};
