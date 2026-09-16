const Application = require('../models/Application');
const Referral = require('../models/Referral');
const Job = require('../models/Job');
const Recruiter = require('../models/Recruiter');
const Candidate = require('../models/Candidate');
const OfferLetter = require('../models/OfferLetter');
const CandidatePerformanceEvent = require('../models/CandidatePerformanceEvent');
const { checkFirstApplicationBadge, updateApplicationStreak } = require('../services/badge.service');
const { createNotification } = require('../services/notification.service');
const { sendEmail, sendShortlistEmail, sendInterviewScheduleEmail, sendRejectionEmail } = require('../services/email.service');
const { getPlatformSettings } = require('../services/platformSettings.service');

function workspaceRecruiterId(req) {
  return req.workspaceOwnerId || req.user.id;
}

const APPLICATION_FIELD_TYPES = new Set(['text', 'textarea', 'number', 'radio', 'checkbox', 'select', 'skills', 'date', 'url', 'file']);

function validateApplicationAnswers(fields, submittedAnswers) {
  const answers = Array.isArray(submittedAnswers) ? submittedAnswers : [];
  const configured = new Map((fields || []).map((field) => [field.fieldId, field]));
  const submittedIds = new Set();
  const normalized = [];

  for (const answer of answers) {
    const field = configured.get(String(answer?.fieldId || ''));
    if (!field || submittedIds.has(field.fieldId)) throw new Error('Invalid application field.');
    submittedIds.add(field.fieldId);
    const value = answer.value;
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (field.required && empty) throw new Error('Please complete all required fields.');
    if (empty) continue;
    const choiceOptions = field.options?.length ? field.options : field.fieldType === 'radio' ? ['Yes', 'No'] : [];
    if (['radio', 'select'].includes(field.fieldType) && choiceOptions.length && !choiceOptions.includes(String(value))) throw new Error('Invalid application field.');
    if (field.fieldType === 'checkbox') {
      if (field.options?.length && (!Array.isArray(value) || value.some((item) => !field.options.includes(String(item))))) throw new Error('Invalid application field.');
    }
    if (field.fieldType === 'skills' && (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || !item.trim()) || value.length > 50)) throw new Error('Invalid application field.');
    if (field.fieldType === 'number' && (!Number.isFinite(Number(value)) || String(value).length > 30)) throw new Error('Invalid application field.');
    if (field.fieldType === 'url') {
      try { new URL(String(value)); } catch { throw new Error('Invalid application field.'); }
    }
    if (field.fieldType === 'date' && Number.isNaN(Date.parse(String(value)))) throw new Error('Invalid application field.');
    if (!APPLICATION_FIELD_TYPES.has(field.fieldType)) throw new Error('Invalid application field.');
    normalized.push({ fieldId: field.fieldId, label: field.label, fieldType: field.fieldType, value });
  }

  for (const field of fields || []) {
    if (field.required && !submittedIds.has(field.fieldId)) throw new Error('Please complete all required fields.');
  }
  return normalized;
}

function emitToUser(userId, event, payload) {
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    if (io && userId) io.to(`user:${userId}`).emit(event, payload);
  } catch (error) {
    console.error(`Unable to emit ${event}:`, error.message);
  }
}

function candidateForRecruiter(candidate, hiredCandidateIds) {
  if (!candidate) return candidate;
  const plainCandidate = candidate.toObject ? candidate.toObject() : { ...candidate };
  if (!hiredCandidateIds.has(String(plainCandidate._id))) {
    plainCandidate.hiredBadge = {
      ...(plainCandidate.hiredBadge || {}),
      isHired: false,
    };
  }
  return plainCandidate;
}

// Helper function to calculate skill matching
const calculateSkillMatch = (candidateSkills = [], jobSkills = []) => {
  if (jobSkills.length === 0) return { matchedSkills: [], skillsMatch: 0 };
  
  const normalizedCandidateSkills = candidateSkills.map(s => s.toLowerCase().trim());
  const normalizedJobSkills = jobSkills.map(s => s.toLowerCase().trim());
  
  const matchedSkills = normalizedJobSkills.filter(skill => 
    normalizedCandidateSkills.includes(skill)
  );
  
  const skillsMatch = Math.round((matchedSkills.length / normalizedJobSkills.length) * 100);
  
  return { matchedSkills, skillsMatch };
};

