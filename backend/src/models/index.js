const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/* ── USER ─────────────────────────────────────────────── */
const userSchema = new mongoose.Schema({
  displayName:  { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true, minlength: 6 },
  role:         { type: String, enum: ['creator','brand','admin'], default: 'creator' },
  avatar:       { type: String, default: '' },
  handle:       { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  bio:          { type: String, maxlength: 500, default: '' },
  location:     { type: String, default: '' },
  website:      { type: String, default: '' },
  isVerified:   { type: Boolean, default: false },
  isBanned:     { type: Boolean, default: false },
  banReason:    { type: String, default: '' },
  refreshToken: { type: String, default: '' },
  niche:        { type: String, default: '' },
  subNiches:    [String],
  platforms: {
    instagram: { followers:{type:Number,default:0}, engagement:{type:Number,default:0} },
    youtube:   { followers:{type:Number,default:0}, engagement:{type:Number,default:0} },
    twitter:   { followers:{type:Number,default:0}, engagement:{type:Number,default:0} },
    tiktok:    { followers:{type:Number,default:0}, engagement:{type:Number,default:0} },
  },
  /* ── NEW: Social profile URLs ─────────────────────── */
  socialUrls: {
    instagram: { type: String, default: '' },
    youtube:   { type: String, default: '' },
  },
  /* ── NEW: Creator Automation Score (0–100) ────────── */
  casScore: { type: Number, default: 0 },
  casBreakdown: {
    engagement:    { type: Number, default: 0 },
    reach:         { type: Number, default: 0 },
    authenticity:  { type: Number, default: 0 },
    consistency:   { type: Number, default: 0 },
    growth:        { type: Number, default: 0 },
    brandSafety:   { type: Number, default: 0 },
    conversion:    { type: Number, default: 0 },
    contentQuality:{ type: Number, default: 0 },
  },
  casRisk:            { type: String, enum: ['LOW','MEDIUM','HIGH'], default: 'MEDIUM' },
  casBadge:           { type: String, enum: ['ELITE','VERIFIED','STANDARD','REVIEW'], default: 'REVIEW' },
  socialAnalyzed:     { type: Boolean, default: false },
  /* pending = submitted for approval, active = approved by admin */
  verificationStatus: { type: String, enum: ['none','pending','approved','rejected'], default: 'none' },
  verificationNote:   { type: String, default: '' },
  analyzedAt:         { type: Date },
  /* ── END NEW ───────────────────────────────────────── */
  creatorScore:       { type: Number, default: 0, min: 0, max: 1000 },
  xp:                 { type: Number, default: 0 },
  seasonXP:           { type: Number, default: 0 },
  level:              { type: Number, default: 1 },
  rank:               { type: String, enum:['Bronze','Silver','Gold','Platinum','Diamond','Legend'], default:'Bronze' },
  streak:             { type: Number, default: 0 },
  lastLoginDate:      { type: Date },
  badges:             [{ name:String, icon:String, earnedAt:{type:Date,default:Date.now} }],
  dna: {
    reach:{type:Number,default:0}, engagement:{type:Number,default:0},
    reliability:{type:Number,default:100}, quality:{type:Number,default:50},
    growth:{type:Number,default:0}, authenticity:{type:Number,default:80},
  },
  trustScore: {
    overall:{type:Number,default:70}, performance:{type:Number,default:70},
    delivery:{type:Number,default:70}, growth:{type:Number,default:70},
    authenticity:{type:Number,default:80}, fakePct:{type:Number,default:0},
  },
  totalCampaigns:      { type: Number, default: 0 },
  completedCampaigns:  { type: Number, default: 0 },
  successRate:         { type: Number, default: 100 },
  avgResponseTime:     { type: Number, default: 24 },
  totalEarnings:       { type: Number, default: 0 },
  pendingEarnings:     { type: Number, default: 0 },
  profileComplete:     { type: Number, default: 0 },
  totalViews:          { type: Number, default: 0 },
  totalLikes:          { type: Number, default: 0 },
  companyName:         { type: String, default: '' },
  industry:            { type: String, default: '' },
  totalSpent:          { type: Number, default: 0 },
  brandRepScore:       { type: Number, default: 80 },
}, { timestamps: true });

userSchema.index({ creatorScore: -1 });
userSchema.index({ role: 1 });
userSchema.index({ niche: 1 });
userSchema.index({ verificationStatus: 1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12); next();
});
userSchema.methods.comparePassword = function(c) { return bcrypt.compare(c, this.password); };
userSchema.methods.toPublicJSON = function() {
  const o = this.toObject(); delete o.password; delete o.refreshToken; delete o.__v; return o;
};

