const User = require('./User');
const Post = require('./Post');
const MeetingRequest = require('./MeetingRequest');
const NdaAcceptance = require('./NdaAcceptance');
const ActivityLog = require('./ActivityLog');

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

// User → NdaAcceptances
User.hasMany(NdaAcceptance, { foreignKey: 'userId', as: 'ndaAcceptances' });
NdaAcceptance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Post → NdaAcceptances
Post.hasMany(NdaAcceptance, { foreignKey: 'postId', as: 'ndaAcceptances' });
NdaAcceptance.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

// User → ActivityLogs
User.hasMany(ActivityLog, { foreignKey: 'userId', as: 'activityLogs' });
ActivityLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { User, Post, MeetingRequest, NdaAcceptance, ActivityLog };
