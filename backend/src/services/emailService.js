const nodemailer = require('nodemailer');
const env = require('../config/env');

const transporter = nodemailer.createTransport({
  host: env.smtp.host,
  port: env.smtp.port,
  secure: env.smtp.port === 465,
  auth: {
    user: env.smtp.user,
    pass: env.smtp.pass,
  },
});

const send = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: env.smtp.from, to, subject, html });
  } catch (err) {
    console.error('Email gönderilemedi:', err.message);
    // Email hatası uygulamayı durdurmamalı
  }
};

const sendVerificationEmail = (to, token) => {
  const url = `${env.frontendUrl}/verify-email?token=${token}`;
  return send({
    to,
    subject: 'HEALTH AI — E-posta Adresinizi Doğrulayın',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a73e8">HEALTH AI</h2>
        <p>Kayıt işleminizi tamamlamak için aşağıdaki butona tıklayın:</p>
        <a href="${url}" style="
          display:inline-block;background:#1a73e8;color:#fff;
          padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold
        ">E-posta Adresimi Doğrula</a>
        <p style="color:#666;font-size:13px;margin-top:16px">
          Bu bağlantı 6 saat geçerlidir. Eğer kaydolmadıysanız bu emaili görmezden gelin.
        </p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = (to, token) => {
  const url = `${env.frontendUrl}/reset-password?token=${token}`;
  return send({
    to,
    subject: 'HEALTH AI — Şifre Sıfırlama',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a73e8">HEALTH AI</h2>
        <p>Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        <a href="${url}" style="
          display:inline-block;background:#e53935;color:#fff;
          padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold
        ">Şifremi Sıfırla</a>
        <p style="color:#666;font-size:13px;margin-top:16px">
          Bu bağlantı 1 saat geçerlidir. Şifre sıfırlama talebinde bulunmadıysanız bu emaili görmezden gelin.
        </p>
      </div>
    `,
  });
};

const sendMeetingRequestNotification = (to, requesterName, postTitle) => {
  return send({
    to,
    subject: 'HEALTH AI — Yeni Toplantı Talebi',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#1a73e8">HEALTH AI</h2>
        <p><strong>${requesterName}</strong> adlı kullanıcı <strong>"${postTitle}"</strong> ilanınıza toplantı talebinde bulundu.</p>
        <p>Platforma giriş yaparak talebi inceleyebilir ve yanıtlayabilirsiniz.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationEmail, sendPasswordResetEmail, sendMeetingRequestNotification };
