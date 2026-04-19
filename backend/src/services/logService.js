const crypto = require('crypto');
const { ActivityLog } = require('../models');

/**
 * IP adresini SHA-256 ile hash'le (ham IP saklanmaz — GDPR).
 */
const hashIp = (ip) => {
  if (!ip) return null;
  return crypto.createHash('sha256').update(ip).digest('hex');
};

/**
 * Kritik bir olayı logla.
 * @param {object} params
 * @param {number|null} params.userId
 * @param {string|null} params.role
 * @param {'LOGIN'|'FAILED_LOGIN'|'LOGOUT'|'REGISTER'|'EMAIL_VERIFIED'|'PASSWORD_RESET'|'POST_CREATE'|'POST_CLOSE'|'POST_ADMIN_REMOVE'|'MEETING_REQUEST'|'MEETING_ACCEPT'|'MEETING_DECLINE'|'SLOT_CONFIRMED'|'MEETING_CANCEL'|'ACCOUNT_SUSPEND'|'ACCOUNT_REACTIVATE'} params.actionType
 * @param {string|null} params.targetEntity
 * @param {number|null} params.targetId
 * @param {'success'|'failure'} params.resultStatus
 * @param {string|null} params.ip
 */
const logActivity = async ({ userId, role, actionType, targetEntity, targetId, resultStatus = 'success', ip }) => {
  try {
    await ActivityLog.create({
      userId: userId || null,
      role: role || null,
      actionType,
      targetEntity: targetEntity || null,
      targetId: targetId || null,
      resultStatus,
      ipHash: hashIp(ip),
    });
  } catch (err) {
    // Loglama hatası uygulamayı durdurmamalı
    console.error('Aktivite logu yazılamadı:', err.message);
  }
};

module.exports = { logActivity, hashIp };
