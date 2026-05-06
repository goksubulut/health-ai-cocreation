const { Notification } = require('../models');

/**
 * Yeni bildirim oluştur.
 * @param {number} userId - Bildirimi alacak kullanıcı
 * @param {'meeting_request'|'meeting_accepted'|'meeting_declined'|'meeting_scheduled'|'slot_proposed'} type
 * @param {string} title
 * @param {string} [body]
 * @param {'meeting'|'post'} [refType]
 * @param {number} [refId]
 */
async function createNotification(userId, type, title, body = null, refType = null, refId = null) {
  try {
    await Notification.create({ userId, type, title, body, refType, refId });
  } catch (err) {
    console.error('Bildirim oluşturulamadı:', err);
  }
}

module.exports = { createNotification };
