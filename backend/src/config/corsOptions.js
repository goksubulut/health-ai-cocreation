const env = require('./env');

function normalizeOrigin(url) {
  if (!url || typeof url !== 'string') return '';
  return url.trim().replace(/\/$/, '');
}

/** Railway panelinde bazen sadece host verilir / tam URL */
function railwayInjectedOrigins() {
  const out = [];
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (domain) {
    out.push(normalizeOrigin(`https://${domain}`));
    out.push(normalizeOrigin(`http://${domain}`));
  }
  const fullUrl =
    process.env.RAILWAY_STATIC_URL?.trim() ||
    process.env.RAILWAY_SERVICE_PUBLIC_URL?.trim() ||
    process.env.RAILWAY_SERVICE_URL?.trim();
  if (fullUrl) out.push(normalizeOrigin(fullUrl));
  return out;
}

/** FRONTEND_URL + virgülle ayrılmış ek kökenler + Railway otomatik domainleri */
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
  const set = new Set(
    [primary, ...extra, ...railwayInjectedOrigins()].filter(Boolean),
  );
  return set;
}

const allowedOriginsSet = buildAllowedOrigins();

if (process.env.NODE_ENV !== 'test') {
  console.log('[cors] İzinli kökenler:', [...allowedOriginsSet].join(', ') || '(yok)');
}

/** Socket.IO ile aynı köken listesi */
function getAllowedOrigins() {
  return Array.from(allowedOriginsSet);
}

function isRailwayHostedOrigin(origin) {
  if (process.env.CORS_ALLOW_RAILWAY !== 'true') return false;
  try {
    const u = new URL(origin);
    return (
      (u.protocol === 'https:' || u.protocol === 'http:') &&
      u.hostname.endsWith('.up.railway.app')
    );
  } catch {
    return false;
  }
}

/** Express + Socket.IO ortak kontrol */
function matchesAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOriginsSet.has(normalizeOrigin(origin))) return true;
  return isRailwayHostedOrigin(origin);
}

const corsOptions = {
  origin: (origin, callback) => {
    if (matchesAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS: ${origin} adresine izin verilmiyor.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

corsOptions.getAllowedOrigins = getAllowedOrigins;
corsOptions.matchesAllowedOrigin = matchesAllowedOrigin;

module.exports = corsOptions;
