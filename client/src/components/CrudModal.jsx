import { useState } from 'react';

export default function CrudModal({ title, fields, initialValues, onCancel, onSubmit }) {
  const [values, setValues] = useState(() => {
    const v = {};
    for (const f of fields) v[f.key] = initialValues?.[f.key] ?? (f.type === 'number' ? '' : '');
    return v;
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function setField(key, val) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    for (const f of fields) {
      if (f.required && !String(values[f.key] ?? '').trim()) {
        setError(`${f.label} is required`);
        return;
      }
    }
    setSaving(true);
    try {
      const payload = { ...values };
      for (const f of fields) {
        if (f.type === 'number' && payload[f.key] !== '') payload[f.key] = Number(payload[f.key]);
      }
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onCancel}>
      <div className="modal-card" onMouseDown={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {fields.map((f) => (
              <label key={f.key} className={f.wide ? 'field-wide' : ''}>
                {f.label}{f.required ? ' *' : ''}
                {f.type === 'select' ? (
                  <select value={values[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)}>
                    <option value="">Select…</option>
                    {f.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea rows={3} value={values[f.key] ?? ''} onChange={(e) => setField(f.key, e.target.value)} />
                ) : (
                  <input
                    type={f.type || 'text'}
                    value={values[f.key] ?? ''}
                    onChange={(e) => setField(f.key, e.target.value)}
                    step={f.type === 'number' ? 'any' : undefined}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
