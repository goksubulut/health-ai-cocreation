const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

// Tüm admin route'ları: önce kimlik doğrulama, sonra admin rolü kontrolü
router.use(authenticate, authorize('admin'));

// Kullanıcı yönetimi
router.get('/users',            adminController.getUsers);
router.get('/users/:id',        adminController.getUserById);
router.patch('/users/:id/suspend', adminController.suspendUser);

// İlan yönetimi
router.get('/posts',            adminController.getPosts);
router.delete('/posts/:id',     adminController.deletePost);

// Log yönetimi
router.get('/logs',             adminController.getLogs);
router.get('/logs/export',      adminController.exportLogs);
router.delete('/logs/cleanup',  adminController.cleanupLogs);

// İstatistikler
router.get('/stats',            adminController.getStats);

module.exports = router;
