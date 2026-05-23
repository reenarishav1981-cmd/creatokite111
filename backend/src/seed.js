require('dotenv').config();
const mongoose = require('mongoose');
const { User, Campaign } = require('./models');
const { computeScore, getRank } = require('./services/scoring');

const NICHES = ['Tech','Beauty','Fashion','Fitness','Food','Travel','Gaming','Education','Finance','Lifestyle'];
const rnd = (min,max) => Math.floor(Math.random()*(max-min+1))+min;

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🌱 Seeding database…');

  /* Admin */
  const adminEmail = process.env.ADMIN_EMAIL||'admin@creatokite.com';
  if (!await User.findOne({ email:adminEmail })) {
    await User.create({ displayName:'Super Admin', email:adminEmail,
      password:process.env.ADMIN_PASSWORD||'Admin@12345', role:'admin', isVerified:true });
    console.log('✅ Admin created:', adminEmail);
  } else console.log('ℹ️  Admin already exists');

  /* Demo creators */
  const creatorNames = ['Priya Sharma','Rahul Gupta','Ananya Singh','Vikram Mehta','Neha Kapoor',
    'Arjun Patel','Divya Nair','Rohit Kumar','Sanya Malhotra','Aditya Shah'];
  for (let i=0; i<creatorNames.length; i++) {
    const email = `creator${i+1}@demo.com`;
    if (await User.findOne({ email })) continue;
    const niche = NICHES[i%NICHES.length];
    const instaFollowers = rnd(5000,250000);
    const u = new User({
      displayName:creatorNames[i], email, password:'Demo@12345', role:'creator',
      handle:`creator${i+1}demo`, niche, isVerified:i<5,
      bio:`${niche} content creator based in India. Creating viral content since 2020.`,
      location:['Mumbai','Delhi','Bangalore','Hyderabad','Pune'][i%5],
      platforms:{
        instagram:{ followers:instaFollowers, engagement:+(rnd(20,80)/10).toFixed(1) },
        youtube:  { followers:rnd(1000,50000), engagement:+(rnd(30,90)/10).toFixed(1) },
        tiktok:   { followers:rnd(2000,80000), engagement:+(rnd(40,100)/10).toFixed(1) },
      },
      totalCampaigns:rnd(5,60), completedCampaigns:rnd(3,55),
      successRate:rnd(82,100), totalEarnings:rnd(10000,500000),
    });
    const { total, dna } = computeScore(u); u.creatorScore=total; u.dna=dna; u.rank=getRank(total);
    u.profileComplete=rnd(60,100);
    await u.save();
  }
  console.log('✅ Demo creators created');

  /* Demo brand */
  const brandEmail = 'brand@demo.com';
  let brand = await User.findOne({ email:brandEmail });
  if (!brand) {
    brand = await User.create({
      displayName:'TechVision India', email:brandEmail, password:'Demo@12345',
      role:'brand', companyName:'TechVision India Pvt Ltd', industry:'Technology', isVerified:true,
      brandRepScore:92,
    });
    console.log('✅ Demo brand created');
  }

  /* Demo campaigns */
  const existCampaigns = await Campaign.countDocuments({ brand:brand._id });
  if (existCampaigns===0) {
    await Campaign.insertMany([
      { title:'Tech Unboxing Campaign — OnePlus 13R', description:'We need tech creators to unbox and review our latest smartphone with honest reviews.',
        brand:brand._id, brandName:'TechVision India', niche:'Tech', budget:150000, deadline:new Date(Date.now()+30*86400000),
        platforms:['instagram','youtube'], deliverables:['YouTube Video','Instagram Reel'], totalSlots:5,
        campaignGoal:'Product Launch', targetAudience:'Millennials (25-34)', workflowStatus:'brand_submitted', status:'open',
        trackingCode:'TECH001DEMO', contentGuidelines:'Focus on camera quality, battery life, and performance.' },
      { title:'Summer Fitness Challenge — FitPro App', description:'Promote our AI fitness app with 30-day challenge content.',
        brand:brand._id, brandName:'TechVision India', niche:'Fitness', budget:80000, deadline:new Date(Date.now()+20*86400000),
        platforms:['instagram','tiktok'], deliverables:['Instagram Reel','TikTok Video'], totalSlots:8,
        campaignGoal:'App Downloads', targetAudience:'Gen Z (18-24)', workflowStatus:'creators_assigned', status:'open',
        trackingCode:'FIT002DEMO' },
    ]);
    console.log('✅ Demo campaigns created');
  }

  console.log('\n🎉 Seed complete!');
  console.log('   Admin:   ', adminEmail, '/', process.env.ADMIN_PASSWORD||'Admin@12345');
  console.log('   Brand:   ', brandEmail, '/ Demo@12345');
  console.log('   Creator: creator1@demo.com / Demo@12345');
  await mongoose.disconnect();
}

seed().catch(e=>{ console.error(e); process.exit(1); });
