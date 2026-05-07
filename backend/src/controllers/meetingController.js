const { Op } = require('sequelize');
const {
  MeetingRequest,
  Post,
  NdaAcceptance,
  User,
  TimeSlot,
} = require('../models');
const { sequelize } = require('../config/database');
const { logActivity, hashIp } = require('../services/logService');
const {
  sendMeetingRequestNotification,
  sendMeetingAcceptedNotification,
  sendMeetingDeclinedNotification,
  sendSlotProposedNotification,
  sendMeetingScheduledNotification,
  sendMeetingCancelledNotification,
} = require('../services/emailService');
const { expireStalePosts } = require('./postController');
const { createNotification } = require('../services/notificationService');

const USER_ATTRS = ['id', 'email', 'firstName', 'lastName', 'institution', 'city', 'country'];
const POST_ATTRS_DETAIL = [
  'id',
  'title',
  'domain',
  'description',
  'status',
  'userId',
  'confidentiality',
  'expiryDate',
];

const isParty = (meeting, userId) =>
  meeting.requesterId === userId || meeting.postOwnerId === userId;

const serializeUser = (u) => {
  if (!u) return undefined;
  const x = u.get ? u.get({ plain: true }) : u;
  return {
    id: x.id,
    email: x.email,
    first_name: x.firstName,
    last_name: x.lastName,
    institution: x.institution,
    city: x.city,
    country: x.country,
  };
};

const serializePost = (p) => {
  if (!p) return undefined;
  const x = p.get ? p.get({ plain: true }) : p;
  return {
    id: x.id,
    user_id: x.userId,
    title: x.title,
    domain: x.domain,
    description: x.description,
    status: x.status,
    confidentiality: x.confidentiality,
    expiry_date: x.expiryDate,
  };
};

const serializeTimeSlot = (s) => {
  const x = s.get ? s.get({ plain: true }) : s;
  return {
    id: x.id,
    meeting_request_id: x.meetingRequestId,
    proposed_by: x.proposedBy,
    slot_datetime: x.slotDatetime,
    is_selected: x.isSelected,
  };
};

const serializeMeeting = (m) => {
  const x = m.get ? m.get({ plain: true }) : m;
  const out = {
    id: x.id,
    post_id: x.postId,
    requester_id: x.requesterId,
    post_owner_id: x.postOwnerId,
    message: x.message,
    nda_accepted: x.ndaAccepted,
    nda_accepted_at: x.ndaAcceptedAt,
    status: x.status,
    proposed_time: x.proposedTime,
    confirmed_slot: x.confirmedSlot,
    created_at: x.createdAt,
    updated_at: x.updatedAt,
  };
  if (x.post) out.post = serializePost(x.post);
  if (x.requester) out.requester = serializeUser(x.requester);
  if (x.postOwner) out.post_owner = serializeUser(x.postOwner);
  if (x.timeSlots) out.time_slots = x.timeSlots.map((t) => serializeTimeSlot(t));
  return out;
};

const otherPartyId = (meeting, userId) =>
  meeting.requesterId === userId ? meeting.postOwnerId : meeting.requesterId;

const postAllowsCollaboration = (post) =>
  Boolean(post && ['active', 'meeting_scheduled'].includes(post.status));

const parsePositiveInt = (value) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

