const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authenticate');
const {
  getConversations,
  createConversation,
  getMessages,
  sendMessage,
  markRead,
  deleteMessage,
  reactMessage,
  searchUsers,
} = require('../controllers/chatController');

// Tüm chat endpointleri auth gerektirir
router.use(authenticate);

// Konuşmalar
router.get('/conversations', getConversations);
router.post('/conversations', createConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);
router.patch('/conversations/:id/read', markRead);

// Mesaj işlemleri
router.delete('/messages/:msgId', deleteMessage);
router.patch('/messages/:msgId/react', reactMessage);

// Kullanıcı arama
router.get('/users/search', searchUsers);

module.exports = router;
