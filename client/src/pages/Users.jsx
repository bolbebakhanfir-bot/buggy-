import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const MODULE_LABELS = {
  fleet: 'Fleet Register',
  maintenance: 'Preventive Maintenance',
  checklist: 'Daily Checklist',
  usage: 'Usage Log',
  handover: 'Handover / Takeover',
  defects: 'Defects & Maintenance',
  drivers: 'Driver Certification',
  reports: 'Reports (PDF export)',
};
const ACTIONS = ['view', 'add', 'edit', 'delete'];

function emptyPerms(modules) {
  const p = {};
  for (const m of modules) p[m] = { view: false, add: false, edit: false, delete: false };
  return p;
}

// One-click starting points for common job roles. The admin can still tick
// or untick individual boxes afterwards.
const PRESETS = {
  'Safety Officer': (modules) => {
    const p = emptyPerms(modules);
    for (const m of modules) p[m].view = true;
    for (const m of ['checklist', 'usage', 'handover', 'defects', 'drivers']) {
      if (p[m]) p[m] = { view: true, add: true, edit: true, delete: false };
    }
    return p;
  },
  'Buggy Operator': (modules) => {
    const p = emptyPerms(modules);
    for (const m of modules) if (m !== 'reports') p[m].view = true;
    for (const m of ['checklist', 'usage', 'handover', 'defects']) if (p[m]) p[m].add = true;
    return p;
  },
  'View only': (modules) => {
    const p = emptyPerms(modules);
    for (const m of modules) p[m].view = true;
    return p;
  },
};

function PresetButtons({ modules, onApply }) {
  return (
    <div className="preset-buttons">
      <span>Quick presets:</span>
      {Object.entries(PRESETS).map(([name, build]) => (
        <button key={name} type="button" className="btn" onClick={() => onApply(build(modules))}>
          {name}
        </button>
      ))}
    </div>
  );
}

function PermissionsEditor({ modules, permissions, onChange }) {
  return (
    <table className="perm-table">
      <thead>
        <tr>
          <th>Module</th>
          {ACTIONS.map((a) => (
            <th key={a}>{a}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {modules.map((m) => (
          <tr key={m}>
            <td>{MODULE_LABELS[m] || m}</td>
            {ACTIONS.map((a) => (
              <td key={a}>
                <input
                  type="checkbox"
                  checked={!!permissions[m]?.[a]}
                  onChange={(e) =>
                    onChange({
                      ...permissions,
                      [m]: { ...permissions[m], [a]: e.target.checked },
                    })
                  }
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CreateUserForm({ modules, onCreated }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('operator');
  const [permissions, setPermissions] = useState(() => emptyPerms(modules));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await onCreated({ username, password, full_name: fullName, role, permissions });
      setUsername('');
      setPassword('');
      setFullName('');
      setRole('operator');
      setPermissions(emptyPerms(modules));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="create-user-card" onSubmit={handleSubmit}>
      <h2>Create Account</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="form-grid">
        <label>
          Username *
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password *
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
        </label>
        <label>
          Full Name *
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label>
          Role *
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="operator">Operator</option>
            <option value="admin">Admin</option>
          </select>
        </label>
      </div>
      {role === 'operator' && (
        <>
          <h3>Operator Permissions</h3>
          <PresetButtons modules={modules} onApply={setPermissions} />
          <PermissionsEditor modules={modules} permissions={permissions} onChange={setPermissions} />
        </>
      )}
      {role === 'admin' && <p className="page-description">Admin accounts always have full access to every module.</p>}
      <button type="submit" className="btn btn-primary" disabled={saving}>
        {saving ? 'Creating…' : 'Create Account'}
      </button>
    </form>
  );
}

function UserRow({ user, modules, onUpdate, onDelete }) {
  const [editingPerms, setEditingPerms] = useState(false);
  const [permissions, setPermissions] = useState(user.permissions);
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');

  async function savePerms() {
    setError('');
    try {
      await onUpdate(user.id, { permissions });
      setEditingPerms(false);
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActive() {
    setError('');
    try {
      await onUpdate(user.id, { active: !user.active });
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetPassword() {
    if (!newPassword) return;
    setError('');
    try {
      await onUpdate(user.id, { password: newPassword });
      setNewPassword('');
      alert(`Password reset for ${user.username}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="user-card">
      <div className="user-card-header">
        <div>
          <strong>{user.full_name}</strong> <span className="muted">@{user.username}</span>
          <span className={`role-badge role-${user.role}`}>{user.role}</span>
          {!user.active && <span className="role-badge role-disabled">disabled</span>}
        </div>
        <div className="user-card-actions">
          <button className="btn-link" onClick={toggleActive}>{user.active ? 'Disable' : 'Enable'}</button>
          {user.role === 'operator' && (
            <button className="btn-link" onClick={() => setEditingPerms((v) => !v)}>
              {editingPerms ? 'Close' : 'Edit Permissions'}
            </button>
          )}
          <button className="btn-link btn-link-danger" onClick={() => onDelete(user)}>Delete</button>
        </div>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      {editingPerms && (
        <div className="perm-editor">
          <PresetButtons modules={modules} onApply={setPermissions} />
          <PermissionsEditor modules={modules} permissions={permissions} onChange={setPermissions} />
          <button className="btn btn-primary btn-small" onClick={savePerms}>Save Permissions</button>
        </div>
      )}
      <div className="reset-password-row">
        <input
          type="password"
          placeholder="New password (min 6 chars)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <button className="btn btn-ghost btn-small" onClick={resetPassword}>Reset Password</button>
      </div>
    </div>
  );
}

export default function Users() {
  const { user: me, refreshUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [userList, moduleList] = await Promise.all([api.get('/users'), api.get('/users/modules')]);
      setUsers(userList);
      setModules(moduleList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(payload) {
    const created = await api.post('/users', payload);
    setUsers((u) => [...u, created]);
  }

  async function handleUpdate(id, payload) {
    const updated = await api.put(`/users/${id}`, payload);
    setUsers((u) => u.map((x) => (x.id === id ? updated : x)));
    if (id === me.id) refreshUser();
  }

  async function handleDelete(user) {
    if (!window.confirm(`Delete account "${user.username}"? This cannot be undone.`)) return;
    try {
      await api.del(`/users/${user.id}`);
      setUsers((u) => u.filter((x) => x.id !== user.id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Users &amp; Permissions</h1>
          <p className="page-description">
            Admins have full access everywhere. Operators only get the view/add/edit/delete
            permissions you grant them per module below.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <>
          <div className="user-list">
            {users.map((u) => (
              <UserRow key={u.id} user={u} modules={modules} onUpdate={handleUpdate} onDelete={handleDelete} />
            ))}
          </div>
          <CreateUserForm modules={modules} onCreated={handleCreate} />
        </>
      )}
    </div>
  );
}
