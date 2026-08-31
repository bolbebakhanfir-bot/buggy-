const express = require('express');
const { requireAuth } = require('../auth');
const { getDashboard } = require('../services/dashboardService');

const router = express.Router();

// Every authenticated user (admin or operator) can view the live dashboard.
router.get('/', requireAuth, (req, res) => {
  res.json(getDashboard(req.query.date));
});

module.exports = router;
