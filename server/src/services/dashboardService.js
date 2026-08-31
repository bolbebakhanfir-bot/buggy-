const db = require('../db');

const HOME_POINT = 'Hotel Basement Car Parking';

function daysBetween(dateStr, from) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const base = from || new Date();
  const ms = target.setHours(0, 0, 0, 0) - new Date(base).setHours(0, 0, 0, 0);
  return Math.round(ms / 86400000);
}

function monthKey(dateStr) {
  return (dateStr || '').slice(0, 7); // YYYY-MM
}

// Builds the same KPI set as the workbook's "Dashboard" sheet, but computed
// live from current table state instead of frozen formulas, and reused by
// both the /api/dashboard endpoint and the daily PDF report.
function getDashboard(dateStr) {
  const today = dateStr || new Date().toISOString().slice(0, 10);
  const thisMonth = monthKey(today);

  const buggies = db.prepare('SELECT * FROM buggies').all();
  const fleetStatus = { Active: 0, 'In Maintenance': 0, 'Out of Service': 0, Retired: 0 };
  const availability = { active: [], inMaintenance: [], outOfService: [], retired: [] };
  for (const b of buggies) {
    fleetStatus[b.status] = (fleetStatus[b.status] || 0) + 1;
    if (b.status === 'Active') availability.active.push(b.buggy_id);
    else if (b.status === 'In Maintenance') availability.inMaintenance.push(b.buggy_id);
    else if (b.status === 'Out of Service') availability.outOfService.push(b.buggy_id);
    else if (b.status === 'Retired') availability.retired.push(b.buggy_id);
  }
  const totalFleet = buggies.length;

  const checklistsToday = db.prepare('SELECT * FROM checklists WHERE date = ?').all(today);
  const distinctChecked = new Set(checklistsToday.map((c) => c.buggy_id)).size;
  const notFitToday = checklistsToday.filter((c) => c.overall_result === 'Not Fit for Use').length;

  const handoversToday = db.prepare('SELECT * FROM handovers WHERE date = ?').all(today);
  const notAtBase = handoversToday.filter(
    (h) => (h.handover_point && h.handover_point !== HOME_POINT) || (h.other_location && h.other_location.trim())
  ).length;

  const defects = db.prepare('SELECT * FROM defects').all();
  const openDefects = defects.filter((d) => d.status === 'Open' || d.status === 'In Progress');
  const overdueDefects = openDefects.filter((d) => {
    const ageDays = daysBetween(today, d.date_reported); // today - date_reported, in days
    return ageDays !== null && ageDays > 3;
  });
  const criticalMajorOpen = openDefects.filter((d) => d.severity === 'Major' || d.severity === 'Critical').length;
  const closedThisMonth = defects.filter((d) => d.status === 'Closed' && monthKey(d.actual_close_date) === thisMonth).length;
  const severityBreakdown = { Minor: 0, Moderate: 0, Major: 0, Critical: 0 };
  for (const d of openDefects) severityBreakdown[d.severity] = (severityBreakdown[d.severity] || 0) + 1;

  const usageThisMonth = db.prepare('SELECT * FROM usage_logs WHERE substr(date, 1, 7) = ?').all(thisMonth);
  const totalUsageHours = usageThisMonth.reduce((sum, u) => sum + (Number(u.total_time_hrs) || 0), 0);

  const drivers = db.prepare('SELECT * FROM drivers').all();
  const certified = drivers.filter((d) => d.certification_status === 'Certified').length;
  const expiringSoon = drivers.filter((d) => d.certification_status === 'Expiring Soon').length;
  const expiredOrNotCertified = drivers.filter(
    (d) => d.certification_status === 'Expired' || d.certification_status === 'Not Certified'
  ).length;

  const maintenance = db.prepare('SELECT * FROM maintenance_schedule').all();
  let dueSoon = 0, overdue = 0, notScheduled = 0;
  for (const m of maintenance) {
    if (!m.next_service_due_date) { notScheduled += 1; continue; }
    const days = daysBetween(m.next_service_due_date, today);
    if (days < 0) overdue += 1;
    else if (days <= 7) dueSoon += 1;
  }

  return {
    date: today,
    fleetStatus: {
      total: totalFleet,
      active: fleetStatus.Active,
      inMaintenance: fleetStatus['In Maintenance'],
      outOfService: fleetStatus['Out of Service'],
      retired: fleetStatus.Retired,
    },
    safetyCompliance: {
      buggiesCheckedToday: distinctChecked,
      checklistCompliancePct: totalFleet ? Math.round((distinctChecked / totalFleet) * 1000) / 10 : 0,
      buggiesNotFitToday: notFitToday,
      handoversLoggedToday: handoversToday.length,
      handoversNotAtBase: notAtBase,
    },
    defectsMaintenance: {
      openDefects: openDefects.length,
      overdueDefects: overdueDefects.length,
      criticalMajorOpen,
      closedThisMonth,
      severityBreakdown,
    },
    usage: {
      totalUsageHoursMonth: Math.round(totalUsageHours * 10) / 10,
      usageEntriesMonth: usageThisMonth.length,
    },
    driverCertification: {
      driversOnRecord: drivers.length,
      certified,
      expiringSoon,
      expiredOrNotCertified,
    },
    preventiveMaintenance: {
      dueSoon,
      overdue,
      notScheduled,
    },
    fleetAvailability: {
      active: availability.active,
      inMaintenance: availability.inMaintenance,
      outOfService: availability.outOfService,
      retired: availability.retired,
      availabilityPct: totalFleet ? Math.round((availability.active.length / totalFleet) * 1000) / 10 : 0,
    },
  };
}

module.exports = { getDashboard };
