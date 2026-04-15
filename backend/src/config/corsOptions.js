const env = require('./env');

const corsOptions = {
  origin: (origin, callback) => {
    const allowed = [env.frontendUrl];
    // Geliştirme ortamında Postman gibi araçlara izin ver
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS: ${origin} adresine izin verilmiyor.`));
    }
  },
  credentials: true, // Cookie/Authorization header'ı için
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

module.exports = corsOptions;
