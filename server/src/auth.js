const jwt = require('jsonwebtoken');
const db = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'meryal-buggy-tracking-dev-secret-change-me';
const TOKEN_TTL = '12h';

function signToken(user) {
  return jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// Permissions and active-status are re-read from the database on every
// request (not baked into the JWT) so an admin revoking access or changing
// an operator's permissions takes effect immediately, not after re-login.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  const row = db.prepare('SELECT id, username, full_name, role, active, permissions FROM users WHERE id = ?').get(payload.id);
  if (!row || !row.active) {
    return res.status(401).json({ error: 'Account disabled or not found' });
  }
  req.user = {
    id: row.id,
    username: row.username,
    full_name: row.full_name,
    role: row.role,
    permissions: JSON.parse(row.permissions || '{}'),
  };
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// action is one of: view, add, edit, delete
function requirePermission(moduleName, action) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    if (req.user.role === 'admin') return next();
    const perms = req.user.permissions || {};
    const modulePerms = perms[moduleName] || {};
    if (!modulePerms[action]) {
      return res.status(403).json({ error: `You do not have '${action}' access to ${moduleName}` });
    }
    next();
  };
}

module.exports = { signToken, requireAuth, requireAdmin, requirePermission, JWT_SECRET };