// POST /api/applications (candidate only)
exports.apply = async (req, res) => {
  try {
    const { jobId, answers } = req.body;
    const Candidate = require('../models/Candidate');

    const job = await Job.findById(jobId);
    if (!job || job.status !== 'open') {
      return res.status(400).json({ error: 'This job is no longer accepting applications.' });
    }

    const [candidate, settings] = await Promise.all([
      Candidate.findById(req.user.id).select('candidateCategory emailVerified name email phone profile accountStatus workStatus'),
      getPlatformSettings(),
    ]);
    if (!candidate?.candidateCategory) {
      return res.status(403).json({ error: 'Candidate category not found.' });
    }
    if (job.category !== candidate.candidateCategory) {
      return res.status(403).json({ error: 'You are not authorized to apply for this job.' });
    }

    const referredJob = await Referral.findOne({ referredCandidate: req.user.id, job: jobId }).select('_id').lean();
    if (referredJob) {
      return res.status(403).json({ error: 'This job was referred to you. Applications are not required for referred jobs.', code: 'REFERRED_JOB_APPLICATION_BLOCKED' });
    }
    if (settings.emailVerificationRequired && !candidate?.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email before applying to jobs.', code: 'EMAIL_VERIFICATION_REQUIRED' });
    }

    const existing = await Application.findOne({ candidate: req.user.id, job: jobId });
    if (existing) {
      return res.status(409).json({ error: 'You have already applied for this job.' });
    }

    let validatedAnswers;
    try {
      validatedAnswers = validateApplicationAnswers(job.applicationForm?.enabled ? job.applicationForm.fields : [], answers);
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const profile = candidate?.profile || {};
    validatedAnswers = [
      { fieldId: 'full_name', label: 'Full Name', fieldType: 'text', value: candidate?.name || '' },
      { fieldId: 'email', label: 'Email', fieldType: 'text', value: candidate?.email || '' },
      { fieldId: 'phone', label: 'Phone Number', fieldType: 'text', value: candidate?.phone || profile.phone || '' },
      { fieldId: 'resume', label: 'Resume', fieldType: 'file', value: profile.resumeUrl ? { fileId: profile.resumeUrl, fileName: profile.resumeFilename || 'Resume' } : null },
      ...validatedAnswers,
    ];

    // Get candidate profile for skill matching
    const candidateSkills = candidate?.profile?.skills || [];
    
    // Calculate skill matching
    const { matchedSkills, skillsMatch } = calculateSkillMatch(candidateSkills, job.skillsRequired || []);

    const application = await Application.create({
      candidate: req.user.id,
      job: jobId,
      recruiter: job.postedBy,
      appliedAt: new Date(),
      matchedSkills,
      skillsMatch,
      experienceMatch: candidate?.workStatus === 'experienced',
      answers: validatedAnswers,
    });

    // Gamification (non-fatal if either fails)
    try {
      await checkFirstApplicationBadge(req.user.id);
      await updateApplicationStreak(req.user.id);
    } catch (gamErr) {
      console.error('Gamification update failed:', gamErr.message);
    }

    emitToUser(job.postedBy, 'applicationUpdated', {
      type: 'created',
      application,
    });
    res.status(201).json(application);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ error: 'You have already applied for this job.' });
    res.status(500).json({ error: 'Could not submit your application.' });
  }
};

// GET /api/applications/mine (candidate only)
exports.myApplications = async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate({
        path: 'job',
        select: 'title description location salary experienceLevel skillsRequired postedBy',
        populate: {
          path: 'postedBy',
          select: 'companyName companyLogoUrl rating'
        }
      })
      .sort({ appliedAt: -1 });
    
    res.json(applications.filter((application) => application.job));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/applications/recruiter (recruiter only)
