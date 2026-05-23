# 🚀 Creatokite — Setup Guide

## ⚡ FASTEST WAY TO RUN (3 steps)

### Step 1 — Backend .env file banao

```bash
cd backend
cp .env.example .env
```

Ab `.env` file open karo aur **sirf MONGODB_URI replace karo**:

```
MONGODB_URI=mongodb+srv://TERA_USER:TERA_PASSWORD@cluster0.xxxxx.mongodb.net/creatokite?retryWrites=true&w=majority
```

Atlas URI kaise milega:
1. https://cloud.mongodb.com → Login karo
2. Apna Cluster → **Connect** button
3. **Drivers** select karo
4. URI copy karo (username + password wala)

> ⚠️ `.env.example` mein jo URI hai woh kisi aur ka Atlas hai — **woh kaam nahi karega**

---

### Step 2 — Backend start karo

```bash
# Backend folder mein
cd backend
npm install
npm run seed     # Demo users + data create karega
npm run dev      # Server start hoga port 5000 pe
```

Server chalu hone pe dikhega:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 Creatokite server running on port 5000
```

---

### Step 3 — Frontend start karo

```bash
# Naye terminal mein (backend chalu rehne do)
cd frontend
npm install
npm run dev      # http://localhost:5173 pe open hoga
```

---

## 🔑 Login Credentials (after seed)

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@creatokite.com     | Admin@12345 |
| Brand   | brand@demo.com           | Demo@12345  |
| Creator | creator1@demo.com        | Demo@12345  |

---

## ❌ Common Errors & Fix

### "Login failed"
- `.env` mein `MONGODB_URI` sahi hai?
- `JWT_SECRET` set hai?
- Backend terminal mein kya error aata hai?

### "MongoDB connection failed: bad auth"
- Atlas username/password wrong hai URI mein
- Password mein special chars hain? URL encode karo: `@` → `%40`

### "ENOTFOUND" / "timed out"
- Atlas dashboard → Network Access → **0.0.0.0/0** add karo (Allow from anywhere)

### Frontend API calls fail
- Backend port 5000 pe chal raha hai?
- `vite.config.js` mein proxy `/api` → `http://localhost:5000` set hai ✅

---

## 📁 Project Structure

```
creatokite/
├── backend/
│   ├── .env              ← BANAO (copy from .env.example)
│   ├── src/
│   │   ├── server.js     ← Entry point
│   │   ├── config/db.js  ← MongoDB connection
│   │   ├── models/       ← User, Campaign, etc.
│   │   ├── routes/       ← auth, campaigns, admin, users
│   │   ├── middleware/   ← JWT auth, admin check
│   │   └── services/     ← scoring, socialFetcher
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/index.js  ← All API calls
    │   ├── contexts/     ← AuthContext
    │   ├── components/   ← UI, Layout, Header, Sidebar
    │   ├── pages/        ← All pages
    │   └── styles/       ← global.css
    └── vite.config.js    ← Proxy config
```
