const rateLimit = require('express-rate-limit');

// Genel API limiti: 100 istek / dakika
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla istek gönderildi. Lütfen bir dakika sonra tekrar deneyin.' },
});

// Login: 5 istek / 15 dakika (brute-force koruması)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.' },
});

// Kayıt: 3 istek / saat
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Bu IP\'den çok fazla kayıt denemesi yapıldı. Lütfen bir saat sonra deneyin.' },
});

module.exports = { generalLimiter, loginLimiter, registerLimiter };
