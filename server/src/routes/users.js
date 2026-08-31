const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { requireAuth, requireAdmin } = require('../auth');
const { logAudit } = require('./crudFactory');
const { MODULES } = require('../db/schema');

const router = express.Router();

function sanitize(row) {
  if (!row) return row;
  const { password_hash, ...rest } = row;
  return { ...rest, permissions: JSON.parse(rest.permissions || '{}') };
}

function emptyPerms() {
  const p = {};
  for (const m of MODULES) p[m] = { view: false, add: false, edit: false, delete: false };
  return p;
}

router.get('/', requireAuth, requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM users ORDER BY role DESC, username ASC').all();
  res.json(rows.map(sanitize));
});

router.get('/modules', requireAuth, requireAdmin, (req, res) => {
  res.json(MODULES);
});

router.post('/', requireAuth, requireAdmin, (req, res) => {
  const { username, password, full_name, role, permissions } = req.body || {};
  if (!username || !password || !full_name || !role) {
    return res.status(400).json({ error: 'username, password, full_name and role are required' });
  }
  if (!['admin', 'operator'].includes(role)) {
    return res.status(400).json({ error: 'role must be admin or operator' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: 'Username already exists' });

  const perms = { ...emptyPerms(), ...(permissions || {}) };
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users (username, password_hash, full_name, role, active, permissions) VALUES (?, ?, ?, ?, 1, ?)')
    .run(username, hash, full_name, role, JSON.stringify(perms));
  const created = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  logAudit(req.user, 'create', 'users', username);
  res.status(201).json(sanitize(created));
});

router.put('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const { full_name, role, active, permissions, password } = req.body || {};

  if (existing.role === 'admin' && (role === 'operator' || active === false)) {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND active = 1").get().c;
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot demote or disable the last remaining admin' });
    }
  }

  const updates = { id: req.params.id };
  const sets = [];
  if (full_name !== undefined) { sets.push('full_name = @full_name'); updates.full_name = full_name; }
  if (role !== undefined) { sets.push('role = @role'); updates.role = role; }
  if (active !== undefined) { sets.push('active = @active'); updates.active = active ? 1 : 0; }
  if (permissions !== undefined) {
    sets.push('permissions = @permissions');
    updates.permissions = JSON.stringify({ ...emptyPerms(), ...permissions });
  }
  if (password) {
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    sets.push('password_hash = @password_hash');
    updates.password_hash = bcrypt.hashSync(password, 10);
  }
  if (sets.length === 0) return res.status(400).json({ error: 'No fields to update' });

  db.prepare(`UPDATE users SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(updates);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  logAudit(req.user, 'update', 'users', updated.username);
  res.json(sanitize(updated));
});

router.delete('/:id', requireAuth, requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  if (existing.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account' });
  if (existing.role === 'admin') {
    const adminCount = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role = 'admin'").get().c;
    if (adminCount <= 1) return res.status(400).json({ error: 'Cannot delete the last remaining admin' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  logAudit(req.user, 'delete', 'users', existing.username);
  res.json({ success: true });
});

module.exports = router;
