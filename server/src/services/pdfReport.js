const PDFDocument = require('pdfkit');
const db = require('../db');
const { getDashboard } = require('./dashboardService');

const PAGE_MARGIN = 36;
const PROPERTY_LINE = 'Rixos Premium Qetaifan Island North | Meryal Water Park & Azure Beach Club Doha';

function truncate(str, len) {
  if (!str) return '';
  const s = String(str);
  return s.length > len ? s.slice(0, len - 1) + '…' : s;
}

function drawSectionTitle(doc, text) {
  if (doc.y > doc.page.height - 120) doc.addPage();
  doc.moveDown(0.6);
  doc.fontSize(12).fillColor('#0f4c81').font('Helvetica-Bold').text(text);
  doc.moveTo(PAGE_MARGIN, doc.y + 2).lineTo(doc.page.width - PAGE_MARGIN, doc.y + 2).strokeColor('#0f4c81').stroke();
  doc.moveDown(0.4);
  doc.fillColor('black').font('Helvetica');
}

function drawTable(doc, columns, rows, emptyMessage) {
  const startX = PAGE_MARGIN;
  const tableWidth = doc.page.width - PAGE_MARGIN * 2;
  const widths = columns.map((c) => (c.width ? c.width : tableWidth / columns.length));
  const rowHeight = 16;

  function drawHeaderAt(y) {
    doc.rect(startX, y, tableWidth, rowHeight).fill('#0f4c81');
    doc.font('Helvetica-Bold').fontSize(8).fillColor('white');
    let x = startX;
    for (let i = 0; i < columns.length; i++) {
      doc.text(columns[i].label, x + 3, y + 4, { width: widths[i] - 6, height: rowHeight, ellipsis: true });
      x += widths[i];
    }
    doc.fillColor('black').font('Helvetica');
    return y + rowHeight;
  }

  let cursorY = drawHeaderAt(doc.y);

  if (!rows || rows.length === 0) {
    doc.fontSize(8).fillColor('#666').text(emptyMessage || 'No records for this date.', startX + 3, cursorY + 4);
    doc.y = cursorY + rowHeight + 6;
    return;
  }

  for (const row of rows) {
    if (cursorY > doc.page.height - 80) {
      doc.addPage();
      cursorY = drawHeaderAt(PAGE_MARGIN);
    }
    doc.rect(startX, cursorY, tableWidth, rowHeight).strokeColor('#dddddd').stroke();
    doc.fontSize(7.5).fillColor('black');
    let x = startX;
    for (let i = 0; i < columns.length; i++) {
      const val = columns[i].get(row);
      doc.text(truncate(val, columns[i].maxLen || 60), x + 3, cursorY + 4, {
        width: widths[i] - 6,
        height: rowHeight,
        ellipsis: true,
      });
      x += widths[i];
    }
    cursorY += rowHeight;
  }
  doc.y = cursorY + 6;
}

function kpiLine(doc, label, value) {
  doc.fontSize(9).font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(String(value));
}

