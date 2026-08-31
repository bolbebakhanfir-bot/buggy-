const express = require('express');
const db = require('../db');
const { requireAuth, requirePermission } = require('../auth');

function logAudit(user, action, moduleName, recordLabel, details) {
  db.prepare(
    'INSERT INTO audit_log (username, action, module, record_label, details) VALUES (?, ?, ?, ?, ?)'
  ).run(user.username, action, moduleName, recordLabel || '', details ? JSON.stringify(details) : null);
}

// Builds a REST router (list / get / create / update / delete) for a simple
// table, wired to the permission system. Shared because every operational
// module (checklist, usage log, handover log, defects, ...) follows the same
// shape: list with optional filters, create/edit/delete gated per-module.
function createCrudRouter({ table, moduleName, fields, uniqueField, hasCreatedBy, labelField, orderBy }) {
  const router = express.Router();

  router.get('/', requireAuth, requirePermission(moduleName, 'view'), (req, res) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy || 'id DESC'}`).all();
    res.json(rows);
  });

  router.get('/:id', requireAuth, requirePermission(moduleName, 'view'), (req, res) => {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  });

  router.post('/', requireAuth, requirePermission(moduleName, 'add'), (req, res) => {
    const body = req.body || {};
    const cols = [...fields];
    const placeholders = cols.map((c) => `@${c}`);
    const values = {};
    for (const c of cols) values[c] = body[c] === undefined ? null : body[c];
    if (hasCreatedBy) {
      cols.push('created_by');
      placeholders.push('@created_by');
      values.created_by = req.user.full_name;
    }
    try {
      const info = db
        .prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${placeholders.join(', ')})`)
        .run(values);
      const created = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(info.lastInsertRowid);
      logAudit(req.user, 'create', moduleName, labelField ? created[labelField] : `#${created.id}`);
      res.status(201).json(created);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.put('/:id', requireAuth, requirePermission(moduleName, 'edit'), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    const body = req.body || {};
    const cols = fields.filter((c) => body[c] !== undefined);
    if (cols.length === 0) return res.status(400).json({ error: 'No fields to update' });
    const setClause = cols.map((c) => `${c} = @${c}`).join(', ');
    const values = { id: req.params.id };
    for (const c of cols) values[c] = body[c];
    try {
      db.prepare(`UPDATE ${table} SET ${setClause}, updated_at = datetime('now') WHERE id = @id`).run(values);
      const updated = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
      logAudit(req.user, 'update', moduleName, labelField ? updated[labelField] : `#${updated.id}`, cols);
      res.json(updated);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  router.delete('/:id', requireAuth, requirePermission(moduleName, 'delete'), (req, res) => {
    const existing = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Not found' });
    db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(req.params.id);
    logAudit(req.user, 'delete', moduleName, labelField ? existing[labelField] : `#${existing.id}`);
    res.json({ success: true });
  });

  return router;
}

module.exports = { createCrudRouter, logAudit };
