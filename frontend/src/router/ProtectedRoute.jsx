import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PageLoader } from '../components/ui';

export function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" state={{ from:location }} replace />;
  if (roles && !roles.includes(user.role))
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (user)    return <Navigate to={`/${user.role}/dashboard`} replace />;
  return children;
}
