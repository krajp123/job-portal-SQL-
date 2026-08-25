const express = require('express');
const helpCenterController = require('../controllers/helpCenter.controller');
const { optionalVerifyToken } = require('../middleware/auth');
const { supportRequestLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/reports', supportRequestLimiter, optionalVerifyToken, helpCenterController.createReport);

module.exports = router;
