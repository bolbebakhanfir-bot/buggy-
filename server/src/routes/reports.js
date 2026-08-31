const express = require('express');
const { requireAuth, requirePermission } = require('../auth');
const { buildDailyReportPdf } = require('../services/pdfReport');

const router = express.Router();

router.get('/daily.pdf', requireAuth, requirePermission('reports', 'view'), (req, res) => {
  try {
    buildDailyReportPdf(res, req.query.date);
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
  }
});

module.exports = router;
