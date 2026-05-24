const rateLimit   = require('express-rate-limit');
const helmet      = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');

/* ── Helmet — full hardened headers ───────────────────────── */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
      styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:     ["'self'", 'https://fonts.gstatic.com'],
      imgSrc:      ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc:  ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      frameSrc:    ["'none'"],
      objectSrc:   ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  hsts: {
    maxAge: 31536000,       // 1 year
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
});

/* ── Rate limiters ────────────────────────────────────────── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Try again in 15 minutes.' },
  skip: (req) => req.path === '/health',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' },
  skipSuccessfulRequests: true,
});

const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many attempts. Try again in 1 hour.' },
});

/* ── Mongo sanitize — prevent NoSQL injection ─────────────── */
const sanitize = mongoSanitize({ replaceWith: '_', onSanitize: ({ req, key }) => {
  console.warn(`[Security] Sanitized key "${key}" from ${req.ip}`);
}});

/* ── XSS clean — manual, no external dep needed ──────────── */
const xssClean = (req, _res, next) => {
  const clean = (val) => {
    if (typeof val !== 'string') return val;
    return val
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  };
  const deepClean = (obj) => {
    if (!obj || typeof obj !== 'object') return;
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'string') obj[key] = clean(obj[key]);
      else if (typeof obj[key] === 'object') deepClean(obj[key]);
    }
  };
  deepClean(req.body);
  deepClean(req.query);
  next();
};

/* ── HTTP → HTTPS redirect (production only) ──────────────── */
const httpsRedirect = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') return next();
  if (req.headers['x-forwarded-proto'] === 'https') return next();
  return res.redirect(301, `https://${req.headers.host}${req.url}`);
};

/* ── Security response headers ────────────────────────────── */
const secureHeaders = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }
  next();
};

module.exports = {
  helmetConfig,
  globalLimiter,
  authLimiter,
  strictLimiter,
  sanitize,
  xssClean,
  httpsRedirect,
  secureHeaders,
};
