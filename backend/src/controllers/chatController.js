const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt,
  User,
} = require('../models');

const userAttributes = ['id', 'firstName', 'lastName', 'email', 'role', 'institution'];
const senderAttributes = ['id', 'firstName', 'lastName', 'email', 'role'];

const safeUser = (user) => {
  if (!user) return null;
  const raw = user.toJSON ? user.toJSON() : user;
  return {
    id: raw.id,
    firstName: raw.firstName ?? raw.first_name,
    first_name: raw.firstName ?? raw.first_name,
    lastName: raw.lastName ?? raw.last_name,
    last_name: raw.lastName ?? raw.last_name,
    email: raw.email,
    role: raw.role,
    institution: raw.institution,
  };
};

const messagePreview = (content, type = 'text') => {
  if (type !== 'text') return `[${type}]`;
  return (content || '').trim().slice(0, 160);
};

async function serializeConversation(conversation, userId, participantRecord = null) {
  if (!conversation) return null;
  const conv = conversation.toJSON ? conversation.toJSON() : conversation;
  const participant = participantRecord || await ConversationParticipant.findOne({
    where: { conversationId: conv.id, userId, leftAt: null },
  });

  const unreadCount = participant ? await Message.count({
    where: {
      conversationId: conv.id,
      senderId: { [Op.ne]: userId },
      deletedAt: null,
      createdAt: participant.lastReadAt ? { [Op.gt]: participant.lastReadAt } : { [Op.ne]: null },
    },
  }) : 0;

  return {
    id: conv.id,
    type: conv.type,
    name: conv.name,
    lastMessageAt: conv.lastMessageAt,
    lastMessagePreview: conv.lastMessagePreview,
    unreadCount,
    isMuted: Boolean(participant?.isMuted),
    isArchived: Boolean(participant?.isArchived),
    participants: (conv.participants || [])
      .filter((user) => String(user.id) !== String(userId))
      .map(safeUser)
      .filter(Boolean),
    myParticipantRecord: {
      role: participant?.role,
      lastReadAt: participant?.lastReadAt,
    },
  };
}

async function loadConversationForUser(conversationId, userId) {
  const participant = await ConversationParticipant.findOne({
    where: { conversationId, userId, leftAt: null },
  });
  if (!participant) return null;

  const conversation = await Conversation.findByPk(conversationId, {
    include: [{
      model: User,
      as: 'participants',
      through: { attributes: ['role', 'lastReadAt', 'isMuted', 'isArchived'] },
      attributes: userAttributes,
    }],
  });

  return serializeConversation(conversation, userId, participant);
}

exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const participantRows = await ConversationParticipant.findAll({
      where: { userId, leftAt: null },
      include: [{
        model: Conversation,
        as: 'conversation',
        include: [{
          model: User,
          as: 'participants',
          through: { attributes: ['role', 'lastReadAt', 'isMuted', 'isArchived'] },
          attributes: userAttributes,
        }],
      }],
      order: [[{ model: Conversation, as: 'conversation' }, 'lastMessageAt', 'DESC']],
    });

    const conversations = await Promise.all(
      participantRows.map((row) => serializeConversation(row.conversation, userId, row))
    );

    res.json({ data: conversations.filter(Boolean) });
  } catch (error) {
    console.error('[chatController.getConversations]', error);
    res.status(500).json({ message: 'Conversations could not be loaded.' });
  }
};

