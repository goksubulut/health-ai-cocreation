const env = require('./env');

function normalizeOrigin(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
}

/** FRONTEND_URL + virgülle ayrılmış ek kökenler (Railway/Render ayrı URL vb.) */
function buildAllowedOrigins() {
  const fromEnv =
    process.env.CORS_ORIGINS ||
    process.env.ALLOWED_ORIGINS ||
    '';
  const extra = fromEnv
    .split(',')
    .map((s) => normalizeOrigin(s))
    .filter(Boolean);
  const primary = normalizeOrigin(env.frontendUrl);
  const set = new Set([primary, ...extra].filter(Boolean));
  return set;
}

const allowedOriginsSet = buildAllowedOrigins();

/** Socket.IO ile aynı köken listesi */
function getAllowedOrigins() {
  return Array.from(allowedOriginsSet);
}

const corsOptions = {
  origin: (origin, callback) => {
    // Postman, curl, sunucudan sunucuya: Origin yok
    if (!origin) {
      callback(null, true);
      return;
    }
    const normalized = normalizeOrigin(origin);
    if (allowedOriginsSet.has(normalized)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS: ${origin} adresine izin verilmiyor.`));
  },
  credentials: true, // Cookie/Authorization header'ı için
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

corsOptions.getAllowedOrigins = getAllowedOrigins;

module.exports = corsOptions;
