// Seeds the database with the fleet, preventive-maintenance and defects data
// extracted from the original "Meryal Buggy Daily Tracking System" workbook,
// plus the default admin/operator accounts. Safe to run multiple times: it
// only inserts rows/users that do not already exist.
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const db = require('../src/db');
const { migrate } = require('../src/db/schema');

migrate();

const raw = fs.readFileSync(path.join(__dirname, 'xlsx_seed_data.json'), 'utf8');
const data = JSON.parse(raw);

function seedFleet() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO buggies
      (buggy_id, vehicle_type, make_model, property_zone, assigned_area, registration_no, serial_number, year_in_service, status, last_service_date, next_service_due, notes)
    VALUES (@buggy_id, @vehicle_type, @make_model, @property_zone, @assigned_area, @registration_no, @serial_number, @year_in_service, @status, @last_service_date, @next_service_due, @notes)
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run({
        buggy_id: r['Buggy ID'],
        vehicle_type: r['Vehicle Type'],
        make_model: r['Make / Model'],
        property_zone: r['Property / Zone'],
        assigned_area: r['Assigned Area'],
        registration_no: r['Registration / Asset No.'],
        serial_number: r['Serial Number (Chassis / VIN)'],
        year_in_service: r['Year in Service'] ? String(r['Year in Service']) : null,
        status: r['Status'] || 'Active',
        last_service_date: r['Last Service Date'],
        next_service_due: r['Next Service Due'],
        notes: r['Notes'],
      });
    }
  });
  tx(data.fleet);
  console.log(`Fleet Register: ${data.fleet.length} buggies processed`);
}

function seedMaintenance() {
  const insert = db.prepare(`
    INSERT INTO maintenance_schedule
      (buggy_id, serial_number, vehicle_type, property_zone, service_interval, last_service_date, last_service_odometer, next_service_due_date, next_service_due_odometer, maintenance_status, assigned_technician, notes)
    VALUES (@buggy_id, @serial_number, @vehicle_type, @property_zone, @service_interval, @last_service_date, @last_service_odometer, @next_service_due_date, @next_service_due_odometer, @maintenance_status, @assigned_technician, @notes)
  `);
  const existing = db.prepare('SELECT COUNT(*) AS c FROM maintenance_schedule').get().c;
  if (existing > 0) {
    console.log('Preventive Maintenance Schedule already seeded, skipping');
    return;
  }
  const STATUS_MAP = { OK: 'OK', 'DUE SOON': 'Due Soon', OVERDUE: 'Overdue', 'NOT SCHEDULED': 'Not Scheduled' };
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      const rawStatus = (r['Maintenance Status'] || 'OK').toString().trim().toUpperCase();
      insert.run({
        buggy_id: r['Buggy ID'],
        serial_number: r['Serial Number (Chassis / VIN)'],
        vehicle_type: r['Vehicle Type'],
        property_zone: r['Property / Zone'],
        service_interval: r['Service Interval'],
        last_service_date: r['Last Service Date'],
        last_service_odometer: r['Last Service Odometer / Hours'] ? String(r['Last Service Odometer / Hours']) : null,
        next_service_due_date: r['Next Service Due Date'],
        next_service_due_odometer: r['Next Service Due Odometer / Hours'] ? String(r['Next Service Due Odometer / Hours']) : null,
        maintenance_status: STATUS_MAP[rawStatus] || 'OK',
        assigned_technician: r['Assigned Technician / Workshop'],
        notes: r['Notes'],
      });
    }
  });
  tx(data.maintenance);
  console.log(`Preventive Maintenance Schedule: ${data.maintenance.length} rows inserted`);
}

function seedDefects() {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO defects
      (defect_code, date_reported, buggy_id, source, description, severity, reported_by, action_taken, assigned_to, status, actual_close_date, notes)
    VALUES (@defect_code, @date_reported, @buggy_id, @source, @description, @severity, @reported_by, @action_taken, @assigned_to, @status, @actual_close_date, @notes)
  `);
  const tx = db.transaction((rows) => {
    for (const r of rows) {
      insert.run({
        defect_code: r['Defect ID'],
        date_reported: r['Date Reported'],
        buggy_id: r['Buggy ID'],
        source: r['Source'],
        description: r['Defect Description'],
        severity: r['Severity'] || 'Minor',
        reported_by: r['Reported By'],
        action_taken: r['Action Taken'],
        assigned_to: r['Assigned To'],
        status: r['Status'] || 'Open',
        actual_close_date: r['Actual Close Date'],
        notes: r['Notes'],
      });
    }
  });
  tx(data.defects);
  console.log(`Defects & Maintenance: ${data.defects.length} rows processed`);
}

const ALL_MODULES = ['fleet', 'maintenance', 'checklist', 'usage', 'handover', 'defects', 'drivers', 'reports'];

function fullPerms(on) {
  const p = {};
  for (const m of ALL_MODULES) p[m] = { view: on, add: on, edit: on, delete: on };
  return p;
}

function operatorDefaultPerms() {
  // Sensible default for a front-line operator: can view everything and log
  // day-to-day data entry (checklist, usage, handover, defects), but cannot
  // edit/delete records or touch fleet master data, maintenance planning,
  // reports or user management. Admin can change this per-operator anytime.
  const p = fullPerms(false);
  for (const m of ALL_MODULES) p[m].view = true;
  p.checklist.add = true;
  p.usage.add = true;
  p.handover.add = true;
  p.defects.add = true;
  p.reports.view = false; // daily PDF export is an admin capability by default; admin can grant it
  return p;
}

function seedUsers() {
  const insert = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, role, active, permissions)
    VALUES (?, ?, ?, ?, 1, ?)
  `);
  const existingAdmin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existingAdmin) {
    const hash = bcrypt.hashSync('Admin@123', 10);
    insert.run('admin', hash, 'System Administrator', 'admin', JSON.stringify(fullPerms(true)));
    console.log('Created default admin user -> username: admin | password: Admin@123');
  }
  const existingOperator = db.prepare('SELECT id FROM users WHERE username = ?').get('operator');
  if (!existingOperator) {
    const hash = bcrypt.hashSync('Operator@123', 10);
    insert.run('operator', hash, 'Demo Operator', 'operator', JSON.stringify(operatorDefaultPerms()));
    console.log('Created demo operator user -> username: operator | password: Operator@123');
  }
}

seedFleet();
seedMaintenance();
seedDefects();
seedUsers();
console.log('Seeding complete.');
