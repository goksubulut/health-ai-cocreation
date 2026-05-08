const User = require('./User');
const Post = require('./Post');
const MeetingRequest = require('./MeetingRequest');
const TimeSlot = require('./TimeSlot');
const NdaAcceptance = require('./NdaAcceptance');
const ActivityLog = require('./ActivityLog');
const Bookmark = require('./Bookmark');
const Notification = require('./Notification');
const Conversation = require('./Conversation');
const ConversationParticipant = require('./ConversationParticipant');
const Message = require('./Message');
const MessageReadReceipt = require('./MessageReadReceipt');

// ── İlişkiler ──────────────────────────────────────────────

// User → Posts (1:N)
User.hasMany(Post, { foreignKey: 'userId', as: 'posts' });
Post.belongsTo(User, { foreignKey: 'userId', as: 'owner' });

// Post → MeetingRequests (1:N)
Post.hasMany(MeetingRequest, { foreignKey: 'postId', as: 'meetingRequests' });
MeetingRequest.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User → MeetingRequests (talep eden)
User.hasMany(MeetingRequest, { foreignKey: 'requesterId', as: 'sentRequests' });
MeetingRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });

// User → MeetingRequests (post sahibi)
User.hasMany(MeetingRequest, { foreignKey: 'postOwnerId', as: 'receivedRequests' });
MeetingRequest.belongsTo(User, { foreignKey: 'postOwnerId', as: 'postOwner' });

// MeetingRequest → TimeSlots
MeetingRequest.hasMany(TimeSlot, { foreignKey: 'meetingRequestId', as: 'timeSlots' });
TimeSlot.belongsTo(MeetingRequest, { foreignKey: 'meetingRequestId', as: 'meetingRequest' });
User.hasMany(TimeSlot, { foreignKey: 'proposedBy', as: 'proposedTimeSlots' });
TimeSlot.belongsTo(User, { foreignKey: 'proposedBy', as: 'proposer' });

// User → NdaAcceptances
User.hasMany(NdaAcceptance, { foreignKey: 'userId', as: 'ndaAcceptances' });
NdaAcceptance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post → NdaAcceptances
Post.hasMany(NdaAcceptance, { foreignKey: 'postId', as: 'ndaAcceptances' });
NdaAcceptance.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User → ActivityLogs
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User → Bookmarks (M:N aracı Bookmark)
User.hasMany(Bookmark, { foreignKey: 'userId', as: 'bookmarks' });
Bookmark.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Post.hasMany(Bookmark, { foreignKey: 'postId', as: 'bookmarks' });
Bookmark.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User → Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// ── Chat İlişkileri ────────────────────────────────────────

// User ↔ Conversation (M:N through ConversationParticipant)
User.belongsToMany(Conversation, {
  through: ConversationParticipant,
  foreignKey: 'userId',
  otherKey: 'conversationId',
  as: 'conversations',
});
Conversation.belongsToMany(User, {
  through: ConversationParticipant,
  foreignKey: 'conversationId',
  otherKey: 'userId',
  as: 'participants',
});

// ConversationParticipant direkt ilişkiler
Conversation.hasMany(ConversationParticipant, { foreignKey: 'conversationId', as: 'participantRecords' });
ConversationParticipant.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
User.hasMany(ConversationParticipant, { foreignKey: 'userId', as: 'participantRecords' });
ConversationParticipant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Conversation → Messages (1:N)
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });

// User → Messages (gönderici)
User.hasMany(Message, { foreignKey: 'senderId', as: 'sentMessages' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });

// Message → Message (reply-to self-join)
Message.belongsTo(Message, { foreignKey: 'replyToId', as: 'replyTo' });
Message.hasMany(Message, { foreignKey: 'replyToId', as: 'replies' });

// Message → ReadReceipts (1:N)
Message.hasMany(MessageReadReceipt, { foreignKey: 'messageId', as: 'readReceipts' });
MessageReadReceipt.belongsTo(Message, { foreignKey: 'messageId', as: 'message' });
User.hasMany(MessageReadReceipt, { foreignKey: 'userId', as: 'readReceipts' });
MessageReadReceipt.belongsTo(User, { foreignKey: 'userId', as: 'reader' });

// Conversation → Creator
User.hasMany(Conversation, { foreignKey: 'createdBy', as: 'createdConversations' });
Conversation.belongsTo(User, { foreignKey: 'createdBy', as: 'creator' });

module.exports = {
  User, Post, MeetingRequest, TimeSlot, NdaAcceptance, ActivityLog, Bookmark, Notification,
  Conversation, ConversationParticipant, Message, MessageReadReceipt,
};
