const express = require('express');

const jobController = require('../controllers/job.controller');
const { verifyTokenAndStatus } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

const router = express.Router();

// Companies are derived from recruiters that currently have open jobs.
router.get('/top', verifyTokenAndStatus, requireRole('candidate'), jobController.topCompanies);

module.exports = router;