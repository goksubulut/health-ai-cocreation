const { Op } = require('sequelize');
const { User, Post, MeetingRequest, ActivityLog } = require('../models');
const { logActivity } = require('../services/logService');

function csvEscape(val) {
  const s = val == null ? '' : String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** @param {import('sequelize').Model} log */
function formatRelativeTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  const sec = Math.floor((Date.now() - d.getTime()) / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min${min === 1 ? '' : 's'} ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`;
  const days = Math.floor(hr / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function describeActivity(log) {
  const plain = log.get ? log.get({ plain: true }) : log;
  const email = plain.user?.email ?? (plain.userId ? `user #${plain.userId}` : 'System');
  const type = plain.actionType;
  const tgt =
    plain.targetEntity && plain.targetId != null
      ? `${plain.targetEntity} #${plain.targetId}`
      : '';
  return {
    id: String(plain.id),
    user: email,
    action: type,
    target: tgt || '—',
    summary: tgt ? `${email} · ${type} · ${tgt}` : `${email} · ${type}`,
    timeLabel: formatRelativeTime(plain.createdAt),
    createdAt: plain.createdAt,
  };
}

// ── GET /api/admin/dashboard ───────────────────────────────────
const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalPosts, pendingReports, activeMeetings, recentLogs] = await Promise.all([
      User.count(),
      Post.count(),
      MeetingRequest.count({ where: { status: 'pending' } }),
      MeetingRequest.count({
        where: { status: { [Op.in]: ['accepted', 'scheduled'] } },
      }),
      ActivityLog.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
            required: false,
          },
        ],
      }),
    ]);

    const recentActivity = recentLogs.map((row) => describeActivity(row));

    return res.json({
      stats: {
        totalUsers,
        totalPosts,
        pendingReports,
        activeMeetings,
      },
      recentActivity,
    });
  } catch (err) {
    console.error('admin getDashboard hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/users ───────────────────────────────────────
const getUsers = async (req, res) => {
  try {
    const { role, status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (status === 'active') where.isActive = true;
    if (status === 'suspended') where.isActive = false;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const { count, rows: users } = await User.findAndCountAll({
      where,
      attributes: [
        'id',
        'email',
        'role',
        'firstName',
        'lastName',
        'institution',
        'city',
        'country',
        'isVerified',
        'isActive',
        'lastLogin',
        'createdAt',
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.json({ users, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('admin getUsers hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/users/:id ───────────────────────────────────
const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['passwordHash', 'verifyToken', 'resetToken'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    return res.json({ user });
  } catch (err) {
    console.error('admin getUserById hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── PATCH /api/admin/users/:id/suspend ─────────────────────────
const suspendUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be suspended.' });
    }

    const wasActive = user.isActive;
    await user.update({ isActive: !wasActive });
    await user.reload();

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: wasActive ? 'ACCOUNT_SUSPEND' : 'ACCOUNT_REACTIVATE',
      targetEntity: 'user',
      targetId: user.id,
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.json({
      message: wasActive ? 'User suspended.' : 'User reactivated.',
      isActive: user.isActive,
    });
  } catch (err) {
    console.error('admin suspendUser hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/posts ───────────────────────────────────────
const getPosts = async (req, res) => {
  try {
    const {
      status,
      domain,
      createdFrom,
      createdTo,
      page = 1,
      limit = 20,
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (domain && String(domain).trim()) {
      where.domain = { [Op.like]: `%${String(domain).trim()}%` };
    }
    if (createdFrom || createdTo) {
      where.createdAt = {};
      if (createdFrom) where.createdAt[Op.gte] = new Date(createdFrom);
      if (createdTo) {
        const end = new Date(createdTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

    const { count, rows: posts } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'firstName', 'lastName', 'email', 'role'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    return res.json({ posts, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('admin getPosts hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE /api/admin/posts/:id — soft delete / removed_by_admin
const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    if (post.status === 'removed_by_admin') {
      return res.status(400).json({ message: 'Post is already removed.' });
    }

    await post.update({ status: 'removed_by_admin' });

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'POST_ADMIN_REMOVE',
      targetEntity: 'post',
      targetId: post.id,
      resultStatus: 'success',
      ip: req.ip,
    });

    return res.json({ message: 'Post removed by admin.', post });
  } catch (err) {
    console.error('admin deletePost hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/logs ────────────────────────────────────────
const getLogs = async (req, res) => {
  try {
    const {
      userId,
      actionType,
      from,
      to,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};
    if (userId) where.userId = parseInt(userId, 10);
    if (actionType) where.actionType = actionType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(parseInt(limit, 10) || 50, 200);

    const { count, rows: logs } = await ActivityLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: limitNum,
      offset: (pageNum - 1) * limitNum,
    });

    const rows = logs.map((l) => {
      const plain = l.get({ plain: true });
      return {
        id: String(plain.id),
        timestamp: plain.createdAt,
        userEmail: plain.user?.email ?? (plain.userId ? `user #${plain.userId}` : '—'),
        actionType: plain.actionType,
        targetEntity: plain.targetEntity,
        targetId: plain.targetId,
        resultStatus: plain.resultStatus,
        targetLabel:
          plain.targetEntity && plain.targetId != null
            ? `${plain.targetEntity} #${plain.targetId}`
            : '—',
      };
    });

    return res.json({ logs: rows, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error('admin getLogs hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/logs/export ─────────────────────────────────
const exportLogs = async (req, res) => {
  try {
    const { userId, actionType, from, to } = req.query;

    const where = {};
    if (userId) where.userId = parseInt(userId, 10);
    if (actionType) where.actionType = actionType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt[Op.gte] = new Date(from);
      if (to) {
        const end = new Date(to);
        end.setHours(23, 59, 59, 999);
        where.createdAt[Op.lte] = end;
      }
    }

    const logs = await ActivityLog.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email'],
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: 50000,
    });

    const header = ['timestamp', 'user_email', 'action', 'target_entity', 'target_id', 'result'].join(',');
    const lines = logs.map((l) => {
      const p = l.get({ plain: true });
      const email = p.user?.email ?? '';
      return [
        csvEscape(p.createdAt?.toISOString?.() ?? p.createdAt),
        csvEscape(email),
        csvEscape(p.actionType),
        csvEscape(p.targetEntity ?? ''),
        csvEscape(p.targetId ?? ''),
        csvEscape(p.resultStatus ?? ''),
      ].join(',');
    });

    res.setHeader('Content-Disposition', 'attachment; filename="activity_logs.csv"');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    return res.send(`${header}\n${lines.join('\n')}`);
  } catch (err) {
    console.error('admin exportLogs hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── DELETE /api/admin/logs/cleanup ────────────────────────────
const cleanupLogs = async (req, res) => {
  try {
    const { olderThanDays = 730 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(olderThanDays, 10));

    const deleted = await ActivityLog.destroy({ where: { createdAt: { [Op.lt]: cutoff } } });
    return res.json({ message: `${deleted} log rows deleted.`, cutoffDate: cutoff });
  } catch (err) {
    console.error('admin cleanupLogs hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/admin/stats (legacy compact shape) ────────────────
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalPosts, pendingReports, activeMeetings] = await Promise.all([
      User.count(),
      Post.count(),
      MeetingRequest.count({ where: { status: 'pending' } }),
      MeetingRequest.count({
        where: { status: { [Op.in]: ['accepted', 'scheduled'] } },
      }),
    ]);

    return res.json({
      users: { total: totalUsers },
      posts: { total: totalPosts },
      pendingMeetingRequests: pendingReports,
      activeMeetings,
    });
  } catch (err) {
    console.error('admin getStats hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  getUserById,
  suspendUser,
  getPosts,
  deletePost,
  getLogs,
  exportLogs,
  cleanupLogs,
  getStats,
};
