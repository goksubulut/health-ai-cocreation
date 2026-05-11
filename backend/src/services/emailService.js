const nodemailer = require('nodemailer');
const env = require('../config/env');

/** Caps long hangs when SMTP host/port is wrong or blocked (default nodemailer ~2m). */
const smtpConnectionTimeoutMs = (() => {
  const raw = parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS, 10);
  const n = Number.isFinite(raw) && raw > 0 ? raw : 15000;
  return Math.min(Math.max(n, 3000), 120000);
})();

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
  connectionTimeout: smtpConnectionTimeoutMs,
  socketTimeout: smtpConnectionTimeoutMs,
});

const send = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
    return true;
  } catch (err) {
    console.error('[emailService] SMTP send failed:', err?.message || err);
    return false;
  }
};

/**
 * Queue outbound mail so HTTP handlers return immediately (Render/Railway SMTP latency).
 * @param {string} label
 * @param {Promise<unknown>} mailPromise
 */
function runEmailInBackground(label, mailPromise) {
  void Promise.resolve(mailPromise).catch((err) => {
    console.error(`[emailService] async "${label}":`, err?.message || err);
  });
}

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const formatDateTime = (d) => {
  if (!d) return '';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return '';
  return dt.toISOString();
};

const sendVerificationEmail = async (user, token) => {
  const url = `${env.frontendUrl}/verify-email/${token}`;
  const ok = await send({
    to: user.email,
    subject: 'Verify your HEALTH AI account',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:22px;font-weight:700;color:#58a6ff;margin-bottom:8px">HEALTH AI</div>
        <p style="margin:0 0 16px;line-height:1.6">Hi${user.firstName ? ` ${escapeHtml(user.firstName)}` : ''},</p>
        <p style="margin:0 0 24px;line-height:1.6">Please confirm your email address to activate your account.</p>
        <a href="${url}" style="
          display:inline-block;background:#238636;color:#fff;
          padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600
        ">Verify email</a>
        <p style="color:#8b949e;font-size:13px;margin-top:24px;line-height:1.6">
          This link expires in 6 hours. If you did not create an account, you can ignore this message.
        </p>
      </div>
    `,
  });
  if (!ok && env.nodeEnv === 'development') {
    const apiDirect = `${env.apiPublicUrl}/api/auth/verify-email/${token}`;
    console.warn('[emailService] DEV — gönderici SMTP (SMTP_*) kurumsal/Gmail uygulama şifresi ile ayarlanmalı; alıcı adresi (@student.cankaya.edu.tr vb.) farklı olabilir.');
    console.warn('[emailService] DEV — arayüz doğrulama (Vite çalışıyorsa):', url);
    console.warn('[emailService] DEV — doğrudan API (tarayıcıda JSON görünür, doğrulama yine işlenir):', apiDirect);
  }
  return ok;
};

const sendPasswordResetEmail = async (user, token) => {
  const url = `${env.frontendUrl}/reset-password/${token}`;
  const ok = await send({
    to: user.email,
    subject: 'Reset your HEALTH AI password',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:22px;font-weight:700;color:#58a6ff;margin-bottom:8px">HEALTH AI</div>
        <p style="margin:0 0 16px;line-height:1.6">Hi${user.firstName ? ` ${escapeHtml(user.firstName)}` : ''},</p>
        <p style="margin:0 0 24px;line-height:1.6">We received a request to reset your password.</p>
        <a href="${url}" style="
          display:inline-block;background:#da3633;color:#fff;
          padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600
        ">Reset password</a>
        <p style="color:#8b949e;font-size:13px;margin-top:24px;line-height:1.6">
          This link expires in 1 hour. If you did not request a reset, you can ignore this message.
        </p>
      </div>
    `,
  });
  if (!ok && env.nodeEnv === 'development') {
    console.warn('[emailService] DEV — şifre sıfırlama e-postası gönderilemedi; link:\n  ', url);
  }
  return ok;
};

const userDisplayName = (u) => {
  if (!u) return 'Someone';
  const fn = u.firstName || u.first_name;
  const ln = u.lastName || u.last_name;
  if (fn || ln) return `${fn || ''} ${ln || ''}`.trim();
  return u.email || 'Someone';
};

