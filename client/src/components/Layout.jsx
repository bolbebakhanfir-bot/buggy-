import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', module: null, end: true },
  { to: '/fleet', label: 'Fleet Register', module: 'fleet' },
  { to: '/maintenance', label: 'Preventive Maintenance', module: 'maintenance' },
  { to: '/checklist', label: 'Daily Pre-Use Checklist', module: 'checklist' },
  { to: '/usage', label: 'Driver Usage Log', module: 'usage' },
  { to: '/handover', label: 'Handover / Takeover Log', module: 'handover' },
  { to: '/defects', label: 'Defects & Maintenance', module: 'defects' },
  { to: '/drivers', label: 'Driver Certification', module: 'drivers' },
  { to: '/reports', label: 'Reports', module: 'reports' },
];

export default function Layout() {
  const { user, isAdmin, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const visibleItems = NAV_ITEMS.filter((item) => !item.module || hasPermission(item.module, 'view'));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-title">Meryal Buggy Tracking</div>
          <div className="brand-subtitle">Rixos Qetaifan &amp; Azure Beach</div>
        </div>
        <nav>
          {visibleItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/users" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Admin: Users &amp; Permissions
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <div className="live-dot" aria-hidden="true" />
          <div className="topbar-spacer" />
          <div className="topbar-user">
            <span className="user-name">{user?.full_name}</span>
            <span className={`role-badge role-${user?.role}`}>{user?.role}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>Log out</button>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
