const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authenticate = require('../middleware/authenticate');
const validate = require('../middleware/validate');
const { updateProfileSchema, deleteAccountSchema, changePasswordSchema } = require('../validations/userSchemas');

router.use(authenticate);

// GET  /api/users/profile      — Profili görüntüle
router.get('/profile', userController.getProfile);

// PUT  /api/users/profile      — Profili güncelle
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);

// PUT  /api/users/password      — Şifre değiştir
router.put('/password', validate(changePasswordSchema), userController.changePassword);

// DELETE /api/users/account    — Hesabı sil (GDPR)
router.delete('/account', validate(deleteAccountSchema), userController.deleteAccount);

// GET  /api/users/export-data  — Verilerini indir (GDPR)
router.get('/export-data', userController.exportData);

module.exports = router;
