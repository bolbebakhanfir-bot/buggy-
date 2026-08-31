import { useState } from 'react';
import { api } from '../api/client';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Reports() {
  const [date, setDate] = useState(todayStr());
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState('');

  async function handleDownload() {
    setDownloading(true);
    setError('');
    try {
      const blob = await api.getBlob(`/reports/daily.pdf?date=${date}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Buggy_Daily_Report_${date}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Daily Reports</h1>
          <p className="page-description">
            Generate and download a PDF snapshot of fleet KPIs and that day's checklist, usage,
            handover and defect activity.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="report-card">
        <label>
          Report Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} max={todayStr()} />
        </label>
        <button className="btn btn-primary" onClick={handleDownload} disabled={downloading}>
          {downloading ? 'Preparing PDF…' : 'Download Daily Report (PDF)'}
        </button>
      </div>
    </div>
  );
}
