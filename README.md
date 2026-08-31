# Meryal Buggy Daily Tracking System

A web application for tracking the buggy/golf-cart fleet at Rixos Premium
Qetaifan Island North, Meryal Water Park and Azure Beach Club Doha — built
from the original "Meryal Buggy Daily Tracking System" workbook (Fleet
Register, Preventive Maintenance, Daily Pre-Use Checklist, Driver Usage Log,
Handover/Takeover Log, Defects & Maintenance, Driver Certification).

## Features

- **Admin login** — full access: create/edit/delete any record, manage
  operator accounts and their permissions, download daily PDF reports.
- **Operator login** — access limited to exactly what the admin grants, per
  module (Fleet, Maintenance, Checklist, Usage Log, Handover Log, Defects,
  Driver Certification, Reports) and per action (view / add / edit / delete).
  Permission changes and account disabling take effect immediately on the
  operator's next request, without needing to log out.
- **Live dashboard** — the same KPIs as the workbook's Dashboard sheet
  (fleet status, today's safety compliance, open/overdue/critical defects,
  usage hours, driver certification, preventive maintenance, fleet
  availability), recomputed from live data and auto-refreshing every 10s.
- **Daily PDF report** — admins can download a one-click PDF snapshot of the
  dashboard KPIs plus that day's checklist, usage log, handover log and open
  defects, for any date.
- Seeded with the real Fleet Register (51 buggies), Preventive Maintenance
  Schedule and Defects & Maintenance history from the original workbook.

## Stack

- **Server**: Node.js, Express, SQLite (`better-sqlite3`), JWT auth,
  `pdfkit` for PDF generation.
- **Client**: React (Vite), React Router. No UI framework — plain CSS.

## Getting started

```bash
# 1. Install and seed the server (creates server/data/buggy_tracking.db)
cd server
npm install
npm run seed          # optional — seeding also runs automatically on first boot

# 2. Install and build the client
cd ../client
npm install
npm run build

# 3. Start the server (serves the API and the built client on one port)
cd ../server
npm start
```

Open http://localhost:4000.

### Default accounts (change these passwords after first login)

| Role     | Username   | Password        |
|----------|------------|-----------------|
| Admin    | `admin`    | `Admin@123`     |
| Operator | `operator` | `Operator@123`  |

### Development mode (hot reload)

Run the API and the Vite dev server separately — Vite proxies `/api` to
`http://localhost:4000`:

```bash
# terminal 1
cd server && npm run dev

# terminal 2
cd client && npm run dev   # http://localhost:5173
```

## Configuration

Copy `server/.env.example` to `server/.env` and set `JWT_SECRET` to a long
random string before deploying anywhere the default dev secret would be a
problem. `PORT` defaults to `4000`.

## Data model

Each workbook tab maps to a table and a permission module:

| Module        | Table                 | Notes |
|---------------|------------------------|-------|
| `fleet`       | `buggies`              | Fleet Register (master list) |
| `maintenance` | `maintenance_schedule` | Preventive Maintenance Schedule |
| `checklist`   | `checklists`           | Daily Pre-Use Checklist |
| `usage`       | `usage_logs`           | Driver Usage Log |
| `handover`    | `handovers`            | Handover / Takeover Log |
| `defects`     | `defects`               | Defects & Maintenance Tracker (auto-numbered `DEF-xxx`) |
| `drivers`     | `drivers`               | Driver Certification & Training |
| `reports`     | —                       | Governs who can download the daily PDF |

Every create/update/delete is written to an `audit_log` table (who, what,
when) for admin oversight.

## Permissions model

An operator account stores a permissions object per module:
`{ view, add, edit, delete }`, all `false` by default. The admin sets these
per-account on the **Admin: Users & Permissions** page. Admin accounts
always have full access to every module and cannot be permission-limited.
The last remaining admin account cannot be demoted, disabled or deleted, so
the system can never be locked out of admin access.
