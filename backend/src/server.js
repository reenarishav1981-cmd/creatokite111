require('dotenv').config();

/* ── Env validation ──────────────────────────────────────── */
const REQUIRED = ['MONGODB_URI','JWT_SECRET','JWT_REFRESH_SECRET','CLIENT_URL'];
const missing  = REQUIRED.filter(k => !process.env[k]);
if (missing.length) {
  console.error('❌ Missing env vars:', missing.join(', '));
  console.error('👉 Copy .env.example → .env and fill values');
  process.exit(1);
}

const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const compression  = require('compression');
const morgan       = require('morgan');
const cookieParser = require('cookie-parser');
const connectDB    = require('./config/db');
const {
  helmetConfig, globalLimiter, authLimiter,
  sanitize, xssClean, httpsRedirect, secureHeaders,
} = require('./middleware/security');

const app    = express();
const server = http.createServer(app);
const CLIENT = process.env.CLIENT_URL;

/* ── CORS config (reused for both app and socket.io) ─────── */
const ALLOWED_ORIGINS = [
  CLIENT,
  'https://candid-blancmange-6f8ce8.netlify.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('[CORS] Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  optionsSuccessStatus: 204,
};

/* ── Socket.io ────────────────────────────────────────────── */
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET','POST'],
    credentials: true,
  },
});
app.set('io', io);
io.on('connection', socket => {
  socket.on('join:user', id   => socket.join(`user:${id}`));
  socket.on('join:room', room => socket.join(room));
});

/* ── Security ─────────────────────────────────────────────── */
app.set('trust proxy', 1);
app.use(httpsRedirect);
app.use(helmetConfig);
app.use(secureHeaders);

// Handle preflight requests for ALL routes BEFORE other middleware
app.options('*', cors(corsOptions));
app.use(cors(corsOptions));

/* ── Body / Cookie ────────────────────────────────────────── */
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || process.env.JWT_SECRET));
app.use(sanitize);
app.use(xssClean);

if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

/* ── Rate limiting ────────────────────────────────────────── */
app.use('/api/', globalLimiter);
app.use('/api/auth/login',    authLimiter);
app.use('/api/auth/register', authLimiter);

/* ── Routes ───────────────────────────────────────────────── */
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/users',     require('./routes/users'));
app.use('/api/analytics', require('./routes/analytics'));

/* ── Health ───────────────────────────────────────────────── */
app.get('/health', (_req, res) =>
  res.json({ status: 'ok', ts: new Date().toISOString(), env: process.env.NODE_ENV })
);

/* ── 404 ──────────────────────────────────────────────────── */
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

/* ── Global error ─────────────────────────────────────────── */
app.use((err, _req, res, _next) => {
  console.error('[Error]', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Server error' : err.message,
  });
});

/* ── Cron ─────────────────────────────────────────────────── */
try {
  const cron = require('node-cron');
  const { recalculateAllScores } = require('./services/scoring');
  cron.schedule('0 3 * * *', () => recalculateAllScores());
} catch(e) { console.log('[Cron] Skipped:', e.message); }

/* ── Start ────────────────────────────────────────────────── */
const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`\n🚀 Server on port ${PORT} [${process.env.NODE_ENV}]`);
    console.log(`   CORS allowed origins:`, ALLOWED_ORIGINS);
    console.log(`   Health → http://localhost:${PORT}/health\n`);
  });
}).catch(err => { console.error(err); process.exit(1); });

module.exports = app;