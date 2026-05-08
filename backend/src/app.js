const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const corsOptions = require('./config/corsOptions');
const { generalLimiter } = require('./middleware/rateLimiter');

// Route importları
const authRoutes    = require('./routes/auth');
const postRoutes    = require('./routes/posts');
const meetingRoutes = require('./routes/meetings');
const userRoutes    = require('./routes/users');
const adminRoutes        = require('./routes/admin');
const bookmarkRoutes     = require('./routes/bookmarks');
const notificationRoutes = require('./routes/notifications');
const chatRoutes         = require('./routes/chat');

const app = express();

// ── Güvenlik başlıkları ───────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        connectSrc: ["'self'", 'data:', 'blob:', 'http:', 'https:', 'ws:', 'wss:'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
      },
    },
  })
);

// ── CORS ─────────────────────────────────────────────────────
app.use(cors(corsOptions));

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // İstek boyutunu sınırla
app.use(express.urlencoded({ extended: false }));

// ── Genel rate limiter ────────────────────────────────────────
app.use('/api', generalLimiter);

// ── Routes ────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/posts',    postRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/users',    userRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/bookmarks',     bookmarkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat',         chatRoutes);

// ── Sağlık kontrolü ───────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

const frontendDistPath = path.resolve(__dirname, '../../dist');
const frontendIndexPath = path.join(frontendDistPath, 'index.html');

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));

  app.get(/^\/(?!api|health).*/, (req, res) => {
    res.sendFile(frontendIndexPath);
  });
}

// ── 404 handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: 'İstenen kaynak bulunamadı.' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Sunucu hatası:', err);
  const status = err.status || 500;
  const message = process.env.NODE_ENV === 'production' ? 'Sunucu hatası.' : err.message;
  res.status(status).json({ message });
});

module.exports = app;