exports.createConversation = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { type = 'direct', targetUserId, participantIds = [], name } = req.body;
    const userId = req.user.id;

    if (type === 'direct') {
      const targetId = Number(targetUserId);
      if (!targetId) {
        await transaction.rollback();
        return res.status(400).json({ message: 'targetUserId is required.' });
      }
      if (String(targetId) === String(userId)) {
        await transaction.rollback();
        return res.status(400).json({ message: 'You cannot start a conversation with yourself.' });
      }

      const directKey = [Number(userId), targetId].sort((a, b) => a - b).join(':');
      const existing = await Conversation.findOne({ where: { directKey } });
      if (existing) {
        await transaction.rollback();
        const payload = await loadConversationForUser(existing.id, userId);
        return res.json({ data: payload, existed: true });
      }

      const target = await User.findByPk(targetId);
      if (!target) {
        await transaction.rollback();
        return res.status(404).json({ message: 'User not found.' });
      }

      const conversation = await Conversation.create(
        { type: 'direct', directKey, createdBy: userId },
        { transaction }
      );
      await ConversationParticipant.bulkCreate([
        { conversationId: conversation.id, userId, role: 'admin', lastReadAt: new Date() },
        { conversationId: conversation.id, userId: targetId, role: 'member' },
      ], { transaction });

      await transaction.commit();
      const payload = await loadConversationForUser(conversation.id, userId);
      const targetPayload = await loadConversationForUser(conversation.id, targetId);
      req.app.get('io')?.to(`user:${targetId}`).emit('conversation:new', targetPayload);
      return res.status(201).json({ data: payload, existed: false });
    }

    if (!name?.trim()) {
      await transaction.rollback();
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const ids = [...new Set([Number(userId), ...participantIds.map(Number).filter(Boolean)])];
    if (ids.length < 2) {
      await transaction.rollback();
      return res.status(400).json({ message: 'At least two participants are required.' });
    }

    const existingUsers = await User.count({ where: { id: ids } });
    if (existingUsers !== ids.length) {
      await transaction.rollback();
      return res.status(400).json({ message: 'One or more participants could not be found.' });
    }

    const conversation = await Conversation.create(
      { type: 'group', name: name.trim(), createdBy: userId },
      { transaction }
    );
    await ConversationParticipant.bulkCreate(
      ids.map((id) => ({
        conversationId: conversation.id,
        userId: id,
        role: String(id) === String(userId) ? 'admin' : 'member',
        lastReadAt: String(id) === String(userId) ? new Date() : null,
      })),
      { transaction }
    );

    await transaction.commit();
    const payload = await loadConversationForUser(conversation.id, userId);
    const io = req.app.get('io');
    await Promise.all(ids
      .filter((id) => String(id) !== String(userId))
      .map(async (id) => {
        const participantPayload = await loadConversationForUser(conversation.id, id);
        io?.to(`user:${id}`).emit('conversation:new', participantPayload);
      }));
    return res.status(201).json({ data: payload });
  } catch (error) {
    await transaction.rollback();
    console.error('[chatController.createConversation]', error);
    res.status(500).json({ message: 'Conversation could not be created.' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const limit = Math.min(Number(req.query.limit) || 40, 100);
    const before = req.query.before ? Number(req.query.before) : null;

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, leftAt: null },
    });
    if (!participant) {
      return res.status(403).json({ message: 'You do not have access to this conversation.' });
    }

    const where = { conversationId, deletedAt: null };
    if (before) where.id = { [Op.lt]: before };

    const rows = await Message.findAll({
      where,
      include: [
        { model: User, as: 'sender', attributes: senderAttributes },
        {
          model: Message,
          as: 'replyTo',
          attributes: ['id', 'content', 'type'],
          include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
        },
        { model: MessageReadReceipt, as: 'readReceipts', attributes: ['userId', 'readAt'] },
      ],
      order: [['id', 'DESC']],
      limit: limit + 1,
    });

    const hasMore = rows.length > limit;
    const result = hasMore ? rows.slice(0, limit) : rows;

    if (!before) {
      await participant.update({ lastReadAt: new Date() });
    }

    res.json({
      data: result.reverse(),
      hasMore,
      nextCursor: hasMore ? result[result.length - 1]?.id : null,
    });
  } catch (error) {
    console.error('[chatController.getMessages]', error);
    res.status(500).json({ message: 'Messages could not be loaded.' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);
    const { content, type = 'text', replyToId } = req.body;

    if (type === 'text' && !content?.trim()) {
      return res.status(400).json({ message: 'Message content is required.' });
    }

    const participant = await ConversationParticipant.findOne({
      where: { conversationId, userId, leftAt: null },
    });
    if (!participant) return res.status(403).json({ message: 'Access denied.' });

    const message = await Message.create({
      conversationId,
      senderId: userId,
      type,
      content: content?.trim() || null,
      replyToId: replyToId || null,
    });

    await Conversation.update({
      lastMessageAt: message.createdAt,
      lastMessagePreview: messagePreview(content, type),
    }, { where: { id: conversationId } });
    await participant.update({ lastReadAt: message.createdAt });

    const full = await Message.findByPk(message.id, {
      include: [{ model: User, as: 'sender', attributes: senderAttributes }],
    });

    req.app.get('io')?.to(`conv:${conversationId}`).emit('message:new', full.toJSON());
    res.status(201).json({ data: full });
  } catch (error) {
    console.error('[chatController.sendMessage]', error);
    res.status(500).json({ message: 'Message could not be sent.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const conversationId = Number(req.params.id);

    await ConversationParticipant.update(
      { lastReadAt: new Date() },
      { where: { conversationId, userId } }
    );

    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Read state could not be updated.' });
  }
};

exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const message = await Message.findByPk(Number(req.params.msgId));
    if (!message) return res.status(404).json({ message: 'Message not found.' });
    if (String(message.senderId) !== String(userId)) return res.status(403).json({ message: 'Access denied.' });

    await message.update({ deletedAt: new Date(), deletedBy: userId, content: null });
    res.json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Message could not be deleted.' });
  }
};

exports.reactMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emoji } = req.body;
    if (!emoji) return res.status(400).json({ message: 'Emoji is required.' });

    const message = await Message.findByPk(Number(req.params.msgId));
    if (!message) return res.status(404).json({ message: 'Message not found.' });

    const participant = await ConversationParticipant.findOne({
      where: { conversationId: message.conversationId, userId, leftAt: null },
    });
    if (!participant) return res.status(403).json({ message: 'Access denied.' });

    const reactions = { ...(message.reactions || {}) };
    const users = new Set((reactions[emoji] || []).map(String));
    if (users.has(String(userId))) users.delete(String(userId));
    else users.add(String(userId));

    if (users.size) reactions[emoji] = [...users].map(Number);
    else delete reactions[emoji];

    await message.update({ reactions });
    req.app.get('io')?.to(`conv:${message.conversationId}`).emit('message:reactions', {
      messageId: message.id,
      reactions,
    });
    res.json({ data: reactions });
  } catch (error) {
    res.status(500).json({ message: 'Reaction could not be updated.' });
  }
};

exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    const userId = req.user.id;
    if (!q || q.trim().length < 2) return res.json({ data: [] });

    const query = `%${q.trim()}%`;
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: userId },
        isActive: true,
        [Op.or]: [
          { firstName: { [Op.like]: query } },
          { lastName: { [Op.like]: query } },
          { email: { [Op.like]: query } },
          { institution: { [Op.like]: query } },
        ],
      },
      attributes: userAttributes,
      limit: 12,
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });

    res.json({ data: users.map(safeUser) });
  } catch (error) {
    console.error('[chatController.searchUsers]', error);
    res.status(500).json({ message: 'Search failed.' });
  }
};
