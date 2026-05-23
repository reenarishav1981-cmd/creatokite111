// ─────────────────────────────────────────────────────────
// scoring.js  —  Creator Score + CAS engine
// ─────────────────────────────────────────────────────────
const { User } = require('../models');

/* ── Existing score (0–1000) ──────────────────────────── */
function computeScore(user) {
  const p = user.platforms || {};
  const totalFollowers = (p.instagram?.followers||0)+(p.youtube?.followers||0)+(p.twitter?.followers||0)+(p.tiktok?.followers||0);
  const avgEngagement  = [(p.instagram?.engagement||0),(p.youtube?.engagement||0),(p.twitter?.engagement||0),(p.tiktok?.engagement||0)].reduce((a,b)=>a+b,0)/4;

  const reach       = Math.min(1,totalFollowers/500000)*250;
  const engagement  = Math.min(1,avgEngagement/10)*250;
  const reliability = ((user.successRate||100)/100)*200;
  const activity    = Math.min(1,(user.completedCampaigns||0)/30)*150;
  const growth      = Math.min(1,(user.seasonXP||0)/5000)*50;
  const auth        = Math.min(1,(user.profileComplete||0)/100)*100;

  const total = Math.min(1000,Math.round(reach+engagement+reliability+activity+growth+auth));
  const dna = {
    reach:       Math.round(Math.min(100,totalFollowers/5000)),
    engagement:  Math.round(Math.min(100,avgEngagement*10)),
    reliability: Math.round(user.successRate||100),
    quality:     Math.round(user.profileComplete||0),
    growth:      Math.round(Math.min(100,(user.seasonXP||0)/50)),
    authenticity:Math.round(80-(user.trustScore?.fakePct||0)),
  };
  return { total, dna };
}

function getRank(score) {
  if (score>=900) return 'Legend';
  if (score>=750) return 'Diamond';
  if (score>=600) return 'Platinum';
  if (score>=400) return 'Gold';
  if (score>=200) return 'Silver';
  return 'Bronze';
}

/* ── CAS helpers (0–100 each) ─────────────────────────── */
const clamp = (v,mn=0,mx=100) => Math.max(mn,Math.min(mx,v));

function casEngagement(followers, avgLikes, avgComments, avgShares=0, avgSaves=0) {
  const weighted = avgLikes + avgComments*3 + avgShares*5 + avgSaves*4;
  const rawER = (weighted / Math.max(followers,1))*100;
  return clamp(Math.round(rawER>=8?100:rawER<=0?0:(rawER/8)*100));
}
function casReach(avgViews, followers) {
  const ratio = avgViews / Math.max(followers,1);
  return clamp(Math.round(ratio>=1?100:ratio<=0?0:ratio*100));
}
function casAuthenticity(followers, avgLikes, avgComments, followingCount=0) {
  let s = 100;
  const er = ((avgLikes+avgComments)/Math.max(followers,1))*100;
  if (followers>100000&&er<0.5)  s-=30;
  else if (followers>50000&&er<1) s-=15;
  else if (er<0.5) s-=20;
  const fr = followingCount/Math.max(followers,1);
  if (fr>2) s-=20; else if (fr>1) s-=10;
  const cr = avgComments/Math.max(avgLikes,1);
  if (cr<0.005&&followers>10000) s-=15;
  return clamp(Math.round(s));
}
function casConsistency(postsPerWeek) {
  if (postsPerWeek>=3&&postsPerWeek<=7) return 100;
  if (postsPerWeek>=1) return Math.round(70+(postsPerWeek-1)*15);
  if (postsPerWeek>0)  return Math.round(postsPerWeek*70);
  return 20;
}
function casGrowth(er) {
  if (er>=8) return 100; if (er>=5) return 85;
  if (er>=3) return 70;  if (er>=1) return 55;
  return 35;
}
function casBrandSafety(niche='') {
  const safe = ['fitness','food','travel','tech','education','fashion','beauty','lifestyle'];
  const hit  = safe.some(n=>niche.toLowerCase().includes(n));
  return hit ? 90 : 75;
}
function casConversion(avgSaves=0, avgLikes, niche='') {
  const ratio = avgSaves/Math.max(avgLikes,1);
  let s = clamp(Math.round(ratio*200));
  const hi = ['fashion','beauty','fitness','food','tech','gadget'];
  if (hi.some(n=>niche.toLowerCase().includes(n))) s=Math.min(100,s+15);
  return s||50;
}
function casContentQuality(avgViews, followers) {
  const r = avgViews/Math.max(followers,1);
  if (r>=0.5) return 100; if (r>=0.2) return 85;
  if (r>=0.1) return 70;  if (r>=0.05) return 55;
  return 40;
}