/* ── CAMPAIGN ─────────────────────────────────────────── */
const campaignSchema = new mongoose.Schema({
  title:             { type: String, required: true, trim: true, minlength: 3, maxlength: 120 },
  description:       { type: String, required: true, maxlength: 2000 },
  brand:             { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brandName:         { type: String, required: true },
  brandLogo:         { type: String, default: '' },
  niche:             { type: String, required: true },
  tags:              [String],
  deliverables:      [String],
  contentGuidelines: { type: String, default: '' },
  budget:            { type: Number, required: true, min: 500 },
  budgetType:        { type: String, enum:['fixed','per_post','negotiable'], default:'fixed' },
  isPremium:         { type: Boolean, default: false },
  featured:          { type: Boolean, default: false },
  minFollowers:      { type: Number, default: 1000 },
  minEngagement:     { type: Number, default: 0 },
  platforms:         [String],
  targetRegions:     [String],
  totalSlots:        { type: Number, default: 5, min: 1 },
  filledSlots:       { type: Number, default: 0 },
  status:            { type: String, enum:['draft','open','paused','completed','cancelled'], default:'open' },
  deadline:          { type: Date, required: true },
  views:             { type: Number, default: 0 },
  trackingCode:      { type: String, unique: true, sparse: true },
  campaignGoal:      { type: String, default: '' },
  targetAudience:    { type: String, default: '' },
  kpiTargets: {
    reach:{type:Number,default:0}, impressions:{type:Number,default:0},
    engagement:{type:Number,default:0}, conversions:{type:Number,default:0},
  },
  workflowStatus: {
    type: String,
    enum: ['brand_submitted','admin_review','ai_analyzing','creators_assigned','in_progress','revision','completed','cancelled'],
    default: 'brand_submitted',
  },
  aiAnalysis: {
    analyzed:{type:Boolean,default:false}, analyzedAt:{type:Date},
    strategyBrief:{type:String,default:''}, predictedReach:{type:Number,default:0},
    predictedROI:{type:Number,default:0}, estimatedEngagement:{type:Number,default:0},
    riskLevel:{type:String,enum:['low','medium','high'],default:'low'},
    confidence:{type:Number,default:0},
  },
  assignedCreators: [{
    creator:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt:    { type: Date, default: Date.now },
    assignedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    paymentAlloc:  { type: Number, default: 0 },
    aiMatchScore:  { type: Number, default: 0 },
    status:        { type: String, enum:['assigned','accepted','in_progress','submitted','revision','approved','rejected','completed'], default:'assigned' },
    submissionUrl: { type: String, default: '' },
    submissionNote:{ type: String, default: '' },
    submittedAt:   { type: Date },
    revisionNote:  { type: String, default: '' },
    revisionCount: { type: Number, default: 0 },
    completedAt:   { type: Date },
    adminNote:     { type: String, default: '' },
  }],
  aiSuggestedCreators: [{
    creator:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
    matchScore:{type:Number,default:0}, reason:{type:String,default:''},
  }],
  totalPostViews:{type:Number,default:0}, totalPostLikes:{type:Number,default:0},
  estimatedReach:{type:Number,default:0}, estimatedROI:{type:Number,default:0},
  adminReviewNote:{type:String,default:''}, adminReviewedAt:{type:Date},
  adminReviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:'User'},
}, { timestamps:true, toJSON:{virtuals:true}, toObject:{virtuals:true} });

campaignSchema.index({workflowStatus:1}); campaignSchema.index({status:1,deadline:1}); campaignSchema.index({niche:1}); campaignSchema.index({brand:1});
campaignSchema.virtual('daysLeft').get(function(){ return Math.max(0,Math.ceil((this.deadline-new Date())/86400000)); });
campaignSchema.virtual('assignedCount').get(function(){ return this.assignedCreators?.length||0; });

/* ── NOTIFICATION ─────────────────────────────────────── */
const notificationSchema = new mongoose.Schema({
  user: {type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  type: {type:String,required:true},
  title:{type:String,required:true}, body:{type:String,required:true},
  read: {type:Boolean,default:false},
  data: {type:mongoose.Schema.Types.Mixed,default:{}}, link:{type:String,default:''},
},{timestamps:true});
notificationSchema.index({user:1,read:1,createdAt:-1});

/* ── TRANSACTION ──────────────────────────────────────── */
const transactionSchema = new mongoose.Schema({
  type:    {type:String,enum:['payment','refund','payout','escrow_fund','escrow_release'],required:true},
  campaign:{type:mongoose.Schema.Types.ObjectId,ref:'Campaign'},
  creator: {type:mongoose.Schema.Types.ObjectId,ref:'User'},
  brand:   {type:mongoose.Schema.Types.ObjectId,ref:'User'},
  amount:  {type:Number,required:true}, currency:{type:String,default:'INR'},
  status:  {type:String,enum:['pending','success','failed','refunded'],default:'pending'},
  notes:   {type:String,default:''},
},{timestamps:true});
transactionSchema.index({creator:1,createdAt:-1}); transactionSchema.index({brand:1,createdAt:-1});

/* ── CHAT ─────────────────────────────────────────────── */
const chatSchema = new mongoose.Schema({
  participants:[{type:mongoose.Schema.Types.ObjectId,ref:'User'}],
  campaign:    {type:mongoose.Schema.Types.ObjectId,ref:'Campaign'},
  lastMessage: {type:String,default:''}, lastMessageAt:{type:Date},
},{timestamps:true});
chatSchema.index({participants:1});

const messageSchema = new mongoose.Schema({
  chat:   {type:mongoose.Schema.Types.ObjectId,ref:'Chat',required:true},
  sender: {type:mongoose.Schema.Types.ObjectId,ref:'User',required:true},
  text:   {type:String,maxlength:5000},
  type:   {type:String,enum:['text','system'],default:'text'},
  read:   {type:Boolean,default:false},
},{timestamps:true});
messageSchema.index({chat:1,createdAt:-1});

module.exports = {
  User:         mongoose.model('User',         userSchema),
  Campaign:     mongoose.model('Campaign',     campaignSchema),
  Notification: mongoose.model('Notification', notificationSchema),
  Transaction:  mongoose.model('Transaction',  transactionSchema),
  Chat:         mongoose.model('Chat',         chatSchema),
  Message:      mongoose.model('Message',      messageSchema),
};