exports.applicantsForRecruiter = async (req, res) => {
  try {
    const applications = await Application.find({ recruiter: workspaceRecruiterId(req) })
      .populate({
        path: 'candidate',
        select: '-passwordHash -phone',
      })
      .populate({
        path: 'job',
        select: 'title description location salary experienceLevel skillsRequired postedBy',
        populate: {
          path: 'postedBy',
          select: 'companyName companyLogoUrlUrl rating'
        }
      })
      .sort({ appliedAt: -1 });

    const validApplications = applications.filter((application) => application.job);
    const referrals = req.query.includeReferrals === 'true'
      ? await Referral.find({ job: { $in: (await Job.find({ postedBy: workspaceRecruiterId(req) }).select('_id').lean()).map((job) => job._id) } })
        .populate({ path: 'referredCandidate', select: '-passwordHash -phone' })
        .populate('referrer', 'name uniqueId')
        .populate('job', 'title description location salary experienceLevel skillsRequired postedBy')
        .sort({ createdAt: -1 })
        .lean()
      : [];
    const applicationByCandidateAndJob = new Map(
      validApplications.map((application) => [`${application.job._id}:${application.candidate?._id}`, application]),
    );
    const referralByApplication = new Map();
    referrals.forEach((referral) => {
      const key = `${referral.job?._id}:${referral.referredCandidate?._id}`;
      const application = applicationByCandidateAndJob.get(key);
      if (application) {
        application.referral = referral;
        application.isReferral = true;
        referralByApplication.set(String(application._id), referral);
      } else if (referral.job && referral.referredCandidate) {
        validApplications.push({
          _id: referral._id,
          candidate: referral.referredCandidate,
          job: referral.job,
          recruiter: workspaceRecruiterId(req),
          status: referral.status || 'referred',
          appliedAt: referral.createdAt,
          updatedAt: referral.updatedAt || referral.createdAt,
          isReferral: true,
          referral,
          answers: [],
        });
      }
    });
    const hiredCandidateIds = new Set(
      (await Application.distinct('candidate', { status: 'hired' })).map((id) => String(id))
    );
    const offerLetters = await OfferLetter.find({ application: { $in: applications.map((application) => application._id) } })
      .select('_id application signedAcceptanceUrl signedUploadedAt')
      .lean();
    const offerLetterByApplication = new Map(offerLetters.map((offerLetter) => [String(offerLetter.application), offerLetter]));
    res.json(validApplications.map((application) => ({
      ...(application.toObject ? application.toObject() : application),
      candidate: candidateForRecruiter(application.candidate, hiredCandidateIds),
      offerLetter: offerLetterByApplication.get(String(application._id)) || null,
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/applications/:id/email (recruiter only)
exports.emailCandidate = async (req, res) => {
  try {
    const { subject, body } = req.body;
    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: 'Subject and message are required.' });
    }

    const application = await Application.findOne({ _id: req.params.id, recruiter: workspaceRecruiterId(req) })
      .populate('candidate', 'name email')
      .populate('job', 'title');
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (!application.candidate?.email) return res.status(400).json({ error: 'Candidate email is not available.' });

    const result = await sendEmail({
      to: application.candidate.email,
      subject: subject.trim(),
      body: body.trim(),
    });
    if (result?.sent === false) return res.status(503).json({ error: result.error || 'Email service is unavailable.' });
    res.json({ message: 'Email sent successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to send email.' });
  }
};

// GET /api/applications/job/:jobId (recruiter only) - Section 5, recruiter dashboard
exports.applicantsForJob = async (req, res) => {
  try {
    const applications = await Application.find({
      job: req.params.jobId,
      recruiter: workspaceRecruiterId(req),
    })
      .populate({
        path: 'candidate',
        select: '-passwordHash -phone',
      })
      .populate({
        path: 'job',
        select: 'title description location salary experienceLevel skillsRequired postedBy',
        populate: {
          path: 'postedBy',
          select: 'companyName companyLogoUrl rating'
        }
      })
      .sort({ appliedAt: -1 });

    const hiredCandidateIds = new Set(
      (await Application.distinct('candidate', { status: 'hired' })).map((id) => String(id))
    );
    res.json(applications.map((application) => ({
      ...application.toObject(),
      candidate: candidateForRecruiter(application.candidate, hiredCandidateIds),
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/applications/job/:jobId (candidate only) — withdraw own application
exports.withdraw = async (req, res) => {
  try {
    const application = await Application.findOneAndDelete({
      candidate: req.user.id,
      job: req.params.jobId,
    });

    if (!application) {
      const recruiterJobIds = await Job.find({ postedBy: workspaceRecruiterId(req) }).distinct('_id');
      const referral = await Referral.findOne({ _id: req.params.id, job: { $in: recruiterJobIds } });
      if (!referral) return res.status(404).json({ error: 'Application or referral not found' });
      const updatedReferral = await Referral.findByIdAndUpdate(referral._id, updateObj, { new: true }).lean();
      try {
        const { getIO } = require('../config/socket');
        const io = getIO();
        if (io) io.to(`user:${referral.referredCandidate}`).emit('applicationUpdated', { type: 'referralUpdated', referralId: referral._id });
      } catch (socketError) {
        console.error('Unable to notify referred candidate:', socketError.message);
      }
      return res.json({ ...updatedReferral, _id: referral._id, isReferral: true, status: updatedReferral.status });
    }

    emitToUser(application.recruiter, 'applicationUpdated', {
      type: 'withdrawn',
      applicationId: application._id,
      candidateId: application.candidate,
      jobId: application.job,
    });
    res.json({ message: 'Application withdrawn' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// PATCH /api/applications/:id/status (recruiter only)
exports.updateStatus = async (req, res) => {
  try {
    let { status, interviewDate, interviewTime, interviewMode, interviewLink, interviewAddress } = req.body; // interviewDate and interviewTime are optional for interview scheduling

    if (status === 'interview') {
      status = 'interview_scheduled';
    }

    // Build update object with status and timeline dates
    const updateObj = { status };
    
    switch (status) {
      case 'viewed':
        if (!updateObj.viewedAt) updateObj.viewedAt = new Date();
        break;
      case 'shortlisted':
        updateObj.resumeViewedAt = new Date();
        break;
      case 'interview_scheduled':
        if (!['online', 'offline'].includes(interviewMode)) {
          return res.status(400).json({ error: 'Choose whether the interview is online or offline.' });
        }
        if (interviewMode === 'online' && !String(interviewLink || '').trim()) {
          return res.status(400).json({ error: 'Meeting link is required for an online interview.' });
        }
        if (interviewMode === 'online') {
          try {
            const parsedLink = new URL(String(interviewLink).trim());
            if (!['http:', 'https:'].includes(parsedLink.protocol)) throw new Error('Invalid protocol');
          } catch {
            return res.status(400).json({ error: 'Enter a valid online meeting link.' });
          }
        }
        if (interviewMode === 'offline' && !String(interviewAddress || '').trim()) {
          return res.status(400).json({ error: 'Interview address is required for an offline interview.' });
        }
        updateObj.interviewScheduledAt = new Date();
        if (interviewDate) updateObj.interviewDate = interviewDate;
        if (interviewTime) updateObj.interviewTime = interviewTime;
        updateObj.interviewMode = interviewMode;
        updateObj.interviewLink = interviewMode === 'online' ? String(interviewLink).trim() : undefined;
        updateObj.interviewAddress = interviewMode === 'offline' ? String(interviewAddress).trim() : undefined;
        break;
      case 'offered':
        updateObj.offeredAt = new Date();
        break;
      case 'accepted':
        updateObj.acceptedAt = new Date();
        break;
      case 'hired':
        updateObj.hiredAt = new Date();
        break;
    }

    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: workspaceRecruiterId(req),
    })
      .populate({ path: 'candidate', select: 'name email' })
      .populate({ path: 'job', select: 'title' });

    const recruiterId = workspaceRecruiterId(req);
    const referralJobIds = await Job.find({ postedBy: recruiterId }).distinct('_id');
    const referral = await Referral.findOne({
      _id: req.params.id,
      job: { $in: referralJobIds },
    });

    if (!application && !referral) return res.status(404).json({ error: 'Application or referral not found' });

    if (!application && referral) {
      const updatedReferral = await Referral.findByIdAndUpdate(referral._id, updateObj, { new: true }).lean();
      emitToUser(referral.referredCandidate, 'applicationUpdated', { type: 'referralUpdated', referralId: referral._id });
      return res.json({ ...updatedReferral, _id: referral._id, isReferral: true });
    }

    if (referral) {
      await Referral.findByIdAndUpdate(referral._id, updateObj, { new: true });
    }

    const recruiter = await Recruiter.findById(recruiterId).select('name companyName');

    const updatedApplication = await Application.findOneAndUpdate(
      { _id: req.params.id, recruiter: recruiterId },
      updateObj,
      { new: true }
    ).populate({ path: 'candidate', select: 'name email' }).populate({ path: 'job', select: 'title' });

    if (status === 'shortlisted') {
      await CandidatePerformanceEvent.create({
        candidate: application.candidate._id || application.candidate,
        recruiter: workspaceRecruiterId(req),
        type: 'application_shortlisted',
        metadata: { applicationId: application._id, jobId: application.job?._id || application.job },
      });
    }

    const emailStatus = {
      shortlisted: null,
      interviewScheduled: null,
      rejected: null,
    };

    if (status === 'shortlisted') {
      try {
        const candidateEmail = application.candidate?.email;
        const candidateName = application.candidate?.name;
        const jobTitle = application.job?.title;

        if (!candidateEmail) {
          console.error('Shortlist email failed: Candidate email is missing');
          emailStatus.shortlisted = false;
        } else {
          const result = await sendShortlistEmail(
            candidateEmail,
            candidateName,
            jobTitle,
            recruiter?.name || 'Hiring Team',
            recruiter?.companyName || 'Our Company'
          );
          emailStatus.shortlisted = result?.sent ?? false;
          // Email status logged
        }
      } catch (emailErr) {
        console.error('Shortlist email failed:', emailErr.message);
        emailStatus.shortlisted = false;
      }
    }

    if (status === 'interview_scheduled') {
      try {
        const candidateEmail = application.candidate?.email;
        const candidateName = application.candidate?.name;
        const jobTitle = application.job?.title;

        if (!candidateEmail) {
          console.error('Interview schedule email failed: Candidate email is missing');
          emailStatus.interviewScheduled = false;
        } else {
          const result = await sendInterviewScheduleEmail(
            candidateEmail,
            candidateName,
            jobTitle,
            recruiter?.name || 'Hiring Team',
            recruiter?.companyName || 'Our Company',
            interviewDate,
            interviewTime,
            interviewMode,
            interviewLink,
            interviewAddress
          );
          emailStatus.interviewScheduled = result?.sent ?? false;
          // Email status logged
        }
      } catch (emailErr) {
        console.error('Interview schedule email failed:', emailErr.message);
        emailStatus.interviewScheduled = false;
      }
    }

    if (status === 'rejected') {
      try {
        const candidateEmail = application.candidate?.email;
        const candidateName = application.candidate?.name;
        const jobTitle = application.job?.title;

        if (!candidateEmail) {
          console.error('Rejection email failed: Candidate email is missing');
          emailStatus.rejected = false;
        } else {
          const result = await sendRejectionEmail(
            candidateEmail,
            candidateName,
            jobTitle,
            recruiter?.name || 'Hiring Team',
            recruiter?.companyName || 'Our Company'
          );
          emailStatus.rejected = result?.sent ?? false;
          // Email status logged
        }
      } catch (emailErr) {
        console.error('Rejection email failed:', emailErr.message);
        emailStatus.rejected = false;
      }
    }

    try {
      await createNotification({
        candidate: application.candidate?._id || application.candidate,
        type: 'application_status',
        title: 'Application update',
        message: `Your application for "${application.job?.title || 'a job'}" is now ${status}.`,
        relatedId: application._id,
      });
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr.message);
    }

    emitToUser(application.candidate?._id || application.candidate, 'applicationUpdated', {
      type: 'status_changed',
      application: updatedApplication,
    });
    emitToUser(req.user.id, 'applicationUpdated', {
      type: 'status_changed',
      application: updatedApplication,
    });

    res.json({
      application: updatedApplication,
      emailStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/applications/:id/view (recruiter only) - Track when recruiter views an applicant
exports.trackView = async (req, res) => {
  try {
    const application = await Application.findOne({
      _id: req.params.id,
      recruiter: req.user.id,
    });

    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Increment view count
    const updateObj = { $inc: { viewsCount: 1 } };

    // Set viewedAt if not already set (first view)
    if (!application.viewedAt) {
      updateObj.viewedAt = new Date();
    }

    const updatedApplication = await Application.findByIdAndUpdate(
      req.params.id,
      updateObj,
      { new: true }
    ).populate('job', 'title');

    await CandidatePerformanceEvent.create({
      candidate: application.candidate,
      recruiter: req.user.id,
      type: 'profile_view',
      metadata: { applicationId: application._id },
    });

    res.json(updatedApplication);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};