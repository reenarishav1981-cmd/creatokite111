const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { Campaign, User, Notification } = require('../models');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

const notifyUser = async (userId, type, title, body, link='') => {
  try { await Notification.create({ user:userId, type, title, body, link }); } catch(e){}
};

/* GET /api/campaigns  — public list */
router.get('/', async (req, res) => {
  try {
    const { niche, platform, minBudget, maxBudget, search, page=1, limit=12, sort='newest' } = req.query;
    const q = { status:'open', deadline:{ $gte:new Date() } };
    if (niche)      q.niche = niche;
    if (platform)   q.platforms = { $in:[platform.toLowerCase()] };
    if (minBudget)  q.budget = { ...(q.budget||{}), $gte:+minBudget };
    if (maxBudget)  q.budget = { ...(q.budget||{}), $lte:+maxBudget };
    if (search)     q.$or = [{ title:{$regex:search,$options:'i'} },{ description:{$regex:search,$options:'i'} }];
    const sortMap = { newest:{ createdAt:-1 }, budget:{ budget:-1 }, deadline:{ deadline:1 } };
    const campaigns = await Campaign.find(q)
      .select('-assignedCreators -aiSuggestedCreators -adminReviewNote')
      .sort(sortMap[sort]||sortMap.newest)
      .skip((+page-1)*+limit).limit(+limit)
      .populate('brand','displayName companyName avatar isVerified');
    const total = await Campaign.countDocuments(q);
    res.json({ success:true, campaigns, total, pages:Math.ceil(total/+limit), page:+page });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/campaigns/brand — brand's own campaigns */
router.get('/brand', auth, async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand only' });
    const campaigns = await Campaign.find({ brand:req.user._id })
      .populate('assignedCreators.creator','displayName avatar handle niche creatorScore trustScore rank')
      .sort({ createdAt:-1 });
    res.json({ success:true, campaigns });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/campaigns/my/assigned — creator's assigned campaigns */
router.get('/my/assigned', auth, async (req, res) => {
  try {
    if (req.user.role!=='creator')
      return res.status(403).json({ success:false, message:'Creators only' });
    const campaigns = await Campaign.find({ 'assignedCreators.creator':req.user._id })
      .populate('brand','displayName companyName avatar')
      .sort({ createdAt:-1 });
    const result = campaigns.map(c => {
      const obj = c.toObject();
      obj.myAssignment = c.assignedCreators.find(
        a => a.creator?.toString()===req.user._id.toString()
      );
      return obj;
    });
    res.json({ success:true, campaigns:result });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PUT /api/campaigns/my/assigned/:id/respond */
router.put('/my/assigned/:id/respond', auth, async (req, res) => {
  try {
    const { response } = req.body;
    if (!['accepted','rejected'].includes(response))
      return res.status(400).json({ success:false, message:'Response must be accepted or rejected' });
    const campaign = await Campaign.findOneAndUpdate(
      { _id:req.params.id, 'assignedCreators.creator':req.user._id },
      { $set:{ 'assignedCreators.$.status':response,
               ...(response==='accepted'?{ workflowStatus:'in_progress' }:{}) } },
      { new:true }
    );
    if (!campaign) return res.status(404).json({ success:false, message:'Assignment not found' });
    if (response==='accepted') {
      await notifyUser(campaign.brand,'creator_accepted','✅ Creator Accepted',
        `A creator accepted the assignment for "${campaign.title}"`,`/brand/campaigns/${campaign._id}`);
    }
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PUT /api/campaigns/my/assigned/:id/submit */
router.put('/my/assigned/:id/submit', auth, async (req, res) => {
  try {
    const { submissionUrl, submissionNote='' } = req.body;
    if (!submissionUrl) return res.status(400).json({ success:false, message:'Submission URL required' });
    const campaign = await Campaign.findOneAndUpdate(
      { _id:req.params.id, 'assignedCreators.creator':req.user._id },
      { $set:{ 'assignedCreators.$.status':'submitted',
               'assignedCreators.$.submissionUrl':submissionUrl,
               'assignedCreators.$.submissionNote':submissionNote,
               'assignedCreators.$.submittedAt':new Date() } },
      { new:true }
    );
    if (!campaign) return res.status(404).json({ success:false, message:'Assignment not found' });
    await notifyUser(campaign.brand,'submission_received','📤 Content Submitted',
      `Creator submitted content for "${campaign.title}". Review needed.`,`/brand/campaigns/${campaign._id}`);
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* GET /api/campaigns/:id */
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id, { $inc:{ views:1 } }, { new:true }
    ).populate('brand','displayName companyName avatar isVerified industry');
    if (!campaign) return res.status(404).json({ success:false, message:'Campaign not found' });
    const safe = campaign.toObject();
    delete safe.assignedCreators; delete safe.aiSuggestedCreators; delete safe.adminReviewNote;
    res.json({ success:true, campaign:safe });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* POST /api/campaigns — brand creates */
router.post('/', auth, async (req, res) => {
  try {
    if (!['brand','admin'].includes(req.user.role))
      return res.status(403).json({ success:false, message:'Brand only' });
    const { title, description, niche, budget, deadline, totalSlots=5,
            platforms=[], deliverables=[], tags=[], contentGuidelines='',
            budgetType='fixed', minFollowers=1000, minEngagement=0,
            isPremium=false, campaignGoal='', targetAudience='', kpiTargets={} } = req.body;
    if (!title||!description||!niche||!budget||!deadline)
      return res.status(400).json({ success:false, message:'title, description, niche, budget, deadline required' });
    const campaign = await Campaign.create({
      title, description, niche, budget:+budget, deadline:new Date(deadline),
      totalSlots:+totalSlots, platforms, deliverables, tags, contentGuidelines,
      budgetType, minFollowers:+minFollowers, minEngagement:+minEngagement,
      isPremium, campaignGoal, targetAudience,
      kpiTargets:{ reach:+kpiTargets.reach||0, impressions:+kpiTargets.impressions||0,
                   engagement:+kpiTargets.engagement||0, conversions:+kpiTargets.conversions||0 },
      brand:req.user._id,
      brandName:req.user.companyName||req.user.displayName,
      brandLogo:req.user.avatar||'',
      trackingCode:uuidv4().replace(/-/g,'').slice(0,12).toUpperCase(),
      workflowStatus:'brand_submitted',
    });
    await User.findByIdAndUpdate(req.user._id, { $inc:{ activeCampaignsCount:1 } });
    res.status(201).json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

/* PUT /api/campaigns/:id — brand updates own */
router.put('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success:false, message:'Not found' });
    if (campaign.brand.toString()!==req.user._id.toString()&&req.user.role!=='admin')
      return res.status(403).json({ success:false, message:'Not authorized' });
    const allowed = ['title','description','contentGuidelines','deadline','tags','deliverables','targetAudience','campaignGoal'];
    allowed.forEach(k => { if (req.body[k]!==undefined) campaign[k]=req.body[k]; });
    await campaign.save();
    res.json({ success:true, campaign });
  } catch(e) { res.status(500).json({ success:false, message:e.message }); }
});

module.exports = router;
