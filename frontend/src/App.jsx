
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ProtectedRoute, GuestRoute } from './router/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import { PageLoader } from './components/ui';

/* Pages */
import Landing       from './pages/Landing';
import Login         from './pages/auth/Login';
import Register      from './pages/auth/Register';

import CreatorDashboard from './pages/creator/Dashboard';
import AssignedCampaigns from './pages/creator/AssignedCampaigns';
import CreatorAnalytics  from './pages/creator/Analytics';
import CreatorEarnings   from './pages/creator/Earnings';
import Leaderboard       from './pages/creator/Leaderboard';
import CreatorProfile    from './pages/creator/Profile';

import BrandDashboard    from './pages/brand/BrandDashboard';
import CreateCampaign    from './pages/brand/CreateCampaign';
import BrandCampaigns    from './pages/brand/BrandCampaigns';
import BrandAnalytics    from './pages/brand/BrandAnalytics';
import CampaignDetail    from './pages/brand/CampaignDetail';

import AdminDashboard       from './pages/admin/AdminDashboard';
import AdminCampaigns       from './pages/admin/AdminCampaigns';
import AdminUsers           from './pages/admin/AdminUsers';
import AdminAnalytics       from './pages/admin/AdminAnalytics';
import AdminCreatorApproval from './pages/admin/AdminCreatorApproval';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Landing />;
  return <Navigate to={`/${user.role}/dashboard`} replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/"         element={<RootRedirect />} />
      <Route path="/login"    element={<GuestRoute><Login /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><Register /></GuestRoute>} />

      {/* Creator */}
      <Route element={<ProtectedRoute roles={['creator']}><AppLayout /></ProtectedRoute>}>
        <Route path="/creator/dashboard"   element={<CreatorDashboard />} />
        <Route path="/creator/assigned"    element={<AssignedCampaigns />} />
        <Route path="/creator/analytics"   element={<CreatorAnalytics />} />
        <Route path="/creator/earnings"    element={<CreatorEarnings />} />
        <Route path="/creator/leaderboard" element={<Leaderboard />} />
        <Route path="/creator/profile"     element={<CreatorProfile />} />
      </Route>

      {/* Brand */}
      <Route element={<ProtectedRoute roles={['brand']}><AppLayout /></ProtectedRoute>}>
        <Route path="/brand/dashboard"         element={<BrandDashboard />} />
        <Route path="/brand/campaigns/create"  element={<CreateCampaign />} />
        <Route path="/brand/campaigns"         element={<BrandCampaigns />} />
        <Route path="/brand/campaigns/:id"     element={<CampaignDetail />} />
        <Route path="/brand/analytics"         element={<BrandAnalytics />} />
      </Route>

      {/* Admin */}
      <Route element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
        <Route path="/admin/dashboard"         element={<AdminDashboard />} />
        <Route path="/admin/campaigns"         element={<AdminCampaigns />} />
        <Route path="/admin/users"             element={<AdminUsers />} />
        <Route path="/admin/analytics"         element={<AdminAnalytics />} />
        <Route path="/admin/creator-approval"  element={<AdminCreatorApproval />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
