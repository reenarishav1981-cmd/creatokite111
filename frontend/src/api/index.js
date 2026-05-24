import axios from 'axios';

// In dev: Vite proxy handles /api → localhost:5000
// In prod: VITE_API_URL=https://yourbackend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || 'https://creatokite111.onrender.com/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,   // CRITICAL — sends httpOnly cookies
  timeout: 15000,
});

/* ── Token injection (fallback for non-cookie envs) ──────── */
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('ck_token');
  if (token && !cfg.headers.Authorization) {
    cfg.headers.Authorization = `Bearer ${token}`;
  }
  return cfg;
}, err => Promise.reject(err));

/* ── Auto-refresh on 401 TOKEN_EXPIRED ───────────────────── */
let refreshing = false;
let queue = [];
const flush = (err, token) => { queue.forEach(p => err ? p.reject(err) : p.resolve(token)); queue = []; };

api.interceptors.response.use(r => r, async err => {
  const orig = err.config;
  const isExpired = err.response?.status === 401 &&
    ['TOKEN_EXPIRED'].includes(err.response?.data?.code);

  if (isExpired && !orig._retry) {
    if (refreshing) {
      return new Promise((resolve, reject) => queue.push({ resolve, reject }))
        .then(token => { orig.headers.Authorization = `Bearer ${token}`; return api(orig); });
    }
    orig._retry = true;
    refreshing = true;
    try {
      const rt = localStorage.getItem('ck_refresh');
      const { data } = await axios.post(`${BASE_URL}/auth/refresh`,
        { refreshToken: rt },
        { withCredentials: true }
      );
      const { token, refreshToken } = data;
      if (token) localStorage.setItem('ck_token', token);
      if (refreshToken) localStorage.setItem('ck_refresh', refreshToken);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
      flush(null, token);
      orig.headers.Authorization = `Bearer ${token}`;
      return api(orig);
    } catch(e) {
      flush(e);
      localStorage.removeItem('ck_token');
      localStorage.removeItem('ck_refresh');
      window.location.href = '/login';
      return Promise.reject(e);
    } finally { refreshing = false; }
  }
  return Promise.reject(err);
});

const unwrap = r => r.data;

export const authAPI = {
  register: d  => api.post('/auth/register', d).then(unwrap),
  login:    d  => api.post('/auth/login', d).then(unwrap),
  logout:   () => api.post('/auth/logout').then(unwrap),
  refresh:  d  => api.post('/auth/refresh', d).then(unwrap),
  me:       () => api.get('/auth/me').then(unwrap),
};

export const campaignsAPI = {
  list:           p       => api.get('/campaigns', { params: p }).then(unwrap),
  get:            id      => api.get(`/campaigns/${id}`).then(unwrap),
  create:         d       => api.post('/campaigns', d).then(unwrap),
  update:         (id, d) => api.put(`/campaigns/${id}`, d).then(unwrap),
  brandCampaigns: ()      => api.get('/campaigns/brand').then(unwrap),
  myAssigned:     ()      => api.get('/campaigns/my/assigned').then(unwrap),
  respond:        (id, r) => api.put(`/campaigns/my/assigned/${id}/respond`, { response: r }).then(unwrap),
  submitWork:     (id, d) => api.put(`/campaigns/my/assigned/${id}/submit`, d).then(unwrap),
};

export const adminAPI = {
  dashboard:        ()        => api.get('/admin/dashboard').then(unwrap),
  analytics:        ()        => api.get('/admin/analytics').then(unwrap),
  users:            p         => api.get('/admin/users', { params: p }).then(unwrap),
  getUser:          id        => api.get(`/admin/users/${id}`).then(unwrap),
  updateUser:       (id, d)   => api.put(`/admin/users/${id}`, d).then(unwrap),
  recalcScore:      id        => api.post(`/admin/users/${id}/recalculate`).then(unwrap),
  campaigns:        p         => api.get('/admin/campaigns', { params: p }).then(unwrap),
  pendingCampaigns: ()        => api.get('/admin/campaigns/pending').then(unwrap),
  updateCampaign:   (id, d)   => api.put(`/admin/campaigns/${id}`, d).then(unwrap),
  analyzeAI:        id        => api.post(`/admin/campaigns/${id}/analyze`).then(unwrap),
  assignCreators:   (id, d)   => api.post(`/admin/campaigns/${id}/assign`, d).then(unwrap),
  updateAssignment: (id,c, d) => api.put(`/admin/campaigns/${id}/assign/${c}`, d).then(unwrap),
  broadcast:        d         => api.post('/admin/broadcast', d).then(unwrap),
  transactions:     p         => api.get('/admin/transactions', { params: p }).then(unwrap),
  creatorsPending:  p         => api.get('/admin/creators/pending', { params: p }).then(unwrap),
  creatorsAll:      p         => api.get('/admin/creators/all', { params: p }).then(unwrap),
  creatorsStats:    ()        => api.get('/admin/creators/stats').then(unwrap),
  creatorApprove:   (id, d)   => api.patch(`/admin/creators/${id}/approve`, d).then(unwrap),
  creatorReject:    (id, d)   => api.patch(`/admin/creators/${id}/reject`, d).then(unwrap),
};

export const usersAPI = {
  profile:       ()     => api.get('/users/profile').then(unwrap),
  updateProfile: d      => api.put('/users/profile', d).then(unwrap),
  publicProfile: handle => api.get(`/users/${handle}`).then(unwrap),
  leaderboard:   p      => api.get('/users/leaderboard', { params: p }).then(unwrap),
  creators:      p      => api.get('/users/creators', { params: p }).then(unwrap),
  notifications: ()     => api.get('/users/notifications/all').then(unwrap),
  readNotifs:    ()     => api.put('/users/notifications/read').then(unwrap),
};

export const analyticsAPI = {
  brand:         () => api.get('/analytics/brand').then(unwrap),
  creator:       () => api.get('/analytics/creator').then(unwrap),
  connectSocial: d  => api.post('/analytics/creator/connect', d).then(unwrap),
  creatorCAS:    () => api.get('/analytics/creator/cas').then(unwrap),
};

export default api;