/* ── Master CAS calculator ────────────────────────────── */
function computeCAS({ igData, ytData, niche='' }) {
  // Prefer real data, merge both platforms
  const followers  = Math.max(igData?.followers||0, ytData?.followers||0);
  const avgLikes   = Math.max(igData?.avgLikes||0,  ytData?.avgLikes||0);
  const avgComments= Math.max(igData?.avgComments||0,ytData?.avgComments||0);
  const avgViews   = Math.max(igData?.avgViews||0,  ytData?.avgViews||0);
  const postsPerWeek = igData?.postsPerWeek||ytData?.postsPerWeek||2;
  const er         = igData?.er||ytData?.er||0;

  const scores = {
    engagement:    casEngagement(followers, avgLikes, avgComments),
    reach:         casReach(avgViews, followers),
    authenticity:  casAuthenticity(followers, avgLikes, avgComments),
    consistency:   casConsistency(postsPerWeek),
    growth:        casGrowth(er),
    brandSafety:   casBrandSafety(niche),
    conversion:    casConversion(0, avgLikes, niche),
    contentQuality:casContentQuality(avgViews, followers),
  };

  const cas = Math.round(
    scores.engagement    * 0.20 +
    scores.reach         * 0.15 +
    scores.authenticity  * 0.15 +
    scores.consistency   * 0.10 +
    scores.growth        * 0.10 +
    scores.brandSafety   * 0.10 +
    scores.conversion    * 0.10 +
    scores.contentQuality* 0.10
  );

  const avgAuth = (scores.authenticity + scores.engagement) / 2;
  const riskLevel = avgAuth>=75?'LOW':avgAuth>=50?'MEDIUM':'HIGH';
  const badge     = cas>=90?'ELITE':cas>=75?'VERIFIED':cas>=50?'STANDARD':'REVIEW';
  const autoApprove = cas>=75 && riskLevel==='LOW';

  return { cas, scores, riskLevel, badge, autoApprove };
}

/* ── awardXP ──────────────────────────────────────────── */
async function awardXP(userId, amount) {
  try {
    const user = await User.findById(userId);
    if (!user||user.role!=='creator') return null;
    user.xp = (user.xp||0)+amount;
    user.seasonXP = (user.seasonXP||0)+amount;
    user.level = Math.floor(user.xp/500)+1;
    const { total, dna } = computeScore(user);
    user.creatorScore=total; user.dna=dna; user.rank=getRank(total);
    await user.save({ validateBeforeSave:false });
    return { score:total, rank:user.rank };
  } catch(e){ console.error('awardXP error:',e.message); return null; }
}

/* ── recalculate all ──────────────────────────────────── */
async function recalculateAllScores() {
  const creators = await User.find({ role:'creator' });
  for (const u of creators) {
    try {
      const { total, dna } = computeScore(u);
      u.creatorScore=total; u.dna=dna; u.rank=getRank(total);
      await u.save({ validateBeforeSave:false });
    } catch(e){}
  }
  console.log(`✅ Recalculated scores for ${creators.length} creators`);
}

module.exports = { computeScore, getRank, awardXP, recalculateAllScores, computeCAS };
