const rateLimit = require('express-rate-limit');

// Genel API limiti: 100 istek / dakika
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin.' },
});

module.exports = { generalLimiter };
