require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');

const db = require('./db');
const { migrate } = require('./db/schema');

migrate();

// Auto-seed on first boot only (fresh database with no users yet) so the
// app is usable immediately after `npm start`, without a separate manual step.
const userCount = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
if (userCount === 0) {
  console.log('No users found — running initial seed...');
  require('../seed/seed');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/users'));
app.use('/api/fleet', require('./routes/fleet'));
app.use('/api/maintenance', require('./routes/maintenance'));
app.use('/api/checklist', require('./routes/checklist'));
app.use('/api/usage', require('./routes/usage'));
app.use('/api/handover', require('./routes/handover'));
app.use('/api/defects', require('./routes/defects'));
app.use('/api/drivers', require('./routes/drivers'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/reports', require('./routes/reports'));

app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Serve the built React client in production (single-service deployment).
const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^(?!\/api\/).*/, (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Meryal Buggy Tracking System API listening on port ${PORT}`);
  console.log(`  This computer:   http://localhost:${PORT}`);
  // Print this machine's network addresses so other staff (e.g. the safety
  // officer) on the same Wi-Fi / LAN know which URL to open.
  for (const addrs of Object.values(require('os').networkInterfaces())) {
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal) console.log(`  Other computers: http://${a.address}:${PORT}`);
    }
  }
});