// ── POST /api/meetings ─────────────────────────────────────────
const createMeetingRequest = async (req, res) => {
  try {
    await expireStalePosts();
    const { post_id: postId, message, nda_accepted: ndaAcceptedBody } = req.body;
    const requesterId = req.user.id;

    const post = await Post.findByPk(postId, {
      include: [{ model: User, as: 'owner', attributes: USER_ATTRS }],
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    if (!['active', 'meeting_scheduled'].includes(post.status)) {
      return res.status(400).json({ error: 'Post is not accepting requests' });
    }

    if (post.userId === requesterId) {
      return res.status(400).json({ error: 'Cannot request a meeting on your own post' });
    }

    // Use latest request state for this requester+post pair.
    // If the latest one is cancelled/declined, user can send a new proposal.
    const latestRequest = await MeetingRequest.findOne({
      where: {
        postId,
        requesterId,
      },
      // Cancellation/decline updates updatedAt. Prefer most recently changed row.
      order: [
        ['updatedAt', 'DESC'],
        ['createdAt', 'DESC'],
        ['id', 'DESC'],
      ],
    });
    if (latestRequest && ['pending', 'accepted', 'scheduled'].includes(latestRequest.status)) {
      return res.status(400).json({ error: 'You already have an active request for this post' });
    }

    let ndaAccepted = false;
    let ndaAcceptedAt = null;

    if (post.confidentiality === 'meeting_only') {
      if (ndaAcceptedBody !== true) {
        return res.status(400).json({ error: 'NDA acceptance required for this post' });
      }
      const [ndaRecord, created] = await NdaAcceptance.findOrCreate({
        where: { userId: requesterId, postId },
        defaults: {
          ipHash: hashIp(req.ip),
          acceptedAt: new Date(),
        },
      });
      if (!created) {
        await ndaRecord.update({
          acceptedAt: new Date(),
          ipHash: hashIp(req.ip),
        });
      }
      ndaAccepted = true;
      ndaAcceptedAt = new Date();
    }

    const meeting = await MeetingRequest.create({
      postId,
      requesterId,
      postOwnerId: post.userId,
      message: message ?? null,
      ndaAccepted,
      ndaAcceptedAt,
      status: 'pending',
    });

    const requester = await User.findByPk(requesterId, { attributes: USER_ATTRS });

    await sendMeetingRequestNotification(post.owner, requester, post);
    await createNotification(
      post.userId, 'meeting_request',
      'Yeni toplantı isteği',
      `${requester?.firstName || ''} "${post.title}" ilanın için toplantı talep etti.`,
      'meeting', meeting.id
    );

    await logActivity({
      userId: requesterId,
      role: req.user.role,
      actionType: 'MEETING_REQUEST',
      targetEntity: 'meeting_request',
      targetId: meeting.id,
      ip: req.ip,
    });

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        { model: TimeSlot, as: 'timeSlots' },
      ],
    });

    return res.status(201).json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── GET /api/meetings ──────────────────────────────────────────
const getMyMeetings = async (req, res) => {
  try {
    await expireStalePosts();
    const userId = req.user.id;
    const { type = 'all', status: statusFilter } = req.query;

    const where = {};
    if (type === 'sent') {
      where.requesterId = userId;
    } else if (type === 'received') {
      where.postOwnerId = userId;
    } else {
      where[Op.or] = [{ requesterId: userId }, { postOwnerId: userId }];
    }

    if (statusFilter) {
      where.status = statusFilter;
    }

    const rows = await MeetingRequest.findAll({
      where,
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return res.json({ data: rows.map((m) => serializeMeeting(m)) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── GET /api/meetings/:id ──────────────────────────────────────
const getMeetingById = async (req, res) => {
  try {
    await expireStalePosts();
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'You do not have access to this meeting request.' });
    }

    return res.json({ data: serializeMeeting(meeting) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PATCH /api/meetings/:id/accept ────────────────────────────
const acceptMeetingRequest = async (req, res) => {
  try {
    await expireStalePosts();
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (meeting.postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the post owner can accept this request.' });
    }

    if (meeting.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be accepted.' });
    }

    const post = meeting.post;
    if (!post || !['active', 'meeting_scheduled'].includes(post.status)) {
      return res.status(400).json({
        error:
          post?.status === 'expired'
            ? 'This listing has expired. You can no longer accept meeting requests for it.'
            : 'This listing is not accepting meeting actions.',
      });
    }

    await meeting.update({ status: 'accepted' });

    if (meeting.post && meeting.post.status === 'active') {
      await Post.update({ status: 'meeting_scheduled' }, { where: { id: meeting.postId } });
    }

    const requester = await User.findByPk(meeting.requesterId, { attributes: USER_ATTRS });
    if (requester && meeting.post) {
      await sendMeetingAcceptedNotification(requester, meeting.post);
    }
    await createNotification(
      meeting.requesterId, 'meeting_accepted',
      'Toplantı isteğin kabul edildi',
      `"${meeting.post?.title || 'İlan'}" için toplantı isteğin kabul edildi.`,
      'meeting', meeting.id
    );

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'MEETING_ACCEPT',
      targetEntity: 'meeting_request',
      targetId: meeting.id,
      ip: req.ip,
    });

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    return res.json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PATCH /api/meetings/:id/decline ───────────────────────────
const declineMeetingRequest = async (req, res) => {
  try {
    await expireStalePosts();
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (meeting.postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Only the post owner can decline this request.' });
    }

    if (meeting.status === 'cancelled') {
      return res.status(400).json({
        error:
          meeting.post?.status === 'expired'
            ? 'This request was closed because the listing expired before you responded.'
            : 'This meeting request was already cancelled.',
      });
    }

    if (!['pending', 'accepted'].includes(meeting.status)) {
      return res.status(400).json({ error: 'This meeting request cannot be declined in its current state.' });
    }

    await meeting.update({ status: 'declined' });

    const requester = await User.findByPk(meeting.requesterId, { attributes: USER_ATTRS });
    if (requester && meeting.post) {
      await sendMeetingDeclinedNotification(requester, meeting.post);
    }
    await createNotification(
      meeting.requesterId, 'meeting_declined',
      'Toplantı isteğin reddedildi',
      `"${meeting.post?.title || 'İlan'}" için toplantı isteğin reddedildi.`,
      'meeting', meeting.id
    );

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'MEETING_DECLINE',
      targetEntity: 'meeting_request',
      targetId: meeting.id,
      ip: req.ip,
    });

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    return res.json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── POST /api/meetings/:id/slots ──────────────────────────────
const proposeSlots = async (req, res) => {
  try {
    await expireStalePosts();
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (meeting.requesterId !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can propose time slots.' });
    }

    if (!postAllowsCollaboration(meeting.post)) {
      return res.status(400).json({
        error:
          meeting.post?.status === 'expired'
            ? 'This listing has expired; you can no longer add or change time slots.'
            : 'This listing is not open for collaboration.',
      });
    }

    if (!['pending', 'accepted'].includes(meeting.status)) {
      return res
        .status(400)
        .json({ error: 'Time slots cannot be added in the current meeting state.' });
    }

    const existingCount = await TimeSlot.count({ where: { meetingRequestId: meeting.id } });
    const incoming = req.body.slots || [];
    if (existingCount + incoming.length > 5) {
      return res.status(400).json({ error: 'A maximum of 5 time slots is allowed per meeting request.' });
    }

    const created = await sequelize.transaction(async (t) => {
      const rows = [];
      for (const slot of incoming) {
        const dt = slot.slot_datetime;
        const row = await TimeSlot.create(
          {
            meetingRequestId: meeting.id,
            proposedBy: req.user.id,
            slotDatetime: new Date(dt),
            isSelected: false,
          },
          { transaction: t }
        );
        rows.push(row);
      }
      return rows;
    });

    const recipientId = otherPartyId(meeting, req.user.id);
    const recipient = await User.findByPk(recipientId, { attributes: USER_ATTRS });
    if (recipient) {
      await sendSlotProposedNotification(recipient, meeting, created);
    }

    return res.status(201).json({ data: created.map((c) => serializeTimeSlot(c)) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PATCH /api/meetings/:id/slots/:slotId ─────────────────────
const updateSlot = async (req, res) => {
  try {
    await expireStalePosts();
    const meetingId = parsePositiveInt(req.params.id);
    const slotId = parsePositiveInt(req.params.slotId);
    if (!meetingId || !slotId) {
      return res.status(400).json({ message: 'Invalid meeting or slot id.' });
    }

    const meeting = await MeetingRequest.findByPk(meetingId, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (meeting.requesterId !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can edit time slots.' });
    }

    if (!postAllowsCollaboration(meeting.post)) {
      return res.status(400).json({
        error:
          meeting.post?.status === 'expired'
            ? 'This listing has expired; time slots can no longer be edited.'
            : 'Time slots cannot be edited for this listing.',
      });
    }

    if (!['pending', 'accepted'].includes(meeting.status)) {
      return res.status(400).json({ error: 'Time slots cannot be edited in the current meeting state.' });
    }

    const slot = await TimeSlot.findOne({
      where: { id: slotId, meetingRequestId: meetingId },
    });
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found.' });
    }

    if (slot.proposedBy !== req.user.id) {
      return res.status(403).json({ message: 'You can only edit slots you proposed.' });
    }

    const dt = req.body.slot_datetime;
    await slot.update({ slotDatetime: new Date(dt) });

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    return res.json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── DELETE /api/meetings/:id/slots/:slotId ────────────────────
const deleteSlot = async (req, res) => {
  try {
    await expireStalePosts();
    const meetingId = parsePositiveInt(req.params.id);
    const slotId = parsePositiveInt(req.params.slotId);
    if (!meetingId || !slotId) {
      return res.status(400).json({ message: 'Invalid meeting or slot id.' });
    }

    const meeting = await MeetingRequest.findByPk(meetingId, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (meeting.requesterId !== req.user.id) {
      return res.status(403).json({ message: 'Only the requester can delete time slots.' });
    }

    if (!postAllowsCollaboration(meeting.post)) {
      return res.status(400).json({
        error:
          meeting.post?.status === 'expired'
            ? 'This listing has expired; time slots can no longer be changed.'
            : 'Time slots cannot be deleted for this listing.',
      });
    }

    if (!['pending', 'accepted'].includes(meeting.status)) {
      return res.status(400).json({ error: 'Time slots cannot be deleted in the current meeting state.' });
    }

    const slot = await TimeSlot.findOne({
      where: { id: slotId, meetingRequestId: meetingId },
    });
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found.' });
    }

    if (slot.proposedBy !== req.user.id) {
      return res.status(403).json({ message: 'You can only delete slots you proposed.' });
    }

    await slot.destroy();

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    return res.json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── PATCH /api/meetings/:id/slots/:slotId/confirm ─────────────
const confirmSlot = async (req, res) => {
  try {
    await expireStalePosts();
    const meetingId = parsePositiveInt(req.params.id);
    const slotId = parsePositiveInt(req.params.slotId);
    if (!meetingId || !slotId) {
      return res.status(400).json({ message: 'Invalid meeting or slot id.' });
    }

    const slot = await TimeSlot.findOne({
      where: { id: slotId, meetingRequestId: meetingId },
    });
    if (!slot) {
      return res.status(404).json({ message: 'Time slot not found.' });
    }

    if (slot.proposedBy === req.user.id) {
      return res.status(403).json({ message: 'You cannot confirm a time slot you proposed.' });
    }

    const meeting = await MeetingRequest.findByPk(meetingId, {
      include: [{ model: Post, as: 'post', attributes: POST_ATTRS_DETAIL }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'You do not have access to this meeting request.' });
    }

    if (!postAllowsCollaboration(meeting.post)) {
      return res.status(400).json({
        error:
          meeting.post?.status === 'expired'
            ? 'This listing has expired; a time slot can no longer be confirmed.'
            : 'This action is not available for this listing.',
      });
    }

    if (meeting.status !== 'accepted') {
      return res.status(400).json({ error: 'Meeting must be accepted before confirming a slot.' });
    }

    await sequelize.transaction(async (t) => {
      await TimeSlot.update(
        { isSelected: false },
        { where: { meetingRequestId: meeting.id }, transaction: t }
      );
      await slot.update({ isSelected: true }, { transaction: t });
      await meeting.update(
        {
          confirmedSlot: slot.slotDatetime,
          status: 'scheduled',
        },
        { transaction: t }
      );
      if (meeting.post && meeting.post.status === 'active') {
        await Post.update({ status: 'meeting_scheduled' }, { where: { id: meeting.postId }, transaction: t });
      }
    });

    const requester = await User.findByPk(meeting.requesterId, { attributes: USER_ATTRS });
    const postOwner = await User.findByPk(meeting.postOwnerId, { attributes: USER_ATTRS });
    const post = await Post.findByPk(meeting.postId);

    if (requester && postOwner && post) {
      await sendMeetingScheduledNotification(requester, postOwner, slot.slotDatetime, post);
    }
    const scheduledAt = new Date(slot.slotDatetime).toLocaleString('tr-TR');
    await Promise.all([
      createNotification(meeting.requesterId, 'meeting_scheduled',
        'Toplantı zamanlandı', `"${post?.title}" için toplantınız ${scheduledAt} tarihinde planlandı.`,
        'meeting', meeting.id),
      createNotification(meeting.postOwnerId, 'meeting_scheduled',
        'Toplantı zamanlandı', `"${post?.title}" için toplantı ${scheduledAt} tarihinde onaylandı.`,
        'meeting', meeting.id),
    ]);

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'SLOT_CONFIRMED',
      targetEntity: 'time_slot',
      targetId: slot.id,
      ip: req.ip,
    });

    const full = await MeetingRequest.findByPk(meeting.id, {
      include: [
        { model: Post, as: 'post', attributes: POST_ATTRS_DETAIL },
        { model: User, as: 'requester', attributes: USER_ATTRS },
        { model: User, as: 'postOwner', attributes: USER_ATTRS },
        {
          model: TimeSlot,
          as: 'timeSlots',
          separate: true,
          order: [['slotDatetime', 'ASC']],
        },
      ],
    });

    return res.json({ data: serializeMeeting(full) });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

// ── DELETE /api/meetings/:id ───────────────────────────────────
const cancelMeetingRequest = async (req, res) => {
  try {
    await expireStalePosts();
    const meeting = await MeetingRequest.findByPk(req.params.id, {
      include: [{ model: Post, as: 'post', attributes: ['id', 'status'] }],
    });
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting request not found.' });
    }

    if (!isParty(meeting, req.user.id)) {
      return res.status(403).json({ message: 'You cannot cancel this meeting request.' });
    }

    if (!['pending', 'accepted', 'scheduled'].includes(meeting.status)) {
      return res.status(400).json({ message: 'This meeting request cannot be cancelled.' });
    }

    const otherId = otherPartyId(meeting, req.user.id);
    const recipient = await User.findByPk(otherId, { attributes: USER_ATTRS });

    await meeting.update({ status: 'cancelled' });

    if (meeting.post && meeting.post.status === 'meeting_scheduled') {
      const activeMeetingsCount = await MeetingRequest.count({
        where: {
          postId: meeting.postId,
          status: { [Op.in]: ['accepted', 'scheduled'] },
          id: { [Op.ne]: meeting.id },
        },
      });
      if (activeMeetingsCount === 0) {
        await Post.update({ status: 'active' }, { where: { id: meeting.postId } });
      }
    }

    if (recipient) {
      await sendMeetingCancelledNotification(recipient, meeting);
    }

    await logActivity({
      userId: req.user.id,
      role: req.user.role,
      actionType: 'MEETING_CANCEL',
      targetEntity: 'meeting_request',
      targetId: meeting.id,
      ip: req.ip,
    });

    return res.json({ message: 'Meeting request cancelled.' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal server error.' });
  }
};

module.exports = {
  createMeetingRequest,
  getMyMeetings,
  getMeetingById,
  acceptMeetingRequest,
  declineMeetingRequest,
  proposeSlots,
  updateSlot,
  deleteSlot,
  confirmSlot,
  cancelMeetingRequest,
};
