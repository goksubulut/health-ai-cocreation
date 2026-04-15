const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * JWT access token doğrulama middleware'i.
 * Başarılı olursa req.user = { id, role, email } atar.
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Yetkilendirme token\'ı bulunamadı.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.jwt.accessSecret);
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Oturum süresi doldu. Lütfen tekrar giriş yapın.' });
    }
    return res.status(401).json({ message: 'Geçersiz token.' });
  }
};

module.exports = authenticate;
