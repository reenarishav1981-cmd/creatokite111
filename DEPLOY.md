# 🚀 Creatokite — Deployment Guide (Free + HTTPS)

## 🏗️ Architecture
```
Browser → Cloudflare (SSL) → Vercel (Frontend) → Render (Backend) → MongoDB Atlas
```
All free. HTTPS auto. "Not Secure" gone forever.

---

## STEP 1 — Backend Deploy on Render (Free)

1. Go to https://render.com → Sign up (free)
2. New → **Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node src/server.js`
   - **Environment:** Node

5. Add Environment Variables (Render dashboard → Environment):
```
NODE_ENV          = production
MONGODB_URI       = your_atlas_uri
JWT_SECRET        = (run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_REFRESH_SECRET= (another random 64-char string)
COOKIE_SECRET     = (another random 64-char string)
CLIENT_URL        = https://YOUR-APP.vercel.app   ← fill after Step 2
PORT              = 5000
```

6. Deploy → Copy your backend URL: `https://creatokite-xxx.onrender.com`

---

## STEP 2 — Frontend Deploy on Vercel (Free)

1. Go to https://vercel.com → Sign up (free)
2. New Project → Import GitHub repo
3. Settings:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output:** `dist`

4. Add Environment Variables:
```
VITE_API_URL = https://creatokite-xxx.onrender.com/api
```

5. Deploy → Copy your frontend URL: `https://creatokite-xxx.vercel.app`

6. Go back to **Render** → Update `CLIENT_URL` to your Vercel URL → Redeploy

---

## STEP 3 — MongoDB Atlas Security

1. Atlas → **Network Access** → Add IP:
   - For Render: Add `0.0.0.0/0` (or get Render static IP from paid plan)
   - Free option: Allow from anywhere `0.0.0.0/0`

2. Atlas → **Database Access** → Your user:
   - Role: `readWrite` on `creatokite` database only
   - NOT `Atlas Admin`

---

## STEP 4 — Cloudflare (Optional but makes HTTPS 100% solid)

Only needed if you have a **custom domain** (e.g., creatokite.com)

1. https://cloudflare.com → Add your domain
2. Update nameservers at your domain registrar
3. DNS:
   - `CNAME creatokite.com → cname.vercel-dns.com` (frontend)
   - `CNAME api.creatokite.com → creatokite-xxx.onrender.com` (backend)
4. SSL/TLS → **Full (Strict)**
5. Always Use HTTPS → **ON**

If using Cloudflare, update:
- `CLIENT_URL` = `https://creatokite.com`
- `VITE_API_URL` = `https://api.creatokite.com/api`

---

## ✅ Verify Everything Works

```bash
# 1. Backend health check
curl https://creatokite-xxx.onrender.com/health
# Should return: {"status":"ok",...}

# 2. Login test
curl -X POST https://creatokite-xxx.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@creatokite.com","password":"Admin@12345"}'
# Should return: {"success":true,"token":"...","user":{...}}

# 3. Check HTTPS
# Open browser → your Vercel URL → should show 🔒 padlock
```

---

## 🔒 Security Checklist

- [ ] HTTPS active on frontend (Vercel auto)
- [ ] HTTPS active on backend (Render auto)
- [ ] `NODE_ENV=production` set on Render
- [ ] `CLIENT_URL` = exact frontend URL (no trailing slash)
- [ ] All JWT secrets are 64+ char random strings
- [ ] MongoDB Atlas IP whitelist configured
- [ ] `COOKIE_SECRET` set
- [ ] No `.env` file committed to git

---

## ⚡ Quick Commands

```bash
# Generate secure secrets (run in terminal):
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Run 3 times — use for JWT_SECRET, JWT_REFRESH_SECRET, COOKIE_SECRET
```
