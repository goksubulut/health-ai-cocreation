/**
 * Socket.IO Chat Service
 * ──────────────────────
 * Tüm real-time mantığı burada toplanır.
 * server.js tarafından başlatılır: initSocket(httpServer)
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const corsOptions = require('../config/corsOptions');
const {
  Conversation,
  ConversationParticipant,
  Message,
  MessageReadReceipt,
  User,
} = require('../models');

const senderAttributes = ['id', 'firstName', 'lastName', 'role', 'email'];

// Online kullanıcıları in-memory tut: { userId -> Set<socketId> }
const onlineUsers = new Map();

function addOnline(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeOnline(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}

function isOnline(userId) {
  return onlineUsers.has(userId) && onlineUsers.get(userId).size > 0;
}

// Konuşma odası adı
const roomName = (convId) => `conv:${convId}`;
const userRoom = (userId) => `user:${userId}`;

function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (corsOptions.matchesAllowedOrigin(origin)) cb(null, true);
        else cb(null, false);
      },
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Long-polling fallback otomatik devrede
    transports: ['websocket', 'polling'],
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // ── Auth middleware ──────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('TOKEN_MISSING'));
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      socket.userEmail = decoded.email;
      next();
    } catch {
      next(new Error('TOKEN_INVALID'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.userId;
    addOnline(userId, socket.id);

    // Kullanıcı kendi odasına katıl (DM bildirimleri için)
    socket.join(userRoom(userId));

    // Kullanıcının tüm aktif konuşma odalarına otomatik katıl
    try {
      const participations = await ConversationParticipant.findAll({
        where: { userId, leftAt: null },
        attributes: ['conversationId'],
      });
      participations.forEach((p) => socket.join(roomName(p.conversationId)));
    } catch (e) {
      console.error('[socket] Oda katılımı hatası:', e.message);
    }

    // Online durumunu ilgili konuşmalara broadcast et
    socket.broadcast.emit('user:online', { userId });

    // ── Mesaj gönder ───────────────────────────────────────
    socket.on('message:send', async (data, ack) => {
      try {
        const { conversationId, content, type = 'text', replyToId, tempId } = data;

        // Üyelik kontrolü
        const participant = await ConversationParticipant.findOne({
          where: { conversationId, userId, leftAt: null },
        });
        if (!participant) return ack?.({ error: 'Erişim yok.' });

        // Mesaj kaydet
        const message = await Message.create({
          conversationId,
          senderId: userId,
          type,
          content: (content || '').trim(),
          replyToId: replyToId || null,
        });

        // Conversation güncelle
        await Conversation.update(
          {
            lastMessageAt: message.createdAt,
            lastMessagePreview: (content || '').slice(0, 120),
          },
          { where: { id: conversationId } }
        );

        // Gönderici için lastReadAt güncelle
        await participant.update({ lastReadAt: message.createdAt });

        // Tam mesajı yükle (sender bilgisi dahil)
        const full = await Message.findByPk(message.id, {
          include: [
            {
              model: User,
              as: 'sender',
              attributes: senderAttributes,
            },
            {
              model: Message,
              as: 'replyTo',
              attributes: ['id', 'content', 'type'],
              include: [{ model: User, as: 'sender', attributes: ['id', 'firstName', 'lastName'] }],
            },
          ],
        });

        const payload = { ...full.toJSON(), tempId };

        // Odadaki herkese gönder
        io.to(roomName(conversationId)).emit('message:new', payload);

        // ACK gönderana
        ack?.({ ok: true, message: payload });
      } catch (err) {
        console.error('[socket] message:send hatası:', err.message);
        ack?.({ error: 'Mesaj gönderilemedi.' });
      }
    });

    // ── Typing indicator ───────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(roomName(conversationId)).emit('typing:start', {
        userId,
        conversationId,
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(roomName(conversationId)).emit('typing:stop', {
        userId,
        conversationId,
      });
    });

    // ── Read receipt ───────────────────────────────────────
    socket.on('message:read', async ({ conversationId, messageId }) => {
      try {
        // Üyelik var mı?
        const participant = await ConversationParticipant.findOne({
          where: { conversationId, userId, leftAt: null },
        });
        if (!participant) return;

        // Upsert read receipt
        await MessageReadReceipt.upsert({ messageId, userId, readAt: new Date() });
        await participant.update({ lastReadAt: new Date() });

        // Odaya bildir
        socket.to(roomName(conversationId)).emit('message:read', {
          messageId,
          userId,
          readAt: new Date(),
        });
      } catch (e) {
        console.error('[socket] message:read hatası:', e.message);
      }
    });

    // ── Reaction toggle ────────────────────────────────────
    socket.on('message:react', async ({ messageId, emoji }, ack) => {
      try {
        const message = await Message.findByPk(messageId);
        if (!message) return ack?.({ error: 'Mesaj bulunamadı.' });

        const reactions = message.reactions || {};
        if (!reactions[emoji]) reactions[emoji] = [];
        const idx = reactions[emoji].indexOf(userId);
        if (idx === -1) reactions[emoji].push(userId);
        else {
          reactions[emoji].splice(idx, 1);
          if (reactions[emoji].length === 0) delete reactions[emoji];
        }

        await message.update({ reactions });

        io.to(roomName(message.conversationId)).emit('message:reactions', {
          messageId,
          reactions,
        });
        ack?.({ ok: true });
      } catch (e) {
        ack?.({ error: 'Reaksiyon güncellenemedi.' });
      }
    });

    // ── Konuşma odasına katıl (yeni konuşma açılınca) ─────
    socket.on('conversation:join', async ({ conversationId }) => {
      const participant = await ConversationParticipant.findOne({
        where: { conversationId, userId, leftAt: null },
      });
      if (participant) socket.join(roomName(conversationId));
    });

    // ── Disconnect ─────────────────────────────────────────
    socket.on('disconnect', () => {
      removeOnline(userId, socket.id);
      if (!isOnline(userId)) {
        socket.broadcast.emit('user:offline', { userId });
      }
    });
  });

  // Online kullanıcı listesini sorgulama endpoint'i için export
  io.getOnlineUsers = () => [...onlineUsers.keys()];

  return io;
}

module.exports = { initSocket };
