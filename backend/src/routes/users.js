const express = require('express');
const { User, Notification, Campaign } = require('../models');
const { auth } = require('../middleware/auth');
const { computeScore, getRank } = require('../services/scoring');

const router = express.Router();

/* GET /api/users/leaderboard */
router.get('/leaderboard', async (req, res) => {
  try {
    const { niche, limit=20 } = req.query;
    const q = { role:'creator' };
    if (niche) q.niche=niche;
    const creators = await User.find(q)
      .select('displayName handle avatar niche rank level creatorScore platforms dna trustScore totalCampaigns completedCampaigns badges')
      .sort({ creatorScore:-1 }).limit(+limit);
    res.json({ success:true, creators });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/users/creators — public browse */
router.get('/creators', async (req, res) => {
  try {
    const { niche, platform, minScore=0, search, page=1, limit=12 } = req.query;
    const q = { role:'creator', isBanned:false, creatorScore:{ $gte:+minScore } };
    if (niche) q.niche=niche;
    if (search) q.$or=[{displayName:{$regex:search,$options:'i'}},{niche:{$regex:search,$options:'i'}}];
    const creators = await User.find(q)
      .select('displayName handle avatar niche rank level creatorScore platforms dna trustScore badges location')
      .sort({ creatorScore:-1 }).skip((+page-1)*+limit).limit(+limit);
    const total = await User.countDocuments(q);
    res.json({ success:true, creators, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/users/profile — own profile */
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PUT /api/users/profile — update own */
router.put('/profile', auth, async (req, res) => {
  try {
    const allowed = ['displayName','bio','location','website','avatar','niche','subNiches','companyName','industry','platforms'];
    const update = {};
    allowed.forEach(k => { if (req.body[k]!==undefined) update[k]=req.body[k]; });

    const user = await User.findById(req.user._id);
    Object.assign(user, update);

    // Profile completeness
    const fields = ['displayName','bio','location','avatar','website'];
    const extra = user.role==='creator' ? ['niche'] : ['companyName'];
    const filled = [...fields,...extra].filter(f=>user[f]&&user[f]!=='').length;
    user.profileComplete = Math.round((filled/(fields.length+extra.length))*100);

    if (user.role==='creator') {
      const { total, dna } = computeScore(user);
      user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    }

    await user.save({ validateBeforeSave:false });
    res.json({ success:true, user:user.toPublicJSON() });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/users/:handle — public profile */
router.get('/:handle', async (req, res) => {
  try {
    const user = await User.findOne({ handle:req.params.handle.toLowerCase(), isBanned:false })
      .select('displayName handle avatar bio location website niche subNiches platforms creatorScore rank level dna trustScore badges totalCampaigns completedCampaigns totalEarnings successRate isVerified role companyName industry');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/users/notifications/all */
router.get('/notifications/all', auth, async (req, res) => {
  try {
    const notifs = await Notification.find({ user:req.user._id })
      .sort({ createdAt:-1 }).limit(40);
    const unread = notifs.filter(n=>!n.read).length;
    res.json({ success:true, notifications:notifs, unread });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PUT /api/users/notifications/read */
router.put('/notifications/read', auth, async (req, res) => {
  try {
    await Notification.updateMany({ user:req.user._id, read:false }, { read:true });
    res.json({ success:true });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/users/analytics/creator */
router.get('/analytics/creator', auth, async (req, res) => {
  try {
    if (req.user.role!=='creator') return res.status(403).json({ success:false, message:'Creators only' });
    const campaigns = await Campaign.find({ 'assignedCreators.creator':req.user._id })
      .select('title budget workflowStatus assignedCreators createdAt niche');
    const myAssignments = campaigns.map(c=>({ ...c.toObject(), myAssignment:c.assignedCreators.find(a=>a.creator?.toString()===req.user._id.toString()) }));
    const completed = myAssignments.filter(c=>c.myAssignment?.status==='completed'||c.myAssignment?.status==='approved');
    const totalEarned = completed.reduce((s,c)=>s+(c.myAssignment?.paymentAlloc||0),0);
    res.json({ success:true, totalCampaigns:campaigns.length, completedCampaigns:completed.length,
      totalEarned, assignments:myAssignments });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
