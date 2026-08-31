const db = require('./index');

// MODULES is the canonical list of permission-gated data modules, shared by
// the permissions middleware and the admin user-management UI.
const MODULES = [
  'fleet',
  'maintenance',
  'checklist',
  'usage',
  'handover',
  'defects',
  'drivers',
  'reports',
];

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','operator')),
      active INTEGER NOT NULL DEFAULT 1,
      permissions TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS buggies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buggy_id TEXT UNIQUE NOT NULL,
      vehicle_type TEXT,
      make_model TEXT,
      property_zone TEXT,
      assigned_area TEXT,
      registration_no TEXT,
      serial_number TEXT,
      year_in_service TEXT,
      status TEXT NOT NULL DEFAULT 'Active' CHECK(status IN ('Active','In Maintenance','Out of Service','Retired')),
      last_service_date TEXT,
      next_service_due TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS maintenance_schedule (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buggy_id TEXT NOT NULL,
      serial_number TEXT,
      vehicle_type TEXT,
      property_zone TEXT,
      service_interval TEXT,
      last_service_date TEXT,
      last_service_odometer TEXT,
      next_service_due_date TEXT,
      next_service_due_odometer TEXT,
      maintenance_status TEXT NOT NULL DEFAULT 'OK' CHECK(maintenance_status IN ('OK','Due Soon','Overdue','Not Scheduled')),
      assigned_technician TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS checklists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      buggy_id TEXT NOT NULL,
      shift TEXT,
      inspected_by TEXT,
      overall_result TEXT NOT NULL DEFAULT 'Fit for Use' CHECK(overall_result IN ('Fit for Use','Not Fit for Use')),
      defects_remarks TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      buggy_id TEXT NOT NULL,
      driver_name TEXT,
      time_out TEXT,
      time_in TEXT,
      total_time_hrs REAL,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS handovers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT,
      buggy_id TEXT NOT NULL,
      movement_type TEXT CHECK(movement_type IN ('Check-Out','Check-In')),
      security_officer TEXT,
      handover_point TEXT DEFAULT 'Hotel Basement Car Parking',
      other_location TEXT,
      driver_taking TEXT,
      driver_staff_id TEXT,
      driver_returning TEXT,
      battery_fuel_level TEXT,
      odometer_reading TEXT,
      damage_noted TEXT CHECK(damage_noted IN ('Yes','No')),
      damage_description TEXT,
      damage_photo_link TEXT,
      cleanliness_ok TEXT CHECK(cleanliness_ok IN ('Yes','No')),
      keys_accessories_complete TEXT CHECK(keys_accessories_complete IN ('Yes','No')),
      remarks TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS defects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      defect_code TEXT UNIQUE NOT NULL,
      date_reported TEXT NOT NULL,
      buggy_id TEXT NOT NULL,
      source TEXT,
      description TEXT,
      severity TEXT NOT NULL DEFAULT 'Minor' CHECK(severity IN ('Minor','Moderate','Major','Critical')),
      reported_by TEXT,
      action_taken TEXT,
      assigned_to TEXT,
      status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','In Progress','Closed')),
      actual_close_date TEXT,
      notes TEXT,
      created_by TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS drivers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      driver_name TEXT NOT NULL,
      staff_id TEXT,
      department TEXT,
      property TEXT,
      position_role TEXT,
      license_type TEXT,
      license_number TEXT,
      license_expiry TEXT,
      induction_completed TEXT CHECK(induction_completed IN ('Yes','No')),
      induction_date TEXT,
      refresher_due TEXT,
      certification_status TEXT NOT NULL DEFAULT 'Not Certified' CHECK(certification_status IN ('Certified','Expiring Soon','Expired','Not Certified')),
      certified_by TEXT,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_label TEXT,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_checklists_date ON checklists(date);
    CREATE INDEX IF NOT EXISTS idx_usage_logs_date ON usage_logs(date);
    CREATE INDEX IF NOT EXISTS idx_handovers_date ON handovers(date);
    CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
  `);
}

module.exports = { migrate, MODULES };
