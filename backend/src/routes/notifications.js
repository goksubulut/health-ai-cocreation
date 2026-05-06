const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const ctrl = require('../controllers/notificationController');

router.use(authenticate);

router.get('/',               ctrl.getNotifications);
router.patch('/read-all',     ctrl.markAllRead);
router.patch('/:id/read',     ctrl.markRead);
router.delete('/:id',         ctrl.deleteNotification);

module.exports = router;
