import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RequireAuth, RequireAdmin, RequirePermission } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Fleet from './pages/Fleet';
import Maintenance from './pages/Maintenance';
import Checklist from './pages/Checklist';
import Usage from './pages/Usage';
import Handover from './pages/Handover';
import Defects from './pages/Defects';
import Drivers from './pages/Drivers';
import Reports from './pages/Reports';
import Users from './pages/Users';

function LoginRoute() {
  const { user, ready } = useAuth();
  if (!ready) return <div className="empty-state full-screen">Loading…</div>;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="fleet" element={<RequirePermission moduleName="fleet"><Fleet /></RequirePermission>} />
          <Route path="maintenance" element={<RequirePermission moduleName="maintenance"><Maintenance /></RequirePermission>} />
          <Route path="checklist" element={<RequirePermission moduleName="checklist"><Checklist /></RequirePermission>} />
          <Route path="usage" element={<RequirePermission moduleName="usage"><Usage /></RequirePermission>} />
          <Route path="handover" element={<RequirePermission moduleName="handover"><Handover /></RequirePermission>} />
          <Route path="defects" element={<RequirePermission moduleName="defects"><Defects /></RequirePermission>} />
          <Route path="drivers" element={<RequirePermission moduleName="drivers"><Drivers /></RequirePermission>} />
          <Route path="reports" element={<RequirePermission moduleName="reports"><Reports /></RequirePermission>} />
          <Route path="users" element={<RequireAdmin><Users /></RequireAdmin>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
