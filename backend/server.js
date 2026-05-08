require('./src/config/env'); // İlk önce env doğrulaması

const http = require('http');
const app = require('./src/app');
const { connectDB, sequelize } = require('./src/config/database');
require('./src/models'); // İlişkileri + chat modellerini kur

const env = require('./src/config/env');
const { initSocket } = require('./src/services/socketService');

const startServer = async () => {
  try {
    // Veritabanı bağlantısı
    await connectDB();

    // Opsiyonel: tablo/modele otomatik senkronizasyon
    if (env.dbAutoSync) {
      await sequelize.sync({ alter: false });
      console.log('Tablolar senkronize edildi (alter: false).');
    }

    // HTTP server (Socket.IO için http.Server gerekli)
    const httpServer = http.createServer(app);

    // Socket.IO başlat
    const io = initSocket(httpServer);

    // io instance'ını app'e bağla — gerekirse controller'lardan erişilebilsin
    app.set('io', io);

    httpServer.listen(env.port, () => {
      console.log(`\n🚀 HEALTH AI Backend çalışıyor → http://localhost:${env.port}`);
      console.log(`   Ortam: ${env.nodeEnv}`);
      console.log(`   Sağlık kontrolü: http://localhost:${env.port}/health`);
      console.log(`   Socket.IO: aktif\n`);
    });
  } catch (err) {
    console.error('Sunucu başlatılamadı:', err);
    process.exit(1);
  }
};

startServer();
