# Creatokite v4 — Merged & Enhanced Changelog

## What Changed (from creatokite-v3-secured + full-final merge)

---

## 🎨 Theme System (NEW — from full-final)

### Light / Dark Mode Toggle
- **`ThemeContext.jsx`** added — manages `light` / `dark` state via `localStorage` key `ck-theme`
- **Flash prevention** — `data-theme` attribute set before React renders (in `main.jsx`)
- **`Header.jsx`** now shows a Sun/Moon toggle button
- **`global.css`** — full dual-theme design system:
  - Light: warm cream `#EAE5D9` background, glassmorphism cards, coral+olive brand colors
  - Dark: deep `#0F1117` background, matching glass effects
  - Animated mesh background gradients (coral, olive, gold)
  - All UI elements (`card`, `stat-card`, `glass-modal`, `form-input`, buttons) theme-aware

---

## 📱 Mobile / Responsive (from creatokite-v3-secured)

### Full Responsive Breakpoint System
- **Mobile < 768px**: sidebar slides off-screen, hamburger shown, BottomNav appears
- **Tablet 768–1023px**: sidebar collapses to 64px icon-only rail
- **Desktop 1024px+**: full sidebar, hamburger hidden
- **`BottomNav.jsx`** — role-aware bottom nav bar with active dots, safe-area support
- **`AppLayout.jsx`** — ESC key closes sidebar, body scroll locks when sidebar open on mobile
- **`Sidebar.jsx`** — X close button on mobile, proper `isOpen`/`onClose` props

### Mobile UX Fixes
- `.page-content` adds bottom padding on mobile for BottomNav clearance
- Grids collapse properly (4→2→1 col)
- Tables scroll horizontally
- Touch-friendly tap targets (44×44px minimum)
- `safe-area-inset` support for notched phones

---

## 🔒 Security (from creatokite-v3-secured — kept intact)

All security hardening from v3 is preserved:
- `security.js` middleware: Helmet, CORS, rate limiting, mongo-sanitize, cookie-parser
- `auth.js` middleware: JWT + refresh token pattern, httpOnly cookies
- `express-validator` on all routes
- Backend `.env.example` with full docs for all secrets

---

## 🏗️ Architecture Improvements (merged)

### Files changed / added vs secured:
| File | Change |
|---|---|
| `frontend/src/main.jsx` | Added `ThemeProvider` wrapping |
| `frontend/src/contexts/ThemeContext.jsx` | **NEW** — light/dark context |
| `frontend/src/components/layout/Header.jsx` | Merged: theme toggle + close-outside + glass-modal dropdown |
| `frontend/src/styles/global.css` | Merged: fullfinal glass theme tokens + secured responsive system |
| `frontend/src/components/ui/index.jsx` | Updated for glass morphism (from fullfinal) |
| All other files | From creatokite-v3-secured (complete, secure, feature-full) |

### Files kept from secured only (not in fullfinal):
- `pages/admin/AdminCreatorApproval.jsx`
- `pages/creator/Profile.jsx` (full version with portfolio)
- `pages/creator/Analytics.jsx` (full version)
- `backend/src/middleware/security.js`
- `backend/src/services/instagramScraper.js`
- `backend/src/services/socialFetcher.js`
- `components/FAQ.jsx`
- `components/layout/BottomNav.jsx`

---

## 🚀 How to Run

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### 1. Backend Setup

```bash
cd creatokite-v4/backend
npm install
cp .env.example .env
# Edit .env — fill in MONGODB_URI, JWT_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Run that 3 times — use outputs for `JWT_SECRET`, `JWT_REFRESH_SECRET`, `COOKIE_SECRET`.

Start backend:
```bash
npm run dev        # development (auto-restart)
npm run seed       # seed demo data (admin + sample users)
npm start          # production
```

Backend runs on: `http://localhost:5000`

---

### 2. Frontend Setup

```bash
cd creatokite-v4/frontend
npm install
cp .env.example .env
# .env already has: VITE_API_URL=http://localhost:5000/api
```

Start frontend:
```bash
npm run dev        # development
npm run build      # production build → dist/
npm run preview    # preview production build
```

Frontend runs on: `http://localhost:5173`

---

### 3. Default Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@creatokite.com | Admin@12345 |
| Brand | brand@demo.com | Brand@12345 |
| Creator | creator@demo.com | Creator@12345 |

---

## 📸 Instagram Scraper Setup (Optional)

The Instagram scraper in the backend fetches real creator stats using a 4-method fallback chain:

1. Direct Instagram internal API (fastest)
2. Playwright stealth browser (most reliable)
3. Python instaloader (reliable backup)
4. Smart estimation (always works)

### Setup Steps

```bash
cd creatokite-v4/backend

# Option A: Use the Node.js setup script (recommended)
npm run setup

# Option B: Manual setup
# Step 1 — Install Playwright Chromium
npx playwright install chromium

# Step 2 — Install Python instaloader (optional but recommended)
# On Mac/Linux:
python3 -m pip install instaloader
# On Windows:
python -m pip install instaloader
# If pip gives system error:
python3 -m pip install instaloader --break-system-packages
```

### What `npm run setup` does:
1. Installs Playwright Chromium browser automatically
2. Detects Python (tries `python3`, `python`, `py`)
3. Installs `instaloader` Python package
4. Prints method status summary

### Notes:
- Instagram scraping works best from residential IPs (home/local machine)
- On cloud VPS, Method 1 (direct API) may be blocked — Playwright fallback handles it
- No Instagram login required for public profiles
- Set `RAPIDAPI_KEY` in `.env` for additional reliability via RapidAPI method

---

## 🌐 Production Deployment

### Backend (Railway / Render / VPS)

1. Set all environment variables from `.env.example`
2. Change `NODE_ENV=production`
3. Set `CLIENT_URL` to your actual frontend URL
4. `npm start`

### Frontend (Vercel / Netlify)

1. Set `VITE_API_URL` to your backend URL
2. `npm run build`
3. Deploy the `dist/` folder

### Vercel one-click (frontend):
```bash
cd frontend
npx vercel --prod
```
