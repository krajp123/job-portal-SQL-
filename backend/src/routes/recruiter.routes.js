const express = require('express');
const router = express.Router();

const recruiterAuth = require('../controllers/auth/recruiterAuth.controller');
const recruiterPasswordReset = require('../controllers/auth/recruiterPasswordReset.controller');
const recruiterController = require('../controllers/recruiter.controller');
const walletRoutes = require('./wallet.routes');
const { verifyTokenAndStatus } = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');
const requireRecruiterWorkspaceRole = require('../middleware/requireRecruiterWorkspaceRole');
const upload = require('../middleware/uploadHandler');
const { uploadProfilePicture } = require('../middleware/uploadHandler');

router.use('/wallet', walletRoutes);

// Public - Registration Payment Flow
router.post('/register/create-payment-order', recruiterAuth.createPaymentOrder);
router.post('/register/verify-payment', recruiterAuth.verifyPayment);
router.post(
  '/resume-registration/:recruiterId',
  upload.fields([
    { name: 'gstCertificate', maxCount: 1 },
    { name: 'cinCertificate', maxCount: 1 },
    { name: 'businessRegistrationCertificate', maxCount: 1 },
  ]),
  recruiterAuth.resumeRegistration
);
router.get('/resume-registration/:recruiterId', recruiterAuth.getResumeRegistration);
router.put(
  '/resume-registration/:recruiterId/draft',
  upload.fields([
    { name: 'gstFile', maxCount: 1 },
    { name: 'cinFile', maxCount: 1 },
    { name: 'bizRegFile', maxCount: 1 },
  ]),
  recruiterAuth.saveResumeRegistrationDraft
);

// Public
router.post(
  '/register',
  upload.fields([
    { name: 'gstFile', maxCount: 1 },
    { name: 'cinFile', maxCount: 1 },
    { name: 'bizRegFile', maxCount: 1 },
  ]),
  recruiterAuth.register
);
router.post('/login', recruiterAuth.login);
router.post('/password/forgot/send', recruiterPasswordReset.sendResetOtp);
router.post('/password/forgot/reset', recruiterPasswordReset.resetPassword);
router.get('/company-members', recruiterController.getCompanyMembers);
router.get('/:recruiterId/public-profile', recruiterController.getPublicProfile);

// Authenticated (recruiter only)
router.get('/me/profile', verifyTokenAndStatus, requireRole('recruiter'), recruiterController.getMyProfile);
router.get('/me/company-members', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.getMyCompanyMembers);
router.get('/dashboard/overview', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.getDashboardOverview);
router.put('/me/profile', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.updateMyProfile);
router.post('/me/upload-company-image', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), uploadProfilePicture.single('companyImage'), recruiterController.uploadCompanyImage);
router.put('/me/settings/:section', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.updateMySettings);
router.get('/me/team', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.listTeamMembers);
router.post('/me/team/invite', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('manageTeam'), recruiterController.inviteTeamMember);
router.delete('/me/team/:email', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('manageTeam'), recruiterController.removeTeamMember);
router.patch('/me/team/:email/role', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('manageTeam'), recruiterController.updateTeamMemberRole);
router.get('/me/invites', verifyTokenAndStatus, requireRole('recruiter'), recruiterController.listInvites);
router.post('/me/invites/accept', verifyTokenAndStatus, requireRole('recruiter'), recruiterController.acceptInvite);
router.post('/me/invites/decline', verifyTokenAndStatus, requireRole('recruiter'), recruiterController.declineInvite);
router.post('/me/change-password', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.changePassword);
router.put('/me/security', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.changePassword);
router.post('/me/upload-profile-picture', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), uploadProfilePicture.single('profilePicture'), recruiterController.uploadProfilePicture);
router.delete('/me/profile-picture', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.deleteProfilePicture);
router.get('/candidate/:candidateId/resume/availability', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.checkCandidateResumeAvailability);
router.get('/candidate/:candidateId/resume/download', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.downloadCandidateResume);
router.get('/resume-downloads', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.getDownloadedResumes);
router.delete('/resume-downloads/:paymentId', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('write'), recruiterController.deleteDownloadedResume);
router.get('/resume-downloads/:paymentId', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), recruiterController.downloadPurchasedResume);

// DEBUG TEST ENDPOINT - remove after debugging
router.get('/me/debug-languages', verifyTokenAndStatus, requireRole('recruiter'), requireRecruiterWorkspaceRole('read'), async (req, res) => {
  try {
    const Recruiter = require('../models/Recruiter');
    const recruiter = await Recruiter.findById(req.user.id).lean();
    res.json({
      recruiterId: recruiter._id,
      languages: recruiter?.languages,
      isArray: Array.isArray(recruiter?.languages),
      length: recruiter?.languages?.length,
      allFields: Object.keys(recruiter || {}),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;