const { MeetingRequest, Post, NdaAcceptance, User } = require('../models');
const { sendMeetingRequestNotification } = require('../services/emailService');

// Talebe taraf olup olmadığını kontrol et
const isParty = (meeting, userId) =>
  meeting.requesterId === userId || meeting.postOwnerId === userId;

// ── POST /api/meetings ─────────────────────────────────────────
// Toplantı talebi gönder (NDA kabul zorunlu)
const createMeetingRequest = async (req, res) => {
  try {
    const { postId, message, ndaAccepted } = req.body;
    const requesterId = req.user.id;

    const post = await Post.findByPk(postId, {
      include: [{ model: User, as: 'owner', attributes: ['id', 'email', 'firstName', 'lastName'] }],
    });

    if (!post) return res.status(404).json({ message: 'İlan bulunamadı.' });

    if (post.status !== 'active') {
      return res.status(400).json({ message: 'Bu ilana artık talep gönderilemiyor.' });
    }

    if (post.userId === requesterId) {
      return res.status(400).json({ message: 'Kendi ilanınıza talep gönderemezsiniz.' });
    }

    // Aynı ilana birden fazla talep engelle
    const existing = await MeetingRequest.findOne({
      where: { postId, requesterId, status: ['pending', 'accepted', 'scheduled'] },
    });
    if (existing) {
      return res.status(409).json({ message: 'Bu ilana zaten aktif bir talebiniz var.' });
    }

    const meeting = await MeetingRequest.create({
      postId,
      requesterId,
      postOwnerId: post.userId,
      message,
      ndaAccepted: true,
      ndaAcceptedAt: new Date(),
    });

    // NDA kaydı oluştur
    await NdaAcceptance.create({
      userId: requesterId,
      postId,
      ipHash: null, // İsteğe bağlı: req.ip ile doldurulabilir
    }).catch(() => {}); // unique constraint ihlalini sessizce geç

    // Posta sahibine email bildirimi
    const requester = await User.findByPk(requesterId, { attributes: ['firstName', 'lastName'] });
    await sendMeetingRequestNotification(
      post.owner.email,
      `${requester.firstName} ${requester.lastName}`,
      post.title
    );

    return res.status(201).json({ message: 'Toplantı talebi gönderildi.', meeting });
  } catch (err) {
    console.error('createMeetingRequest hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/meetings ──────────────────────────────────────────
// Gelen ve giden talepler
const getMyMeetings = async (req, res) => {
  try {
    const userId = req.user.id;

    const meetings = await MeetingRequest.findAll({
      where: {
        [require('sequelize').Op.or]: [
          { requesterId: userId },
          { postOwnerId: userId },
        ],
      },
      include: [
        { model: Post, as: 'post', attributes: ['id', 'title', 'domain', 'status'] },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'institution'] },
        { model: User, as: 'postOwner', attributes: ['id', 'firstName', 'lastName', 'institution'] },
      ],
      order: [['createdAt', 'DESC']],
    });

    // Gelen / giden olarak ayır
    const sent     = meetings.filter(m => m.requesterId === userId);
    const received = meetings.filter(m => m.postOwnerId === userId);

    return res.json({ sent, received });
  } catch (err) {
    console.error('getMyMeetings hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── GET /api/meetings/:id ──────────────────────────────────────
const getMeetingById = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [
        { model: Post, as: 'post', attributes: ['id', 'title', 'domain', 'status', 'userId'] },
        { model: User, as: 'requester', attributes: ['id', 'firstName', 'lastName', 'institution', 'city'] },
        { model: User, as: 'postOwner', attributes: ['id', 'firstName', 'lastName', 'institution', 'city'] },
      ],
    });

    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'Bu talebe erişim yetkiniz yok.' });
    }

    return res.json({ meeting });
  } catch (err) {
    console.error('getMeetingById hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/meetings/:id/accept ────────────────────────────
const acceptMeetingRequest = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (meeting.postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Bu talebi sadece ilan sahibi kabul edebilir.' });
    }
    if (meeting.status !== 'pending') {
      return res.status(400).json({ message: `Talep zaten '${meeting.status}' durumunda.` });
    }

    await meeting.update({ status: 'accepted' });
    return res.json({ message: 'Talep kabul edildi.', meeting });
  } catch (err) {
    console.error('acceptMeetingRequest hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/meetings/:id/decline ───────────────────────────
const declineMeetingRequest = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (meeting.postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Bu talebi sadece ilan sahibi reddedebilir.' });
    }
    if (!['pending', 'accepted'].includes(meeting.status)) {
      return res.status(400).json({ message: `Talep '${meeting.status}' durumunda olduğundan reddedilemiyor.` });
    }

    await meeting.update({ status: 'declined' });
    return res.json({ message: 'Talep reddedildi.', meeting });
  } catch (err) {
    console.error('declineMeetingRequest hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/meetings/:id/propose-time ──────────────────────
const proposeTime = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }
    if (!['accepted'].includes(meeting.status)) {
      return res.status(400).json({ message: 'Zaman önerisi yapabilmek için talep önce kabul edilmeli.' });
    }

    await meeting.update({ proposedTime: req.body.proposedTime });
    return res.json({ message: 'Toplantı zamanı önerildi.', meeting });
  } catch (err) {
    console.error('proposeTime hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── PATCH /api/meetings/:id/confirm-time ──────────────────────
const confirmTime = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post', attributes: ['id', 'status'] }],
    });

    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
    }
    if (meeting.status !== 'accepted') {
      return res.status(400).json({ message: 'Zaman onayı için talep kabul edilmiş olmalı.' });
    }

    await meeting.update({ confirmedSlot: req.body.confirmedSlot, status: 'scheduled' });

    // İlanın durumunu meeting_scheduled'a güncelle
    if (meeting.post && meeting.post.status === 'active') {
      await Post.update(
        { status: 'meeting_scheduled' },
        { where: { id: meeting.postId } }
      );
    }

    return res.json({ message: 'Toplantı zamanı onaylandı.', meeting });
  } catch (err) {
    console.error('confirmTime hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

// ── DELETE /api/meetings/:id ───────────────────────────────────
const cancelMeetingRequest = async (req, res) => {
  try {
    const meeting = await MeetingRequest.findByPk(req.params.id);
    if (!meeting) return res.status(404).json({ message: 'Talep bulunamadı.' });

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'Bu talebi iptal etme yetkiniz yok.' });
    }
    if (['declined', 'cancelled'].includes(meeting.status)) {
      return res.status(400).json({ message: 'Talep zaten iptal edilmiş veya reddedilmiş.' });
    }

    await meeting.update({ status: 'cancelled' });
    return res.json({ message: 'Talep iptal edildi.' });
  } catch (err) {
    console.error('cancelMeetingRequest hatası:', err);
    return res.status(500).json({ message: 'Sunucu hatası.' });
  }
};

module.exports = {
  createMeetingRequest,
  getMyMeetings,
  getMeetingById,
  acceptMeetingRequest,
  declineMeetingRequest,
  proposeTime,
  confirmTime,
  cancelMeetingRequest,
};
