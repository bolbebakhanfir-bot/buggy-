import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CrudModal from './CrudModal';

// Generic list/add/edit/delete page shared by every operational module
// (fleet, maintenance, checklist, usage, handover, defects, drivers) — they
// all follow the same REST + permission shape, only columns/fields differ.
export default function CrudPage({ title, description, moduleName, apiPath, columns, fields, searchKeys }) {
  const { hasPermission } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(null); // { mode: 'add'|'edit', record }

  const canAdd = hasPermission(moduleName, 'add');
  const canEdit = hasPermission(moduleName, 'edit');
  const canDelete = hasPermission(moduleName, 'delete');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get(apiPath);
      setRows(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    const keys = searchKeys || columns.map((c) => c.key);
    return rows.filter((r) => keys.some((k) => String(r[k] ?? '').toLowerCase().includes(q)));
  }, [rows, search, searchKeys, columns]);

  async function handleCreate(payload) {
    const created = await api.post(apiPath, payload);
    setRows((r) => [created, ...r]);
    setModal(null);
  }

  async function handleUpdate(id, payload) {
    const updated = await api.put(`${apiPath}/${id}`, payload);
    setRows((r) => r.map((row) => (row.id === id ? updated : row)));
    setModal(null);
  }

  async function handleDelete(row) {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    try {
      await api.del(`${apiPath}/${row.id}`);
      setRows((r) => r.filter((x) => x.id !== row.id));
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p className="page-description">{description}</p>}
        </div>
        {canAdd && (
          <button className="btn btn-primary" onClick={() => setModal({ mode: 'add' })}>
            + Add
          </button>
        )}
      </div>

      <div className="toolbar">
        <input
          className="search-input"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="record-count">{filtered.length} of {rows.length} records</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="table-wrap">
        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No records found.</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.key}>{c.label}</th>
                ))}
                {(canEdit || canDelete) && <th className="actions-col">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                  ))}
                  {(canEdit || canDelete) && (
                    <td className="actions-col">
                      {canEdit && (
                        <button className="btn-link" onClick={() => setModal({ mode: 'edit', record: row })}>
                          Edit
                        </button>
                      )}
                      {canDelete && (
                        <button className="btn-link btn-link-danger" onClick={() => handleDelete(row)}>
                          Delete
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <CrudModal
          title={modal.mode === 'add' ? `Add ${title}` : `Edit ${title}`}
          fields={fields}
          initialValues={modal.record}
          onCancel={() => setModal(null)}
          onSubmit={(payload) =>
            modal.mode === 'add' ? handleCreate(payload) : handleUpdate(modal.record.id, payload)
          }
        />
      )}
    </div>
  );
}
