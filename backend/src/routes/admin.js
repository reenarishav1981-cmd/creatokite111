const express = require('express');
const { Campaign, User, Notification, Transaction } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');
const { awardXP, computeScore, getRank } = require('../services/scoring');

const router = express.Router();
router.use(auth, adminOnly);

const notify = async (userId, type, title, body, link='') => {
  try { await Notification.create({ user:userId, type, title, body, link }); } catch(e){}
};

/* ── DASHBOARD ─────────────────────────────────────────── */
router.get('/dashboard', async (req, res) => {
  try {
    const [totalUsers,totalCreators,totalBrands,totalCampaigns,pendingCampaigns,activeCampaigns] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role:'creator' }),
      User.countDocuments({ role:'brand' }),
      Campaign.countDocuments(),
      Campaign.countDocuments({ workflowStatus:{ $in:['brand_submitted','admin_review'] } }),
      Campaign.countDocuments({ workflowStatus:{ $in:['in_progress','creators_assigned'] } }),
    ]);
    const recentCampaigns = await Campaign.find({ workflowStatus:{ $in:['brand_submitted','admin_review','creators_assigned','in_progress'] } })
      .populate('brand','displayName companyName avatar').sort({ createdAt:-1 }).limit(8);
    const recentUsers = await User.find().sort({ createdAt:-1 }).limit(8).select('displayName role niche createdAt avatar rank creatorScore');
    const txTotal = await Transaction.aggregate([{ $group:{ _id:null, total:{ $sum:'$amount' } } }]);
    res.json({ success:true, stats:{ totalUsers,totalCreators,totalBrands,totalCampaigns,pendingCampaigns,activeCampaigns,
      totalRevenue:txTotal[0]?.total||0 }, recentCampaigns, recentUsers });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── USERS ─────────────────────────────────────────────── */
