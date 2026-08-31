import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

const REFRESH_MS = 10000;

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card${tone ? ` stat-${tone}` : ''}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Bar({ segments, total }) {
  return (
    <div className="bar-chart">
      {segments.map((s) => (
        <div
          key={s.label}
          className="bar-segment"
          style={{ width: total ? `${(s.value / total) * 100}%` : 0, background: s.color }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  async function load() {
    try {
      const d = await api.get('/dashboard');
      setData(d);
      setLastUpdated(new Date());
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
    timerRef.current = setInterval(load, REFRESH_MS);
    return () => clearInterval(timerRef.current);
  }, []);

  if (error && !data) return <div className="alert alert-error">{error}</div>;
  if (!data) return <div className="empty-state">Loading dashboard…</div>;

  const { fleetStatus, safetyCompliance, defectsMaintenance, usage, driverCertification, preventiveMaintenance, fleetAvailability } = data;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Buggy Fleet Dashboard</h1>
          <p className="page-description">
            Live KPIs — recalculated on every load, auto-refreshing every {REFRESH_MS / 1000}s.
          </p>
        </div>
        <div className="dashboard-updated">
          {lastUpdated && <>Updated {lastUpdated.toLocaleTimeString()}</>}
        </div>
      </div>

      <section className="dashboard-section">
        <h2>Fleet Status</h2>
        <div className="stat-grid">
          <StatCard label="Total Buggies in Fleet" value={fleetStatus.total} />
          <StatCard label="Active" value={fleetStatus.active} tone="good" />
          <StatCard label="In Maintenance" value={fleetStatus.inMaintenance} tone="warn" />
          <StatCard label="Out of Service" value={fleetStatus.outOfService} tone="bad" />
          <StatCard label="Retired" value={fleetStatus.retired} />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Fleet Availability</h2>
        <Bar
          total={fleetStatus.total}
          segments={[
            { label: 'Active', value: fleetAvailability.active.length, color: '#1f9d55' },
            { label: 'In Maintenance', value: fleetAvailability.inMaintenance.length, color: '#e0a800' },
            { label: 'Out of Service', value: fleetAvailability.outOfService.length, color: '#d64545' },
            { label: 'Retired', value: fleetAvailability.retired.length, color: '#9aa0a6' },
          ]}
        />
        <div className="bar-legend">
          <span><i style={{ background: '#1f9d55' }} /> Active</span>
          <span><i style={{ background: '#e0a800' }} /> In Maintenance</span>
          <span><i style={{ background: '#d64545' }} /> Out of Service</span>
          <span><i style={{ background: '#9aa0a6' }} /> Retired</span>
          <span className="bar-legend-pct">Availability: {fleetAvailability.availabilityPct}%</span>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Today's Safety Compliance</h2>
        <div className="stat-grid">
          <StatCard label="Buggies Checked Today" value={safetyCompliance.buggiesCheckedToday} />
          <StatCard label="Checklist Compliance %" value={`${safetyCompliance.checklistCompliancePct}%`} />
          <StatCard label="NOT Fit For Use Today" value={safetyCompliance.buggiesNotFitToday} tone={safetyCompliance.buggiesNotFitToday > 0 ? 'bad' : 'good'} />
          <StatCard label="Handovers Logged Today" value={safetyCompliance.handoversLoggedToday} />
          <StatCard label="Handovers NOT at Base Point" value={safetyCompliance.handoversNotAtBase} tone={safetyCompliance.handoversNotAtBase > 0 ? 'warn' : 'good'} />
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Defects & Maintenance</h2>
        <div className="stat-grid">
          <StatCard label="Open Defects" value={defectsMaintenance.openDefects} tone="warn" />
          <StatCard label="Overdue Defects (&gt;3 days)" value={defectsMaintenance.overdueDefects} tone="bad" />
          <StatCard label="Critical / Major Open" value={defectsMaintenance.criticalMajorOpen} tone="bad" />
          <StatCard label="Closed This Month" value={defectsMaintenance.closedThisMonth} tone="good" />
        </div>
        <Bar
          total={defectsMaintenance.openDefects}
          segments={[
            { label: 'Minor', value: defectsMaintenance.severityBreakdown.Minor, color: '#93c5fd' },
            { label: 'Moderate', value: defectsMaintenance.severityBreakdown.Moderate, color: '#e0a800' },
            { label: 'Major', value: defectsMaintenance.severityBreakdown.Major, color: '#f0653b' },
            { label: 'Critical', value: defectsMaintenance.severityBreakdown.Critical, color: '#d64545' },
          ]}
        />
        <div className="bar-legend">
          <span><i style={{ background: '#93c5fd' }} /> Minor {defectsMaintenance.severityBreakdown.Minor}</span>
          <span><i style={{ background: '#e0a800' }} /> Moderate {defectsMaintenance.severityBreakdown.Moderate}</span>
          <span><i style={{ background: '#f0653b' }} /> Major {defectsMaintenance.severityBreakdown.Major}</span>
          <span><i style={{ background: '#d64545' }} /> Critical {defectsMaintenance.severityBreakdown.Critical}</span>
        </div>
      </section>

      <div className="dashboard-columns">
        <section className="dashboard-section">
          <h2>Usage (This Month)</h2>
          <div className="stat-grid">
            <StatCard label="Total Usage Hours" value={usage.totalUsageHoursMonth} />
            <StatCard label="Usage Log Entries" value={usage.usageEntriesMonth} />
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Preventive Maintenance</h2>
          <div className="stat-grid">
            <StatCard label="Due Soon (&le;7 days)" value={preventiveMaintenance.dueSoon} tone="warn" />
            <StatCard label="Overdue" value={preventiveMaintenance.overdue} tone="bad" />
            <StatCard label="Not Yet Scheduled" value={preventiveMaintenance.notScheduled} />
          </div>
        </section>

        <section className="dashboard-section">
          <h2>Driver Certification</h2>
          <div className="stat-grid">
            <StatCard label="On Record" value={driverCertification.driversOnRecord} />
            <StatCard label="Certified" value={driverCertification.certified} tone="good" />
            <StatCard label="Expiring Soon" value={driverCertification.expiringSoon} tone="warn" />
            <StatCard label="Expired / Not Certified" value={driverCertification.expiredOrNotCertified} tone="bad" />
          </div>
        </section>
      </div>
    </div>
  );
}
