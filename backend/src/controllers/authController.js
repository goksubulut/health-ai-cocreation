const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { User } = require('../models');
const env = require('../config/env');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { logActivity } = require('../services/logService');

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiry }
  );

const generateRefreshToken = (user) =>
  jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiry }
  );

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const {
      email,
      password,
      role,
      first_name: firstName,
      last_name: lastName,
      institution,
      city,
      country,
      expertise,
    } = req.body;

    const existing = await User.scope('withPassword').findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'This email is already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpiry = new Date(Date.now() + 6 * 60 * 60 * 1000);

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
      isVerified: false,
      verifyToken,
      verifyExpiry,
    });

    await sendVerificationEmail(user, verifyToken);

    await logActivity({
      userId: user.id,
      role: user.role,
      actionType: 'REGISTER',
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.status(201).json({
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
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
      return res.status(400).json({ message: 'Invalid verification link.' });
    }

    if (!user.verifyExpiry || new Date() > new Date(user.verifyExpiry)) {
      return res.status(400).json({ message: 'Verification link has expired.' });
    }

    await user.update({
      isVerified: true,
      verifyToken: null,
      verifyExpiry: null,
    });

    await logActivity({
      userId: user.id,
      role: user.role,
      actionType: 'EMAIL_VERIFIED',
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.status(200).json({
      message: 'Email verified successfully. You can now log in.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
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
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Email verification not enforced on login (testing); re-add isVerified check before production.

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    await user.update({ lastLogin: new Date() });

    await logActivity({ userId: user.id, role: user.role, actionType: 'LOGIN', resultStatus: 'success', ip });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    return res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        first_name: user.firstName,
        last_name: user.lastName,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/refresh
 */
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, env.jwt.refreshSecret);
    } catch {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid or expired refresh token.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    const accessToken = generateAccessToken(user);
    return res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.scope('withPassword').findOne({ where: { email } });

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const verifyExpiry = new Date(Date.now() + 60 * 60 * 1000);
      await user.update({
        verifyToken: resetToken,
        verifyExpiry,
      });
      await sendPasswordResetEmail(user, resetToken);
    }

    return res.status(200).json({
      message: 'If this email is registered, a reset link has been sent.',
    });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/reset-password/:token
 */
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.scope('withPassword').findOne({ where: { verifyToken: token } });

    if (!user || !user.verifyExpiry || new Date() > new Date(user.verifyExpiry)) {
      return res.status(400).json({ message: 'Invalid or expired reset link.' });
    }

    const passwordHash = await bcrypt.hash(password, env.bcryptRounds);
    await user.update({
      passwordHash,
      verifyToken: null,
      verifyExpiry: null,
    });

    await logActivity({
      userId: user.id,
      role: user.role,
      actionType: 'PASSWORD_RESET',
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

/**
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'LOGOUT',
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = { register, verifyEmail, login, refresh, forgotPassword, resetPassword, logout };
