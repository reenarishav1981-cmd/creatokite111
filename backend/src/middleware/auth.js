const jwt  = require('jsonwebtoken');
const { User } = require('../models');

/* ── Token extractor — cookie FIRST, then Bearer ─────────── */
const extractToken = (req) => {
  // 1. httpOnly cookie (production secure)
  if (req.cookies?.ck_token) return req.cookies.ck_token;
  // 2. Authorization header (fallback for dev/mobile)
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.split(' ')[1];
  return null;
};

/* ── Main auth middleware ─────────────────────────────────── */
async function auth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required.', code: 'NO_TOKEN' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Session expired.', code: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ success: false, message: 'Invalid token.', code: 'TOKEN_INVALID' });
    }

    const user = await User.findById(decoded.id).select('-password -refreshToken');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Account not found.', code: 'USER_NOT_FOUND' });
    }
    if (user.isBanned) {
      return res.status(403).json({ success: false, message: `Account suspended: ${user.banReason || 'Policy violation'}`, code: 'BANNED' });
    }

    req.user = user;
    next();
  } catch (e) {
    console.error('[Auth Error]', e.message);
    res.status(500).json({ success: false, message: 'Authentication error.' });
  }
}

/* ── Role guards ──────────────────────────────────────────── */
const adminOnly   = (req, res, next) => req.user?.role === 'admin'   ? next() : res.status(403).json({ success: false, message: 'Admin access required.' });
const brandOnly   = (req, res, next) => req.user?.role === 'brand'   ? next() : res.status(403).json({ success: false, message: 'Brand access required.' });
const creatorOnly = (req, res, next) => req.user?.role === 'creator' ? next() : res.status(403).json({ success: false, message: 'Creator access required.' });

/* ── Cookie setter helper (used in auth routes) ───────────── */
const setAuthCookies = (res, token, refreshToken) => {
  const isProd = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'strict' : 'lax',
    path:     '/',
  };
  res.cookie('ck_token',   token,        { ...cookieOpts, maxAge: 7  * 24 * 60 * 60 * 1000 }); // 7d
  res.cookie('ck_refresh', refreshToken, { ...cookieOpts, maxAge: 30 * 24 * 60 * 60 * 1000 }); // 30d
};

const clearAuthCookies = (res) => {
  res.clearCookie('ck_token',   { httpOnly: true, path: '/' });
  res.clearCookie('ck_refresh', { httpOnly: true, path: '/' });
};

module.exports = { auth, adminOnly, brandOnly, creatorOnly, setAuthCookies, clearAuthCookies };