router.get('/users', async (req, res) => {
  try {
    const { role, search, page=1, limit=20, sort='newest' } = req.query;
    const q = {};
    if (role)   q.role=role;
    if (search) q.$or=[{displayName:{$regex:search,$options:'i'}},{email:{$regex:search,$options:'i'}}];
    const sortMap = { newest:{createdAt:-1}, score:{creatorScore:-1}, name:{displayName:1} };
    const users = await User.find(q).select('-password -refreshToken')
      .sort(sortMap[sort]||sortMap.newest).skip((+page-1)*+limit).limit(+limit);
    const total = await User.countDocuments(q);
    res.json({ success:true, users, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    const campaigns = await Campaign.find({ 'assignedCreators.creator':user._id }).select('title budget workflowStatus deadline').limit(10);
    res.json({ success:true, user, campaigns });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.put('/users/:id', async (req, res) => {
  try {
    const allowed = ['isVerified','isBanned','banReason','role','niche','companyName','displayName'];
    const update = {};
    allowed.forEach(k => { if (req.body[k]!==undefined) update[k]=req.body[k]; });
    const user = await User.findByIdAndUpdate(req.params.id, update, { new:true }).select('-password -refreshToken');
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    res.json({ success:true, user });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/users/:id/recalculate', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success:false, message:'User not found' });
    const { total, dna } = computeScore(user);
    user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    await user.save({ validateBeforeSave:false });
    res.json({ success:true, score:total, rank:user.rank });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── CAMPAIGNS ─────────────────────────────────────────── */
router.get('/campaigns', async (req, res) => {
  try {
    const { status, workflowStatus, page=1, limit=15, search } = req.query;
    const q = {};
    if (status) q.status=status;
    if (workflowStatus) q.workflowStatus=workflowStatus;
    if (search) q.title={ $regex:search, $options:'i' };
    const campaigns = await Campaign.find(q)
      .populate('brand','displayName companyName avatar')
      .populate('assignedCreators.creator','displayName avatar handle niche creatorScore rank')
      .sort({ createdAt:-1 }).skip((+page-1)*+limit).limit(+limit);
    const total = await Campaign.countDocuments(q);
    res.json({ success:true, campaigns, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.get('/campaigns/pending', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ workflowStatus:{ $in:['brand_submitted','admin_review'] } })
      .populate('brand','displayName companyName avatar isVerified')
      .sort({ isPremium:-1, createdAt:1 }).limit(30);
    res.json({ success:true, campaigns });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.put('/campaigns/:id', async (req, res) => {
  try {
    const allowed = ['status','workflowStatus','featured','isPremium','adminReviewNote'];
    const update = {};
    allowed.forEach(k => { if (req.body[k]!==undefined) update[k]=req.body[k]; });
    update.adminReviewedAt=new Date(); update.adminReviewedBy=req.user._id;
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, update, { new:true });
    if (!campaign) return res.status(404).json({ success:false, message:'Not found' });
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── AI ANALYSIS ───────────────────────────────────────── */
router.post('/campaigns/:id/analyze', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });

    await Campaign.findByIdAndUpdate(req.params.id, { workflowStatus:'ai_analyzing' });

    // Fetch creator pool
    const allCreators = await User.find({ role:'creator', isBanned:false })
      .select('displayName handle avatar niche subNiches platforms creatorScore dna trustScore completedCampaigns successRate rank location');

    // AI scoring engine — 12-parameter match
    const scored = allCreators.map(c => {
      let score = 0;
      const totalFollowers = Object.values(c.platforms||{}).reduce((s,p)=>s+(p.followers||0),0);
      const avgEngagement  = Object.values(c.platforms||{}).reduce((s,p)=>s+(p.engagement||0),0)/4;
      const reasons = [];

      if (c.niche===campaign.niche)                           { score+=30; reasons.push(`${c.niche} expert`); }
      if ((c.subNiches||[]).includes(campaign.niche))         { score+=10; }
      if (totalFollowers>=campaign.minFollowers)              { score+=20; reasons.push(`${(totalFollowers/1000).toFixed(0)}K reach`); }
      if (totalFollowers>=campaign.minFollowers*3)            { score+=10; }
      score += Math.min(20,(c.creatorScore/1000)*20);
      if (avgEngagement>=3)                                   { score+=10; reasons.push(`${avgEngagement.toFixed(1)}% engagement`); }
      if (avgEngagement>=5)                                   { score+=5; }
      score += Math.min(8,((c.trustScore?.overall||70)-50)/2.5);
      if ((c.successRate||100)>=90)                          { score+=5; reasons.push(`${c.successRate}% delivery`); }
      const cPlatforms = Object.entries(c.platforms||{}).filter(([,v])=>v.followers>0).map(([k])=>k);
      const matched = (campaign.platforms||[]).filter(p=>cPlatforms.includes(p.toLowerCase()));
      score += matched.length*3;
      score += Math.min(5,((c.dna?.authenticity||80)-60)/4);
      if (c.dna?.growth>=50)                                 { score+=3; reasons.push('growing fast'); }

      return { creator:c, matchScore:Math.min(100,Math.round(score)),
               reason:reasons.join(' · ')||'General fit' };
    }).filter(x=>x.matchScore>20).sort((a,b)=>b.matchScore-a.matchScore);

    const topSlots = Math.max(campaign.totalSlots||5, 3);
    const top = scored.slice(0, Math.min(20, scored.length));
    const predictedReach = top.slice(0,topSlots).reduce((s,{creator})=>s+Object.values(creator.platforms||{}).reduce((ps,p)=>ps+(p.followers||0),0),0);

    await Campaign.findByIdAndUpdate(req.params.id, {
      workflowStatus:'admin_review',
      'aiAnalysis.analyzed':true, 'aiAnalysis.analyzedAt':new Date(),
      'aiAnalysis.predictedReach':predictedReach,
      'aiAnalysis.predictedROI':Math.round((predictedReach*0.04*campaign.budget)/Math.max(predictedReach,1000)),
      'aiAnalysis.estimatedEngagement':3.8,
      'aiAnalysis.confidence':Math.min(97,55+scored.length),
      'aiAnalysis.riskLevel':campaign.budget>200000?'medium':'low',
      'aiAnalysis.strategyBrief':`AI recommends ${Math.min(topSlots,top.length)} creators in ${campaign.niche}. Combined predicted reach: ${(predictedReach/1000).toFixed(0)}K. Confidence: ${Math.min(97,55+scored.length)}%.`,
      aiSuggestedCreators: top.map(s=>({ creator:s.creator._id, matchScore:s.matchScore, reason:s.reason })),
    });

    res.json({ success:true, suggestions:top, predictedReach,
      confidence:Math.min(97,55+scored.length), total:scored.length });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── BULK ASSIGN CREATORS ──────────────────────────────── */
router.post('/campaigns/:id/assign', async (req, res) => {
  try {
    const { creatorIds=[], paymentAllocations={}, adminNote='' } = req.body;
    if (!creatorIds.length) return res.status(400).json({ success:false, message:'Provide creatorIds array' });

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });

    const existingIds = new Set((campaign.assignedCreators||[]).map(a=>a.creator?.toString()));
    const newOnes = creatorIds.filter(id=>!existingIds.has(id));
    if (!newOnes.length) return res.status(400).json({ success:false, message:'All creators already assigned' });

    const perCreator = Math.floor(campaign.budget/(creatorIds.length||1));
    const assignments = newOnes.map(id=>{
      const ai = campaign.aiSuggestedCreators?.find(s=>s.creator?.toString()===id);
      return { creator:id, assignedAt:new Date(), assignedBy:req.user._id,
               paymentAlloc:paymentAllocations[id]||perCreator, status:'assigned',
               aiMatchScore:ai?.matchScore||0, adminNote };
    });

    await Campaign.findByIdAndUpdate(req.params.id, {
      $push:{ assignedCreators:{ $each:assignments } },
      workflowStatus:'creators_assigned',
    });

    // Notify each creator
    const io = req.app.get('io');
    await Promise.all(newOnes.map(cid=>
      notify(cid,'campaign_assigned','🎯 New Campaign Assignment!',
        `You've been selected for "${campaign.title}". Accept or decline within 48h.`,
        '/creator/assigned').then(()=>io?.to(`user:${cid}`).emit('notification:new',{
          title:'🎯 Campaign Assignment!',body:`Selected for "${campaign.title}"!`,type:'campaign_assigned'
        }))
    ));

    const updated = await Campaign.findById(req.params.id)
      .populate('assignedCreators.creator','displayName avatar handle creatorScore rank');
    res.json({ success:true, campaign:updated, assigned:newOnes.length });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── UPDATE SINGLE CREATOR STATUS ──────────────────────── */
router.put('/campaigns/:id/assign/:creatorId', async (req, res) => {
  try {
    const { status, revisionNote='', adminNote='' } = req.body;
    const update = { 'assignedCreators.$.adminNote':adminNote };
    if (status) update['assignedCreators.$.status']=status;
    if (revisionNote) update['assignedCreators.$.revisionNote']=revisionNote;
    if (status==='approved') update['assignedCreators.$.completedAt']=new Date();
    const campaign = await Campaign.findOneAndUpdate(
      { _id:req.params.id, 'assignedCreators.creator':req.params.creatorId },
      { $set:update }, { new:true }
    ).populate('assignedCreators.creator','displayName avatar handle');
    if (!campaign) return res.status(404).json({ success:false, message:'Assignment not found' });
    if (status==='revision') {
      await notify(req.params.creatorId,'revision_requested','✏️ Revision Requested',
        `Admin requested revision for "${campaign.title}": ${revisionNote}`,'/creator/assigned');
    }
    if (status==='approved') {
      await notify(req.params.creatorId,'content_approved','✅ Content Approved!',
        `Your content for "${campaign.title}" has been approved!`,'/creator/assigned');
      await awardXP(req.params.creatorId, 200);
    }
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── ANALYTICS / PERFORMANCE ───────────────────────────── */
router.get('/analytics', async (req, res) => {
  try {
    const [totalCampaigns, activeCampaigns, completedCampaigns,
           totalBrands, totalCreators, nicheBreakdown] = await Promise.all([
      Campaign.countDocuments(),
      Campaign.countDocuments({ workflowStatus:{ $in:['in_progress','creators_assigned'] } }),
      Campaign.countDocuments({ workflowStatus:'completed' }),
      User.countDocuments({ role:'brand' }),
      User.countDocuments({ role:'creator' }),
      Campaign.aggregate([{ $group:{ _id:'$niche', count:{ $sum:1 }, totalBudget:{ $sum:'$budget' } } },{ $sort:{ count:-1 } }]),
    ]);
    const txs = await Transaction.aggregate([{ $group:{ _id:'$status', total:{ $sum:'$amount' } } }]).catch(()=>[]);
    const revenue = txs.find(t=>t._id==='success')?.total||0;
    res.json({ success:true, stats:{ totalCampaigns,activeCampaigns,completedCampaigns,totalBrands,totalCreators,revenue }, nicheBreakdown });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

const { Transaction: Tx } = require('../models');
router.get('/transactions', async (req, res) => {
  try {
    const txs = await Tx.find().populate('creator brand','displayName email').sort({ createdAt:-1 }).limit(50);
    res.json({ success:true, transactions:txs });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

router.post('/broadcast', async (req, res) => {
  try {
    const { role, title, body } = req.body;
    const q = role ? { role } : {};
    const users = await User.find(q).select('_id');
    await Notification.insertMany(users.map(u=>({ user:u._id, type:'broadcast', title, body })));
    const io = req.app.get('io');
    io?.emit('notification:new',{ title, body, type:'broadcast' });
    res.json({ success:true, sent:users.length });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* ── CREATOR APPROVAL PANEL ────────────────────────────── */

/* GET /api/admin/creators/pending — list creators awaiting approval */
router.get('/creators/pending', async (req, res) => {
  try {
    const { sort='cas', page=1, limit=20, riskLevel } = req.query;
    const filter = { role:'creator', verificationStatus:'pending' };
    if (riskLevel) filter.casRisk = riskLevel;
    const sortMap = { cas:{casScore:-1}, newest:{createdAt:-1}, name:{displayName:1} };
    const [creators, total] = await Promise.all([
      User.find(filter)
        .select('displayName email avatar niche casScore casBreakdown casRisk casBadge socialUrls platforms analyzedAt createdAt rank creatorScore socialAnalyzed')
        .sort(sortMap[sort]||sortMap.cas)
        .skip((+page-1)*+limit).limit(+limit),
      User.countDocuments(filter),
    ]);
    res.json({ success:true, creators, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/admin/creators/all — all creators with filters */
router.get('/creators/all', async (req, res) => {
  try {
    const { verificationStatus, casRisk, page=1, limit=20, search } = req.query;
    const filter = { role:'creator' };
    if (verificationStatus) filter.verificationStatus = verificationStatus;
    if (casRisk) filter.casRisk = casRisk;
    if (search) filter.$or = [{ displayName:{$regex:search,$options:'i'} },{ email:{$regex:search,$options:'i'} }];
    const [creators, total] = await Promise.all([
      User.find(filter)
        .select('displayName email avatar niche casScore casRisk casBadge verificationStatus platforms analyzedAt createdAt rank creatorScore')
        .sort({ casScore:-1 })
        .skip((+page-1)*+limit).limit(+limit),
      User.countDocuments(filter),
    ]);
    res.json({ success:true, creators, total, pages:Math.ceil(total/+limit) });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/admin/creators/stats — summary counts */
router.get('/creators/stats', async (req, res) => {
  try {
    const [total, pending, approved, rejected, highRisk, elite] = await Promise.all([
      User.countDocuments({ role:'creator' }),
      User.countDocuments({ role:'creator', verificationStatus:'pending' }),
      User.countDocuments({ role:'creator', verificationStatus:'approved' }),
      User.countDocuments({ role:'creator', verificationStatus:'rejected' }),
      User.countDocuments({ role:'creator', casRisk:'HIGH' }),
      User.countDocuments({ role:'creator', casBadge:'ELITE' }),
    ]);
    const avgCas = await User.aggregate([
      { $match:{ role:'creator', socialAnalyzed:true } },
      { $group:{ _id:null, avg:{ $avg:'$casScore' } } },
    ]);
    res.json({ success:true, stats:{ total, pending, approved, rejected, highRisk, elite, avgCas:Math.round(avgCas[0]?.avg||0) } });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PATCH /api/admin/creators/:id/approve */
router.patch('/creators/:id/approve', async (req, res) => {
  try {
    const { note='' } = req.body;
    const user = await User.findOneAndUpdate(
      { _id:req.params.id, role:'creator' },
      { verificationStatus:'approved', isVerified:true, verificationNote:note },
      { new:true }
    ).select('displayName email casScore casBadge verificationStatus');
    if (!user) return res.status(404).json({ success:false, message:'Creator not found' });

    await Notification.create({ user:user._id, type:'creator_approved',
      title:'🎉 You\'re Verified!', body:`Your CreatoKite profile is now verified. You can be assigned to campaigns!`, link:'/creator/analytics' });
    const io = req.app.get('io');
    io?.to(`user:${user._id}`).emit('notification:new',{ title:'🎉 Verified!', body:'Your creator profile is now verified!', type:'creator_approved' });

    res.json({ success:true, user, message:'Creator approved and notified.' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PATCH /api/admin/creators/:id/reject */
router.patch('/creators/:id/reject', async (req, res) => {
  try {
    const { note='Profile does not meet quality standards.' } = req.body;
    const user = await User.findOneAndUpdate(
      { _id:req.params.id, role:'creator' },
      { verificationStatus:'rejected', isVerified:false, verificationNote:note },
      { new:true }
    ).select('displayName email casScore verificationStatus');
    if (!user) return res.status(404).json({ success:false, message:'Creator not found' });

    await Notification.create({ user:user._id, type:'creator_rejected',
      title:'Profile Needs Work', body:`Your verification was not approved: ${note}`, link:'/creator/profile' });

    res.json({ success:true, user, message:'Creator rejected and notified.' });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;

