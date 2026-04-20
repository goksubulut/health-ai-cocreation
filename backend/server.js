require('./src/config/env'); // İlk önce env doğrulaması

const app = require('./src/app');
const { connectDB, sequelize } = require('./src/config/database');
require('./src/models'); // İlişkileri kur

const env = require('./src/config/env');

const startServer = async () => {
  try {
    // Veritabanı bağlantısı
    await connectDB();

    // Opsiyonel: tablo/modele otomatik senkronizasyon
    if (env.dbAutoSync) {
      await sequelize.sync({ alter: false });
      console.log('Tablolar senkronize edildi (alter: false).');
    }

    app.listen(env.port, () => {
      console.log(`\n🚀 HEALTH AI Backend çalışıyor → http://localhost:${env.port}`);
      console.log(`   Ortam: ${env.nodeEnv}`);
      console.log(`   Sağlık kontrolü: http://localhost:${env.port}/health\n`);
    });
  } catch (err) {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  }
};

startServer();
