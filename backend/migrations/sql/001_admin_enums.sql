-- Run once against MySQL after deploying model changes (posts.status + activity_logs.action_type).
-- Backup your database before running.

ALTER TABLE `posts`
  MODIFY COLUMN `status` ENUM(
    'draft',
    'active',
    'meeting_scheduled',
    'partner_found',
    'expired',
    'removed_by_admin'
  ) NOT NULL DEFAULT 'draft';

ALTER TABLE `activity_logs`
  MODIFY COLUMN `action_type` ENUM(
    'LOGIN',
    'FAILED_LOGIN',
    'LOGOUT',
    'REGISTER',
    'EMAIL_VERIFIED',
    'PASSWORD_RESET',
    'POST_CREATE',
    'POST_CLOSE',
    'POST_ADMIN_REMOVE',
    'MEETING_REQUEST',
    'MEETING_ACCEPT',
    'MEETING_DECLINE',
    'SLOT_CONFIRMED',
    'MEETING_CANCEL',
    'ACCOUNT_SUSPEND',
    'ACCOUNT_REACTIVATE'
  ) NOT NULL;
