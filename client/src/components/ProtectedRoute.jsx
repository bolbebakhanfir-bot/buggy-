import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="empty-state full-screen">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function RequireAdmin({ children }) {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

export function RequirePermission({ moduleName, action = 'view', children }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(moduleName, action)) return <Navigate to="/" replace />;
  return children;
}
