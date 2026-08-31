const express = require('express');
const db = require('../db');
const { requireAuth, requirePermission } = require('../auth');
const { logAudit } = require('./crudFactory');

const router = express.Router();
const FIELDS = [
  'date_reported', 'buggy_id', 'source', 'description', 'severity', 'reported_by',
  'action_taken', 'assigned_to', 'status', 'actual_close_date', 'notes',
];

function nextDefectCode() {
  const last = db.prepare("SELECT defect_code FROM defects ORDER BY id DESC LIMIT 1").get();
  let n = 0;
  if (last && /^DEF-(\d+)$/.test(last.defect_code)) {
    n = parseInt(last.defect_code.split('-')[1], 10);
  }
  return `DEF-${String(n + 1).padStart(3, '0')}`;
}

router.get('/', requireAuth, requirePermission('defects', 'view'), (req, res) => {
  res.json(db.prepare('SELECT * FROM defects ORDER BY date_reported DESC, id DESC').all());
});

router.get('/:id', requireAuth, requirePermission('defects', 'view'), (req, res) => {
  const row = db.prepare('SELECT * FROM defects WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.post('/', requireAuth, requirePermission('defects', 'add'), (req, res) => {
  const body = req.body || {};
  const values = { defect_code: nextDefectCode(), created_by: req.user.full_name };
  for (const f of FIELDS) values[f] = body[f] === undefined ? null : body[f];
  try {
    const info = db
      .prepare(
        `INSERT INTO defects (defect_code, created_by, ${FIELDS.join(', ')})
         VALUES (@defect_code, @created_by, ${FIELDS.map((f) => `@${f}`).join(', ')})`
      )
      .run(values);
    const created = db.prepare('SELECT * FROM defects WHERE id = ?').get(info.lastInsertRowid);
    logAudit(req.user, 'create', 'defects', created.defect_code);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', requireAuth, requirePermission('defects', 'edit'), (req, res) => {
  const existing = db.prepare('SELECT * FROM defects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  const body = req.body || {};
  const cols = FIELDS.filter((c) => body[c] !== undefined);
  if (cols.length === 0) return res.status(400).json({ error: 'No fields to update' });
  const setClause = cols.map((c) => `${c} = @${c}`).join(', ');
  const values = { id: req.params.id };
  for (const c of cols) values[c] = body[c];
  try {
    db.prepare(`UPDATE defects SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run(values);
    const updated = db.prepare('SELECT * FROM defects WHERE id = ?').get(req.params.id);
    logAudit(req.user, 'update', 'defects', updated.defect_code, cols);
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', requireAuth, requirePermission('defects', 'delete'), (req, res) => {
  const existing = db.prepare('SELECT * FROM defects WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM defects WHERE id = ?').run(req.params.id);
  logAudit(req.user, 'delete', 'defects', existing.defect_code);
  res.json({ success: true });
});

module.exports = router;
