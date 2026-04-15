const { Op } = require('sequelize');
const { User, Post, ActivityLog, sequelize } = require('../models');
const { sequelize: db } = require('../config/database');

// ── GET /api/admin/users ───────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, isActive, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role)     where.role = role;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: ['id', 'email', 'role', 'firstName', 'lastName', 'institution',
                   'city', 'country', 'isVerified', 'isActive', 'lastLogin', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({ users, total: count, page: parseInt(page) });
  } catch (err) {
    console.error('admin getUsers hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/admin/users/:id ───────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash', 'verifyToken', 'resetToken'] },
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    return res.json({ user });
  } catch (err) {
    console.error('admin getUserById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/admin/users/:id/suspend ────────────────────────
const suspendUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin hesabı askıya alınamaz.' });
    }

    const newState = !user.isActive; // Toggle: askıya al / aktif et
    await user.update({ isActive: newState });

    const action = newState ? 'aktif hale getirildi' : 'askıya alındı';
    return res.json({ message: `Kullanıcı ${action}.`, isActive: newState });
  } catch (err) {
    console.error('admin suspendUser hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/admin/posts ───────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const { status, domain, city, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (domain) where.domain = { [Op.like]: `%${domain}%` };
    if (city)   where.city = { [Op.like]: `%${city}%` };

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
      }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 100),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({ posts, total: count, page: parseInt(page) });
  } catch (err) {
    console.error('admin getPosts hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── DELETE /api/admin/posts/:id ────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });
    await post.destroy();
    return res.json({ message: 'İlan admin tarafından kaldırıldı.' });
  } catch (err) {
    console.error('admin deletePost hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/admin/logs ────────────────────────────────────────
const getLogs = async (req, res) => {
  try {
    const { userId, actionType, resultStatus, from, to, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId)       where.userId = userId;
    if (actionType)   where.actionType = actionType;
    if (resultStatus) where.resultStatus = resultStatus;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to)   where.createdAt[Op.lte] = new Date(to);
    }

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role'],
        required: false,
      }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(parseInt(limit), 200),
      offset: (parseInt(page) - 1) * parseInt(limit),
    });

    return res.json({ logs, total: count, page: parseInt(page) });
  } catch (err) {
    console.error('admin getLogs hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/admin/logs/export ─────────────────────────────────
// Logları CSV olarak dışa aktar
const exportLogs = async (req, res) => {
  try {
    const { from, to, actionType } = req.query;
    const where = {};
    if (actionType) where.actionType = actionType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to)   where.createdAt[Op.lte] = new Date(to);
    }

    const logs = await ActivityLog.findAll({ where, order: [['createdAt', 'DESC']] });

    const header = 'id,userId,role,actionType,targetEntity,targetId,resultStatus,createdAt\n';
    const rows = logs.map(l =>
      [l.id, l.userId ?? '', l.role ?? '', l.actionType,
       l.targetEntity ?? '', l.targetId ?? '', l.resultStatus,
       l.createdAt.toISOString()].join(',')
    ).join('\n');

    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
    res.setHeader('Content-Type', 'text/csv');
    return res.send(header + rows);
  } catch (err) {
    console.error('admin exportLogs hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── DELETE /api/admin/logs/cleanup ────────────────────────────
// Belirtilen tarihten eski logları manuel temizle (cron yerine)
const cleanupLogs = async (req, res) => {
  try {
    const { olderThanDays = 730 } = req.query; // Varsayılan: 24 ay
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(olderThanDays));

    const deleted = await ActivityLog.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
    return res.json({ message: `${deleted} eski log kaydı silindi.`, cutoffDate: cutoff });
  } catch (err) {
    console.error('admin cleanupLogs hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/admin/stats ───────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalUsers, activeUsers,
      totalPosts, activePosts, closedPosts,
      totalMeetings, scheduledMeetings,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { isActive: true } }),
      Post.count(),
      Post.count({ where: { status: 'active' } }),
      Post.count({ where: { status: 'partner_found' } }),
      require('../models').MeetingRequest.count(),
      require('../models').MeetingRequest.count({ where: { status: 'scheduled' } }),
    ]);

    return res.json({
      users:    { total: totalUsers, active: activeUsers },
      posts:    { total: totalPosts, active: activePosts, closed: closedPosts },
      meetings: { total: totalMeetings, scheduled: scheduledMeetings },
    });
  } catch (err) {
    console.error('admin getStats hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getUsers, getUserById, suspendUser, getPosts, deletePost, getLogs, exportLogs, cleanupLogs, getStats };