function buildDailyReportPdf(res, dateStr) {
  const date = dateStr || new Date().toISOString().slice(0, 10);
  const kpi = getDashboard(date);

  const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4' });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Buggy_Daily_Report_${date}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').fillColor('#0f4c81').text('MERYAL BUGGY DAILY TRACKING SYSTEM');
  doc.fontSize(9).font('Helvetica').fillColor('black').text(PROPERTY_LINE);
  doc.moveDown(0.3);
  doc.fontSize(14).font('Helvetica-Bold').text(`Daily Report — ${date}`);
  doc.fontSize(8).font('Helvetica').fillColor('#666')
    .text(`Generated ${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`);
  doc.fillColor('black');

  drawSectionTitle(doc, 'Fleet Status');
  kpiLine(doc, 'Total Buggies in Fleet', kpi.fleetStatus.total);
  kpiLine(doc, 'Active', kpi.fleetStatus.active);
  kpiLine(doc, 'In Maintenance', kpi.fleetStatus.inMaintenance);
  kpiLine(doc, 'Out of Service', kpi.fleetStatus.outOfService);
  kpiLine(doc, 'Retired', kpi.fleetStatus.retired);
  kpiLine(doc, 'Fleet Availability %', `${kpi.fleetAvailability.availabilityPct}%`);

  drawSectionTitle(doc, "Today's Safety Compliance");
  kpiLine(doc, 'Buggies Checked Today', kpi.safetyCompliance.buggiesCheckedToday);
  kpiLine(doc, 'Checklist Compliance %', `${kpi.safetyCompliance.checklistCompliancePct}%`);
  kpiLine(doc, 'Buggies NOT Fit For Use Today', kpi.safetyCompliance.buggiesNotFitToday);
  kpiLine(doc, 'Handovers Logged Today', kpi.safetyCompliance.handoversLoggedToday);
  kpiLine(doc, 'Handovers NOT at Hotel Basement Car Parking', kpi.safetyCompliance.handoversNotAtBase);

  drawSectionTitle(doc, 'Defects & Maintenance');
  kpiLine(doc, 'Open Defects (Open + In Progress)', kpi.defectsMaintenance.openDefects);
  kpiLine(doc, 'Overdue Defects (Open > 3 days)', kpi.defectsMaintenance.overdueDefects);
  kpiLine(doc, 'Critical / Major Defects Open', kpi.defectsMaintenance.criticalMajorOpen);
  kpiLine(doc, 'Defects Closed This Month', kpi.defectsMaintenance.closedThisMonth);
  kpiLine(doc, 'Open by Severity', `Minor ${kpi.defectsMaintenance.severityBreakdown.Minor} | Moderate ${kpi.defectsMaintenance.severityBreakdown.Moderate} | Major ${kpi.defectsMaintenance.severityBreakdown.Major} | Critical ${kpi.defectsMaintenance.severityBreakdown.Critical}`);

  drawSectionTitle(doc, 'Usage (This Month)');
  kpiLine(doc, 'Total Usage Hours', kpi.usage.totalUsageHoursMonth);
  kpiLine(doc, 'Usage Log Entries', kpi.usage.usageEntriesMonth);

  drawSectionTitle(doc, 'Preventive Maintenance');
  kpiLine(doc, 'Buggies Due Soon (<=7 days)', kpi.preventiveMaintenance.dueSoon);
  kpiLine(doc, 'Buggies Overdue for Service', kpi.preventiveMaintenance.overdue);
  kpiLine(doc, 'Buggies Not Yet Scheduled', kpi.preventiveMaintenance.notScheduled);

  drawSectionTitle(doc, 'Driver Certification & Training');
  kpiLine(doc, 'Drivers on Record', kpi.driverCertification.driversOnRecord);
  kpiLine(doc, 'Certified', kpi.driverCertification.certified);
  kpiLine(doc, 'Expiring Soon (<=30 days)', kpi.driverCertification.expiringSoon);
  kpiLine(doc, 'Expired / Not Certified', kpi.driverCertification.expiredOrNotCertified);

  // Detailed daily records
  const checklists = db.prepare('SELECT * FROM checklists WHERE date = ? ORDER BY buggy_id').all(date);
  drawSectionTitle(doc, 'Daily Pre-Use Checklist');
  drawTable(
    doc,
    [
      { label: 'Buggy', get: (r) => r.buggy_id, width: 45 },
      { label: 'Shift', get: (r) => r.shift, width: 55 },
      { label: 'Inspected By', get: (r) => r.inspected_by, width: 100 },
      { label: 'Result', get: (r) => r.overall_result, width: 85 },
      { label: 'Defects / Remarks', get: (r) => r.defects_remarks, width: doc.page.width - PAGE_MARGIN * 2 - 285 },
    ],
    checklists
  );

  const usageLogs = db.prepare('SELECT * FROM usage_logs WHERE date = ? ORDER BY buggy_id').all(date);
  drawSectionTitle(doc, 'Driver Usage Log');
  drawTable(
    doc,
    [
      { label: 'Buggy', get: (r) => r.buggy_id, width: 45 },
      { label: 'Driver', get: (r) => r.driver_name, width: 120 },
      { label: 'Time Out', get: (r) => r.time_out, width: 65 },
      { label: 'Time In', get: (r) => r.time_in, width: 65 },
      { label: 'Hours', get: (r) => r.total_time_hrs, width: 45 },
      { label: 'Notes', get: (r) => r.notes, width: doc.page.width - PAGE_MARGIN * 2 - 340 },
    ],
    usageLogs
  );

  const handovers = db.prepare('SELECT * FROM handovers WHERE date = ? ORDER BY time').all(date);
  drawSectionTitle(doc, 'Handover / Takeover Log');
  drawTable(
    doc,
    [
      { label: 'Time', get: (r) => r.time, width: 40 },
      { label: 'Buggy', get: (r) => r.buggy_id, width: 40 },
      { label: 'Type', get: (r) => r.movement_type, width: 60 },
      { label: 'Officer', get: (r) => r.security_officer, width: 80 },
      { label: 'Driver', get: (r) => r.driver_taking || r.driver_returning, width: 80 },
      { label: 'Damage?', get: (r) => r.damage_noted, width: 45 },
      { label: 'Remarks', get: (r) => r.remarks, width: doc.page.width - PAGE_MARGIN * 2 - 345 },
    ],
    handovers
  );

  const openDefects = db
    .prepare("SELECT * FROM defects WHERE status IN ('Open','In Progress') ORDER BY severity DESC, date_reported ASC")
    .all();
  drawSectionTitle(doc, 'Open Defects (All Fleet, as of report date)');
  drawTable(
    doc,
    [
      { label: 'Code', get: (r) => r.defect_code, width: 45 },
      { label: 'Buggy', get: (r) => r.buggy_id, width: 40 },
      { label: 'Severity', get: (r) => r.severity, width: 55 },
      { label: 'Status', get: (r) => r.status, width: 60 },
      { label: 'Reported', get: (r) => r.date_reported, width: 60 },
      { label: 'Description', get: (r) => r.description, width: doc.page.width - PAGE_MARGIN * 2 - 260 },
    ],
    openDefects,
    'No open defects.'
  );

  doc.end();
}

module.exports = { buildDailyReportPdf };
