# ⚡ CreatoKite — AI-Powered Creator Campaign OS

## What's New (Creator Automation Score Feature)

### For Creators
- Go to **Profile** page → paste your Instagram or YouTube URL
- Click **"Analyze & Submit for Approval"**
- System auto-fetches real engagement, followers, views
- Calculates your **Creator Automation Score (CAS)** out of 100
- Profile sent to admin for 1-click approval
- View full score breakdown in **Analytics** page

### For Admins
- New **"Creator Approvals"** page in sidebar
- See each creator's CAS, Risk Level, badge, follower count
- Click **eye icon** to expand full 8-metric score breakdown
- Click ✔ to approve, ✕ to reject — creator gets notified automatically
- Admin Dashboard shows pending creator count with alert banner

---

## Setup Instructions

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env

# Frontend
cd ../frontend
npm install
```

### 2. Configure .env

Edit `backend/.env`:

```env
# Required — already set in .env.example:
MONGODB_URI=...
JWT_SECRET=...

# For real YouTube data (FREE):
# 1. Go to console.cloud.google.com
# 2. New project → Enable "YouTube Data API v3"
# 3. Credentials → Create API Key → paste here
YOUTUBE_API_KEY=your_key_here

# For real Instagram data (OPTIONAL, free tier):
# 1. Go to rapidapi.com
# 2. Search "Instagram Scraper API2" → Subscribe (free plan)
# 3. Copy your RapidAPI key → paste here
RAPIDAPI_KEY=your_key_here
```

> **Without API keys**: YouTube returns no data, Instagram uses smart estimated data.
> The CAS score still works — just less accurate.

### 3. Run

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open: http://localhost:5173

### Admin Login
- Email: `admin@creatokite.com`
- Password: `Admin@12345`

---

## CAS Score Formula

| Metric | Weight |
|--------|--------|
| Engagement Quality | 20% |
| Audience Reach | 15% |
| Authenticity | 15% |
| Posting Consistency | 10% |
| Growth Rate | 10% |
| Brand Safety | 10% |
| Conversion Potential | 10% |
| Content Quality | 10% |

**Badges:** ELITE (90+) · VERIFIED (75+) · STANDARD (50+) · REVIEW (<50)

**Auto-approve:** CAS ≥ 75 AND Risk = LOW → instantly approved, no admin action needed.

---

## Files Changed vs Original

### New Files
- `backend/src/services/socialFetcher.js` — YouTube + Instagram data fetcher
- `frontend/src/pages/admin/AdminCreatorApproval.jsx` — Admin approval panel

### Modified Files
- `backend/src/models/index.js` — Added CAS fields to User model
- `backend/src/services/scoring.js` — Added CAS calculation functions
- `backend/src/routes/analytics.js` — Added `/creator/connect` and `/creator/cas` endpoints
- `backend/src/routes/admin.js` — Added creator approval endpoints
- `frontend/src/api/index.js` — Added new API methods
- `frontend/src/App.jsx` — Added `/admin/creator-approval` route
- `frontend/src/components/layout/Sidebar.jsx` — Added "Creator Approvals" nav item
- `frontend/src/pages/creator/Profile.jsx` — Added social URL analysis UI
- `frontend/src/pages/creator/Analytics.jsx` — Added CAS radar chart
- `frontend/src/pages/admin/AdminDashboard.jsx` — Added pending creators alert
