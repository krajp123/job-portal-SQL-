const express = require('express');
const router = express.Router();

const jobController = require('../controllers/job.controller');
const jobModerationController = require('../controllers/jobModeration.controller');
const upload = require('../middleware/uploadHandler');
const { verifyTokenAndStatus, optionalVerifyToken } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireRecruiterWorkspaceRole = require('../middleware/requireRecruiterWorkspaceRole');

// Public
router.get('/', optionalVerifyToken, jobController.list);
router.get('/suggestions', optionalVerifyToken, jobController.suggestions);
router.get('/recommended', verifyTokenAndStatus, requireRole('candidate'), jobController.recommended);
router.post(
	'/analyze-resume',
	verifyTokenAndStatus,
	requireRole('candidate'),
	upload.uploadResume.single('resume'),
	jobController.analyzeResume
);
router.post('/resume-contact', verifyTokenAndStatus, requireRole('candidate'), jobController.resumeContact);
router.get('/mine/list', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), jobController.myJobs);
router.post('/:id/report', verifyTokenAndStatus, jobModerationController.reportJob);

// Recruiter only
router.post('/', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), jobController.create);
router.patch('/:id/close', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), jobController.closeJob);
router.post('/:id/reopen-request', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), jobController.requestReopen);
router.patch('/:id', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), jobController.update);
router.delete('/:id', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), jobController.remove);

// Keep dynamic routes last so named paths such as /recommended and /mine/list
// are not treated as a job ID.
router.get('/:id', optionalVerifyToken, jobController.getById);

module.exports = router;
