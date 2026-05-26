// ─────────────────────────────────────────────────────────
// routes/analytics.js  —  Analytics + Creator Social Connect
// ─────────────────────────────────────────────────────────
const express = require('express');
const { Campaign, User, Notification } = require('../models');
const { auth } = require('../middleware/auth');
const { computeScore, getRank, computeCAS } = require('../services/scoring');
const { fetchSocialData } = require('../services/socialFetcher');

const router = express.Router();
router.use(auth);

/* ── GET /api/analytics/brand ────────────────────────── */
router.get('/brand', async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand only' });
    const campaigns = await Campaign.find({ brand:req.user._id });
    const totalSpent = campaigns.reduce((s,c)=>s+c.budget,0);
    const active = campaigns.filter(c=>['in_progress','creators_assigned'].includes(c.workflowStatus)).length;
    const completed = campaigns.filter(c=>c.workflowStatus==='completed').length;
    const totalCreators = campaigns.reduce((s,c)=>s+(c.assignedCreators?.length||0),0);
    const nicheMap = {};
    campaigns.forEach(c=>{ nicheMap[c.niche]=(nicheMap[c.niche]||0)+1; });
    const nicheBreakdown = Object.entries(nicheMap).map(([niche,count])=>({ niche,count })).sort((a,b)=>b.count-a.count);
    const trend = [];
    for (let i=5;i>=0;i--) {
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const m=d.toLocaleString('default',{month:'short'});
      const count=campaigns.filter(c=>{const cd=new Date(c.createdAt);return cd.getMonth()===d.getMonth()&&cd.getFullYear()===d.getFullYear();}).length;
      trend.push({ month:m, campaigns:count });
    }
    res.json({ success:true, stats:{ totalCampaigns:campaigns.length,active,completed,totalSpent,totalCreators }, nicheBreakdown, trend });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── GET /api/analytics/creator ─────────────────────── */
router.get('/creator', async (req, res) => {
  try {
    if (req.user.role!=='creator') return res.status(403).json({ success:false, message:'Creators only' });
    const campaigns = await Campaign.find({ 'assignedCreators.creator':req.user._id });
    const myData = campaigns.map(c=>({
      title:c.title, niche:c.niche, budget:c.budget, workflowStatus:c.workflowStatus,
      assignment:c.assignedCreators.find(a=>a.creator?.toString()===req.user._id.toString()),
    }));
    const completed = myData.filter(c=>['approved','completed'].includes(c.assignment?.status));
    const earned = completed.reduce((s,c)=>s+(c.assignment?.paymentAlloc||0),0);
    const pending = myData.filter(c=>['assigned','accepted','in_progress','submitted'].includes(c.assignment?.status));
    const trend = [];
    for (let i=5;i>=0;i--) {
      const d=new Date(); d.setMonth(d.getMonth()-i);
      const m=d.toLocaleString('default',{month:'short'});
      const count=campaigns.filter(c=>{const cd=new Date(c.createdAt);return cd.getMonth()===d.getMonth()&&cd.getFullYear()===d.getFullYear();}).length;
      trend.push({ month:m, assignments:count });
    }
    res.json({ success:true, stats:{ total:campaigns.length, completed:completed.length,
      pending:pending.length, earned, successRate:campaigns.length?Math.round((completed.length/campaigns.length)*100):100 },
      campaigns:myData, trend });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── POST /api/analytics/creator/connect ─────────────── */
/* Creator submits social URLs → system auto-fetches data, calculates CAS, saves, submits for admin approval */
router.post('/creator/connect', async (req, res) => {
  try {
    if (req.user.role!=='creator')
      return res.status(403).json({ success:false, message:'Creators only' });

    const { instagramUrl='', youtubeUrl='' } = req.body;
    if (!instagramUrl && !youtubeUrl)
      return res.status(400).json({ success:false, message:'Provide at least one social URL.' });

    // 1. Fetch live social data
    const { igData, ytData } = await fetchSocialData(instagramUrl||null, youtubeUrl||null);
    if (!igData && !ytData)
      return res.status(502).json({ success:false, message:'Could not fetch data. Check URLs and try again.' });

    // 2. Compute CAS score
    const niche = req.user.niche || '';
    const casResult = computeCAS({ igData, ytData, niche });

    // 3. Update platform follower counts from real data (feeds existing score engine)
    const platformUpdate = {};
    if (igData) {
      const igER = igData.er || 0;
      platformUpdate['platforms.instagram.followers']  = igData.followers;
      platformUpdate['platforms.instagram.engagement'] = parseFloat(igER.toFixed(2));
    }
    if (ytData) {
      const ytER = ytData.er || 0;
      platformUpdate['platforms.youtube.followers']  = ytData.followers;
      platformUpdate['platforms.youtube.engagement'] = parseFloat(ytER.toFixed(2));
    }

    // 4. Compute updated 1000-pt score using new platform data
    const userCopy = req.user.toObject();
    if (igData) { userCopy.platforms.instagram.followers=igData.followers; userCopy.platforms.instagram.engagement=igData.er||0; }
    if (ytData) { userCopy.platforms.youtube.followers=ytData.followers;   userCopy.platforms.youtube.engagement=ytData.er||0;   }
    const { total, dna } = computeScore(userCopy);
    const rank = getRank(total);

    // 5. Persist everything
    await User.findByIdAndUpdate(req.user._id, {
      ...platformUpdate,
      'socialUrls.instagram': instagramUrl,
      'socialUrls.youtube':   youtubeUrl,
      casScore:      casResult.cas,
      casBreakdown:  casResult.scores,
      casRisk:       casResult.riskLevel,
      casBadge:      casResult.badge,
      socialAnalyzed:true,
      analyzedAt:    new Date(),
      // Auto-approve elite creators; otherwise set to pending
      verificationStatus: casResult.autoApprove ? 'approved' : 'pending',
      isVerified:    casResult.autoApprove ? true : req.user.isVerified,
      creatorScore:  total,
      dna,
      rank,
    });

    // 6. Notify admins if not auto-approved
    if (!casResult.autoApprove) {
      const admins = await User.find({ role:'admin' }).select('_id');
      await Promise.all(admins.map(a =>
        Notification.create({ user:a._id, type:'creator_approval',
          title:'🆕 Creator Pending Approval', body:`${req.user.displayName} submitted for verification. CAS: ${casResult.cas}/100, Risk: ${casResult.riskLevel}`,
          link:'/admin/creator-approval' })
      ));
    }

    return res.json({
      success: true,
      cas:        casResult.cas,
      scores:     casResult.scores,
      riskLevel:  casResult.riskLevel,
      badge:      casResult.badge,
      autoApprove:casResult.autoApprove,
      creatorScore: total,
      rank,
      igData,
      ytData,
      message: casResult.autoApprove
        ? '🎉 Auto-approved! Your CAS score qualifies you for immediate access.'
        : '✅ Analysis done! Your profile is pending admin review.',
    });
  } catch(e) {
    console.error('[Creator Connect]', e);
    res.status(500).json({ success:false, message:e.message||'Analysis failed' });
  }
});

/* ── GET /api/analytics/creator/cas ─────────────────── */
/* Creator fetches their own CAS data */
router.get('/creator/cas', async (req, res) => {
  try {
    if (req.user.role!=='creator') return res.status(403).json({ success:false, message:'Creators only' });
    const user = await User.findById(req.user._id).select('casScore casBreakdown casRisk casBadge socialAnalyzed analyzedAt verificationStatus socialUrls creatorScore rank platforms');
    return res.json({ success:true, ...user.toObject() });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
