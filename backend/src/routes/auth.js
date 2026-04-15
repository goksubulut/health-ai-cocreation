const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validate');
const authenticate = require('../middleware/authenticate');
const {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validations/authSchemas');

// POST /api/auth/register
router.post('/register', validate(registerSchema), authController.register);

// GET /api/auth/verify-email/:token
router.get('/verify-email/:token', authController.verifyEmail);

// POST /api/auth/login
router.post('/login', validate(loginSchema), authController.login);

// POST /api/auth/refresh
router.post('/refresh', validate(refreshSchema), authController.refresh);

// POST /api/auth/logout (korumalı)
router.post('/logout', authenticate, authController.logout);

// POST /api/auth/forgot-password
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;
