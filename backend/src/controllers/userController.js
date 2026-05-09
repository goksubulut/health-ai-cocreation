const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const { User, Post, MeetingRequest, NdaAcceptance, ActivityLog } = require('../models');
const env = require('../config/env');

// ── PUT /api/users/password ────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Current password is incorrect.' });
    }

    const sameAsStored = await bcrypt.compare(newPassword, user.passwordHash);
    if (sameAsStored) {
      return res.status(400).json({
        message: 'New password must be different from your current password.',
      });
    }

    const passwordHash = await bcrypt.hash(newPassword, env.bcryptRounds);
    await user.update({ passwordHash });

    return res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('changePassword hatası:', err);
    return res.status(500).json({ message: 'Server error.' });
  }
};

// ── GET /api/users/profile ─────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
    return res.json({ user });
  } catch (err) {
    console.error('getProfile hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PUT /api/users/profile ─────────────────────────────────────
const updateProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Role ve email değiştirilemesin
    const { firstName, lastName, institution, city, country, expertise } = req.body;
    await user.update({ firstName, lastName, institution, city, country, expertise });

    return res.json({ message: 'Profil güncellendi.', user });
  } catch (err) {
    console.error('updateProfile hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── DELETE /api/users/account ──────────────────────────────────
// GDPR: Kullanıcı verilerini anonimleştir (fiziksel silme yerine)
const deleteAccount = async (req, res) => {
  try {
    const user = await User.scope('withPassword').findByPk(req.user.id);
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Şifre doğrulama
    const valid = await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Şifre hatalı.' });
    }

    // Kişisel verileri anonimleştir — .edu validasyonu anonim e-postayı reddettiği için validate: false
    await user.update(
      {
        email: `deleted_${user.id}@removed.invalid`,
        passwordHash: '[DELETED]',
        firstName: '[Silindi]',
        lastName: '[Silindi]',
        institution: null,
        city: null,
        country: null,
        expertise: null,
        isActive: false,
        isVerified: false,
        verifyToken: null,
        verifyExpiry: null,
        resetToken: null,
        resetExpiry: null,
        lastLogin: null,
      },
      { validate: false },
    );

    await Post.update(
      { status: 'expired' },
      {
        where: {
          userId: user.id,
          status: { [Op.in]: ['draft', 'active', 'meeting_scheduled'] },
        },
      },
    );

    return res.json({ message: 'Hesabınız ve kişisel verileriniz silindi.' });
  } catch (err) {
    console.error('deleteAccount hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/users/export-data ─────────────────────────────────
// GDPR: Tüm kullanıcı verisini JSON olarak dışa aktar
const exportData = async (req, res) => {
  try {
    const userId = req.user.id;

    const safeQuery = async (label, queryFn, fallback = []) => {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`exportData ${label} query error:`, error?.message || error);
        return fallback;
      }
    };

    const [user, posts, meetings, ndas] = await Promise.all([
      safeQuery('user', () => User.findByPk(userId), null),
      safeQuery('posts', () => Post.findAll({ where: { userId } })),
      safeQuery('meetings', () =>
        MeetingRequest.findAll({
          where: { [Op.or]: [{ requesterId: userId }, { postOwnerId: userId }] },
        })
      ),
      safeQuery('ndas', () => NdaAcceptance.findAll({ where: { userId } })),
    ]);

    // toJSON() converts Sequelize model instances to plain objects,
    // preventing circular-reference errors in JSON.stringify
    const OMIT = new Set(['passwordHash', 'verifyToken', 'verifyExpiry', 'resetToken', 'resetExpiry']);
    const safeUser = user ? Object.fromEntries(
      Object.entries(user.toJSON()).filter(([k]) => !OMIT.has(k))
    ) : null;

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: safeUser,
      posts: posts.map((p) => p.toJSON()),
      meetingRequests: meetings.map((m) => m.toJSON()),
      ndaAcceptances: ndas.map((n) => n.toJSON()),
    };

    // Keep Content-Disposition so browsers download; Content-Type set by res.json()
    res.setHeader('Content-Disposition', `attachment; filename="healthai_data_${userId}.json"`);
    return res.json(exportPayload);
  } catch (err) {
    console.error('exportData hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/users/:id/public ──────────────────────────────────
// Başka bir kullanıcının herkese açık profili (aktif kullanıcılar; e-posta doğrulaması şart değil)
const getPublicProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      where: { id: req.params.id, isActive: true },
      attributes: ['id', 'firstName', 'lastName', 'institution', 'city', 'country', 'expertise', 'role', 'createdAt'],
    });
    if (!user) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

    // Kullanıcının aktif ilanlarını da döndür
    const posts = await Post.findAll({
      where: { userId: user.id, status: 'active' },
      attributes: ['id', 'title', 'domain', 'projectStage', 'city', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 10,
    });

    return res.json({ user, posts });
  } catch (err) {
    console.error('getPublicProfile hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, exportData, changePassword, getPublicProfile };