/** @param {object} postOwner User with email */
/** @param {object} requester User */
/** @param {object} post Post */
const sendMeetingRequestNotification = (postOwner, requester, post) => {
  const title = post.title || post.get?.('title');
  return send({
    to: postOwner.email,
    subject: 'HEALTH AI — New meeting request',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
        <p style="margin:0 0 12px;line-height:1.6"><strong>${escapeHtml(userDisplayName(requester))}</strong> requested a meeting about your post:</p>
        <p style="margin:0 0 16px;font-weight:600">${escapeHtml(title)}</p>
        <p style="color:#8b949e;font-size:13px">Sign in to review and respond.</p>
      </div>
    `,
  });
};

const sendMeetingAcceptedNotification = (requester, post) => {
  const title = post.title || post.get?.('title');
  return send({
    to: requester.email,
    subject: 'HEALTH AI — Meeting request accepted',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
        <p style="margin:0 0 12px;line-height:1.6">Your meeting request was <strong>accepted</strong> for:</p>
        <p style="margin:0 0 16px;font-weight:600">${escapeHtml(title)}</p>
        <p style="color:#8b949e;font-size:13px">Propose time slots to schedule the meeting.</p>
      </div>
    `,
  });
};

const sendMeetingDeclinedNotification = (requester, post) => {
  const title = post.title || post.get?.('title');
  return send({
    to: requester.email,
    subject: 'HEALTH AI — Meeting request declined',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
        <p style="margin:0 0 12px;line-height:1.6">Your meeting request was <strong>declined</strong> for:</p>
        <p style="margin:0;font-weight:600">${escapeHtml(title)}</p>
      </div>
    `,
  });
};

const sendSlotProposedNotification = (recipient, meetingRequest, slots) => {
  const rows = (slots || [])
    .map((s) => {
      const dt = s.slotDatetime || s.slot_datetime;
      return `<li style="margin:6px 0">${escapeHtml(formatDateTime(dt))}</li>`;
    })
    .join('');
  return send({
    to: recipient.email,
    subject: 'HEALTH AI — Meeting time slots proposed',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
        <p style="margin:0 0 12px;line-height:1.6">New time slot(s) were proposed for meeting request #${meetingRequest.id}.</p>
        <ul style="margin:0;padding-left:20px;color:#e8edf5">${rows}</ul>
        <p style="color:#8b949e;font-size:13px;margin-top:16px">Sign in to confirm one slot.</p>
      </div>
    `,
  });
};

const sendMeetingScheduledNotification = (requester, postOwner, confirmedSlot, post) => {
  const title = post.title || post.get?.('title');
  const when = formatDateTime(confirmedSlot);
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
      <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
      <p style="margin:0 0 12px;line-height:1.6">Your meeting is <strong>scheduled</strong>.</p>
      <p style="margin:0 0 8px;font-weight:600">${escapeHtml(title)}</p>
      <p style="margin:0;color:#7ee787;font-size:15px"><strong>${escapeHtml(when)}</strong> (UTC)</p>
    </div>
  `;
  return Promise.all([
    send({ to: requester.email, subject: 'HEALTH AI — Meeting scheduled', html }),
    send({ to: postOwner.email, subject: 'HEALTH AI — Meeting scheduled', html }),
  ]);
};

const sendMeetingCancelledNotification = (recipient, meetingRequest) => {
  return send({
    to: recipient.email,
    subject: 'HEALTH AI — Meeting cancelled',
    html: `
      <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;background:#0d1117;color:#e8edf5;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.08)">
        <div style="font-size:20px;font-weight:700;color:#58a6ff;margin-bottom:12px">HEALTH AI</div>
        <p style="margin:0;line-height:1.6">Meeting request #${meetingRequest.id} has been <strong>cancelled</strong>.</p>
      </div>
    `,
  });
};

module.exports = {
  runEmailInBackground,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendMeetingRequestNotification,
  sendMeetingAcceptedNotification,
  sendMeetingDeclinedNotification,
  sendSlotProposedNotification,
  sendMeetingScheduledNotification,
  sendMeetingCancelledNotification,
};
