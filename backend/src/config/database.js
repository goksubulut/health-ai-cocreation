const { Sequelize } = require('sequelize');
const env = require('./env');

function buildDialectOptions() {
  if (!env.db.ssl) return undefined;
  return {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  };
}

function createSequelize() {
  const dialectOptions = buildDialectOptions();
  const baseOptions = {
    dialect: 'postgres',
    logging: env.nodeEnv === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
    },
    ...(dialectOptions ? { dialectOptions } : {}),
  };

  if (env.db.databaseUrl) {
    return new Sequelize(env.db.databaseUrl, baseOptions);
  }

  return new Sequelize(env.db.name, env.db.user, env.db.pass, {
    ...baseOptions,
    host: env.db.host,
    port: env.db.port,
  });
}

const sequelize = createSequelize();

const connectDB = async () => {
  const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || '20', 10);
  const retryDelayMs = parseInt(process.env.DB_CONNECT_DELAY_MS || '3000', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('PostgreSQL bağlantısı başarılı.');
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      console.error(`PostgreSQL bağlantı hatası (deneme ${attempt}/${maxRetries}):`, err.message);

      if (isLastAttempt) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};

module.exports = { sequelize, connectDB };
