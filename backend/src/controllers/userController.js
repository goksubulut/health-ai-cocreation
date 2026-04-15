const bcrypt = require('bcrypt');
const { User, Post, MeetingRequest, NdaAcceptance, ActivityLog } = require('../models');
const env = require('../config/env');

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

    // Kişisel verileri anonimleştir — hesabı tamamen sil
    await user.update({
      email:        `deleted_${user.id}@removed.invalid`,
      passwordHash: '[DELETED]',
      firstName:    '[Silindi]',
      lastName:     '[Silindi]',
      institution:  null,
      city:         null,
      country:      null,
      expertise:    null,
      isActive:     false,
      isVerified:   false,
      verifyToken:  null,
      resetToken:   null,
      lastLogin:    null,
    });

    // Kullanıcının postlarını expired durumuna çek
    await Post.update(
      { status: 'expired' },
      { where: { userId: user.id, status: ['draft', 'active', 'meeting_scheduled'] } }
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

    const [user, posts, meetings, ndas] = await Promise.all([
      User.findByPk(userId),
      Post.findAll({ where: { userId } }),
      MeetingRequest.findAll({
        where: { [require('sequelize').Op.or]: [{ requesterId: userId }, { postOwnerId: userId }] },
      }),
      NdaAcceptance.findAll({ where: { userId } }),
    ]);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      profile: user,
      posts,
      meetingRequests: meetings,
      ndaAcceptances: ndas,
    };

    res.setHeader('Content-Disposition', `attachment; filename="healthai_data_${userId}.json"`);
    res.setHeader('Content-Type', 'application/json');
    return res.json(exportPayload);
  } catch (err) {
    console.error('exportData hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, exportData };
