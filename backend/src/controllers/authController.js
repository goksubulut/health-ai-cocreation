const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const env = require('../config/env');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logActivity } = require('../services/logService');

// ── Token üretici yardımcılar ──────────────────────────────────

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry }
  );

// ── Controller metodları ───────────────────────────────────────

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, role, firstName, lastName, institution, city, country, expertise } = req.body;

    // Mevcut kullanıcı kontrolü
    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Bu e-posta adresi zaten kayıtlı.' });
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const skipEmailVerification = env.skipEmailVerification;
    const verifyToken = skipEmailVerification ? null : crypto.randomBytes(32).toString('hex');
    const verifyExpiry = skipEmailVerification ? null : new Date(Date.now() + 6 * 60 * 60 * 1000); // 6 saat

    const user = await User.create({
      email,
      passwordHash,
      role,
      firstName,
      lastName,
      institution,
      city,
      country,
      expertise,
      isVerified: skipEmailVerification,
      verifyToken,
      verifyExpiry,
    });

    if (!skipEmailVerification) {
      await sendVerificationEmail(email, verifyToken);
    }

    return res.status(201).json({
      message: skipEmailVerification
        ? 'Kayıt başarılı. Hesabınız doğrudan aktif edildi.'
        : 'Kayıt başarılı. Lütfen e-posta adresinizi doğrulayın.',
      userId: user.id,
    });
  } catch (err) {
    console.error('register hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * GET /api/auth/verify-email/:token
 */
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.scope('withPassword').findOne({ where: { verifyToken: token } });

    if (!user) {
      return res.status(400).json({ message: 'Geçersiz doğrulama bağlantısı.' });
    }

    if (new Date() > user.verifyExpiry) {
      return res.status(400).json({ message: 'Doğrulama bağlantısının süresi dolmuş. Lütfen yeniden kayıt olun.' });
    }

    await user.update({ isVerified: true, verifyToken: null, verifyExpiry: null });

    return res.json({ message: 'E-posta adresiniz başarıyla doğrulandı. Artık giriş yapabilirsiniz.' });
  } catch (err) {
    console.error('verifyEmail hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  const ip = req.ip;
  try {
    const { email, password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await logActivity({ actionType: 'FAILED_LOGIN', resultStatus: 'failure', ip });
      return res.status(401).json({ message: 'E-posta veya şifre hatalı.' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Lütfen önce e-posta adresinizi doğrulayın.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Hesabınız askıya alınmış. Destek ile iletişime geçin.' });
    }

    await user.update({ lastLogin: new Date() });

    await logActivity({ userId: user.id, role: user.role, actionType: 'LOGIN', ip });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
  } catch (err) {
    console.error('login hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'Refresh token gerekli.' });
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    } catch {
      return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş refresh token.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Kullanıcı bulunamadı veya hesap askıya alındı.' });
    }

    const accessToken = generateAccessToken(user);
    return res.json({ accessToken });
  } catch (err) {
    console.error('refresh hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    // Güvenlik: kullanıcı var mı yok mu belli etme
    if (user && user.isVerified) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 saat
      await user.update({ resetToken, resetExpiry });
      await sendPasswordResetEmail(email, resetToken);
    }

    return res.json({ message: 'Şifre sıfırlama talimatları e-posta adresinize gönderildi (kayıtlıysa).' });
  } catch (err) {
    console.error('forgotPassword hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { resetToken: token } });

    if (!user || new Date() > user.resetExpiry) {
      return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş sıfırlama bağlantısı.' });
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    await user.update({ passwordHash, resetToken: null, resetExpiry: null });

    return res.json({ message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error('resetPassword hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

/**
 * POST /api/auth/logout
 * (Stateless JWT — frontend token'ı siler; ileride blacklist eklenebilir)
 */
const logout = async (req, res) => {
  return res.json({ message: 'Başarıyla çıkış yapıldı.' });
};

module.exports = { register, verifyEmail, login, refresh, forgotPassword, resetPassword, logout };
