const { Sequelize } = require('sequelize');
const env = require('./env');

const sequelize = new Sequelize(env.db.name, env.db.user, env.db.pass, {
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.nodeEnv === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true, // camelCase -> snake_case otomatik
  },
});

const connectDB = async () => {
  const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || '20', 10);
  const retryDelayMs = parseInt(process.env.DB_CONNECT_DELAY_MS || '3000', 10);

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      await sequelize.authenticate();
      console.log('MySQL bağlantısı başarılı.');
      return;
    } catch (err) {
      const isLastAttempt = attempt === maxRetries;
      console.error(`MySQL bağlantı hatası (deneme ${attempt}/${maxRetries}):`, err.message);

      if (isLastAttempt) {
        process.exit(1);
      }

      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }
};

module.exports = { sequelize, connectDB };
