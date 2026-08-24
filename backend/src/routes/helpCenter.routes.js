const express = require('express');
const helpCenterController = require('../controllers/helpCenter.controller');
const { optionalVerifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/reports', optionalVerifyToken, helpCenterController.createReport);

module.exports = router;
