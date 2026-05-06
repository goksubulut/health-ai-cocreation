const { Notification } = require('../models');

// GET /api/notifications?limit=20&offset=0
exports.getNotifications = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    const [notifications, unreadCount] = await Promise.all([
      Notification.findAll({
        where: { userId: req.user.id },
        order: [['createdAt', 'DESC']],
        limit,
        offset,
      }),
      Notification.count({ where: { userId: req.user.id, isRead: false } }),
    ]);
    res.json({ notifications, unreadCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/notifications/:id/read
exports.markRead = async (req, res) => {
  try {
    const [updated] = await Notification.update(
      { isRead: true },
      { where: { id: req.params.id, userId: req.user.id } }
    );
    if (!updated) return res.status(404).json({ message: 'Bildirim bulunamadı.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// PATCH /api/notifications/read-all
exports.markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { userId: req.user.id, isRead: false } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// DELETE /api/notifications/:id
exports.deleteNotification = async (req, res) => {
  try {
    const deleted = await Notification.destroy({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!deleted) return res.status(404).json({ message: 'Bildirim bulunamadı.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
};
