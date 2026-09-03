const express = require('express');
const router = express.Router();

// Application routes loaded

// Log every request that reaches this router for debugging
router.use((req, res, next) => {
  next();
});

const applicationController = require('../controllers/application.controller');
const offerLetterController = require('../controllers/offerLetter.controller');
const { verifyTokenAndStatus } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireRecruiterWorkspaceRole = require('../middleware/requireRecruiterWorkspaceRole');
const upload = require('../middleware/uploadHandler');

// Candidate only
router.post('/', verifyTokenAndStatus, requireRole('candidate'), applicationController.apply);
router.get('/mine', verifyTokenAndStatus, requireRole('candidate'), applicationController.myApplications);
router.delete('/job/:jobId', verifyTokenAndStatus, requireRole('candidate'), applicationController.withdraw);

// Recruiter only
router.get('/recruiter', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), applicationController.applicantsForRecruiter);
router.get('/job/:jobId', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), applicationController.applicantsForJob);
router.patch('/:id/status', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), applicationController.updateStatus);
router.post('/:id/view', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), applicationController.trackView);
router.post('/:id/email', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), applicationController.emailCandidate);

// Offer letter / Hired badge flow (recruiter only)
router.post(
  '/offer-letters',
  verifyTokenAndStatus,
  requireRole('recruiter'),
  requireRecruiterWorkspaceRole('write'),
  upload.single('file'),
  offerLetterController.uploadOfferLetter
);
router.post(
  '/offer-letters/:id/signed',
  verifyTokenAndStatus,
  requireRole('recruiter'),
  requireRecruiterWorkspaceRole('write'),
  upload.single('file'),
  offerLetterController.uploadSignedAcceptance
);

module.exports = router;