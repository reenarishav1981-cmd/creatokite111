const express = require('express');
const jwt     = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User, Notification }     = require('../models');
const { auth, setAuthCookies, clearAuthCookies } = require('../middleware/auth');
const { computeScore, getRank, computeCAS }       = require('../services/scoring');
const { fetchSocialData }                          = require('../services/socialFetcher');

const router    = express.Router();
const mkToken   = id => jwt.sign({ id }, process.env.JWT_SECRET,         { expiresIn: process.env.JWT_EXPIRES_IN        || '7d'  });
const mkRefresh = id => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' });

const sendAuth = (res, statusCode, user, token, refresh, extra = {}) => {
  // Set httpOnly secure cookies
  setAuthCookies(res, token, refresh);
  // Also return in body so frontend can read user data
  res.status(statusCode).json({
    success: true,
    token,               // still returned for non-browser clients / dev
    refreshToken: refresh,
    user: user.toPublicJSON ? user.toPublicJSON() : user,
    ...extra,
  });
};

/* ── POST /api/auth/register ────────────────────────────── */
router.post('/register', [
  body('displayName').trim().isLength({ min:2, max:60 }).escape(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min:6 }),
  body('role').optional().isIn(['creator','brand']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, errors:errors.array() });

    const {
      displayName, email, password, role='creator',
      niche='', companyName='', handle='',
      instagramUrl='', youtubeUrl='',
    } = req.body;

    if (await User.findOne({ email }))
      return res.status(409).json({ success:false, message:'Email already registered.' });
    if (handle && await User.findOne({ handle: handle.toLowerCase() }))
      return res.status(409).json({ success:false, message:'Handle taken.' });

    const user = new User({
      displayName, email, password, role,
      niche:       role==='creator' ? niche : '',
      companyName: role==='brand' ? (companyName||displayName) : '',
      handle:      handle ? handle.toLowerCase() : undefined,
    });

    if (role==='creator') {
      const { total, dna } = computeScore(user);
      user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    }

    const token=mkToken(user._id), refresh=mkRefresh(user._id);
    user.refreshToken=refresh;
    await user.save();

    let socialResult = null;
    if (role==='creator' && (instagramUrl || youtubeUrl)) {
      try {
        const { igData, ytData } = await fetchSocialData(instagramUrl||null, youtubeUrl||null);
        if (igData || ytData) {
          const casResult = computeCAS({ igData, ytData, niche });
          const platformUpdate = {};
          if (igData) { platformUpdate['platforms.instagram.followers']=igData.followers; platformUpdate['platforms.instagram.engagement']=igData.er||0; }
          if (ytData) { platformUpdate['platforms.youtube.followers']=ytData.subscribers||ytData.followers; platformUpdate['platforms.youtube.engagement']=ytData.er||0; }
          const userCopy = user.toObject();
          if (igData) { userCopy.platforms.instagram.followers=igData.followers; userCopy.platforms.instagram.engagement=igData.er||0; }
          if (ytData) { userCopy.platforms.youtube.followers=ytData.subscribers||ytData.followers; userCopy.platforms.youtube.engagement=ytData.er||0; }
          const { total:newTotal, dna:newDna } = computeScore(userCopy);
          await User.findByIdAndUpdate(user._id, {
            ...platformUpdate,
            'socialUrls.instagram': instagramUrl,
            'socialUrls.youtube':   youtubeUrl,
            casScore:casResult.cas, casBreakdown:casResult.scores,
            casRisk:casResult.riskLevel, casBadge:casResult.badge,
            socialAnalyzed:true, analyzedAt:new Date(),
            verificationStatus: casResult.autoApprove ? 'approved' : 'pending',
            isVerified:casResult.autoApprove, creatorScore:newTotal, dna:newDna, rank:getRank(newTotal),
          });
          if (!casResult.autoApprove) {
            const admins = await User.find({ role:'admin' }).select('_id');
            await Promise.all(admins.map(a =>
              Notification.create({ user:a._id, type:'creator_approval',
                title:'🆕 New Creator Needs Approval',
                body:`${displayName} registered. CAS: ${casResult.cas}/100`,
                link:'/admin/creator-approval' }).catch(()=>{})
            ));
          }
          socialResult = { cas:casResult.cas, badge:casResult.badge, riskLevel:casResult.riskLevel, autoApprove:casResult.autoApprove };
        }
      } catch(e) { console.error('[Register social]', e.message); }
    }

    const finalUser = await User.findById(user._id).select('-password -refreshToken');
    return sendAuth(res, 201, finalUser, token, refresh, { socialResult });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/auth/login ───────────────────────────────── */
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success:false, errors:errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ success:false, message:'Invalid email or password.' });
    if (user.isBanned)
      return res.status(403).json({ success:false, message:`Account suspended: ${user.banReason}` });

    const now=new Date(), last=user.lastLoginDate ? new Date(user.lastLoginDate) : null;
    if (last) {
      const diff=Math.floor((now-last)/86400000);
      user.streak = diff===1 ? (user.streak||0)+1 : diff>1 ? 1 : user.streak;
    } else user.streak=1;
    user.lastLoginDate=now;

    const token=mkToken(user._id), refresh=mkRefresh(user._id);
    user.refreshToken=refresh;
    await user.save({ validateBeforeSave:false });

    return sendAuth(res, 200, user, token, refresh);
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/auth/refresh ─────────────────────────────── */
router.post('/refresh', async (req, res) => {
  try {
    // Read from cookie first, then body
    const refreshToken = req.cookies?.ck_refresh || req.body?.refreshToken;
    if (!refreshToken) return res.status(401).json({ success:false, message:'No refresh token.', code:'NO_REFRESH' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user    = await User.findById(decoded.id).select('-password');
    if (!user || user.refreshToken !== refreshToken)
      return res.status(401).json({ success:false, message:'Invalid refresh token.' });

    const token=mkToken(user._id), newR=mkRefresh(user._id);
    user.refreshToken=newR;
    await user.save({ validateBeforeSave:false });

    return sendAuth(res, 200, user, token, newR);
  } catch(e) { res.status(401).json({ success:false, message:'Refresh failed.' }); }
});

/* ── POST /api/auth/logout ──────────────────────────────── */
router.post('/logout', auth, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken:'' });
    clearAuthCookies(res);
    res.json({ success:true, message:'Logged out.' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── GET /api/auth/me ───────────────────────────────────── */
router.get('/me', auth, (req, res) => {
  res.json({ success:true, user:req.user.toPublicJSON ? req.user.toPublicJSON() : req.user });
});

module.exports = router;
