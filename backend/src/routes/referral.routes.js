const express = require('express');
const router = express.Router();

const referralController = require('../controllers/referral.controller');
const { verifyTokenAndStatus } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.get('/mine', verifyTokenAndStatus, requireRole('candidate'), referralController.listMyReferrals);
router.get('/lookup/:uniqueId', verifyTokenAndStatus, requireRole('candidate'), referralController.lookupCandidate);
router.post('/', verifyTokenAndStatus, requireRole('candidate'), referralController.createCandidateReferral);

// Recruiter only - identity check by unique ID
router.get('/:uniqueId', verifyTokenAndStatus, requireRole('recruiter'), referralController.lookupByUniqueId);

module.exports = router;
