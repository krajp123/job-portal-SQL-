const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const Referral = require('../models/Referral');
const { createNotification } = require('../services/notification.service');

function normalizeCompanyName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function currentCompanyName(candidate) {
  const currentExperience = (candidate?.profile?.experience || []).find((item) => item?.current && item.company);
  return currentExperience?.company?.trim() || '';
}

// GET /api/referral/:uniqueId (recruiter only) - identity check by unique ID
// Lets a recruiter look up a referred candidate directly, without a full search.
exports.lookupByUniqueId = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ uniqueId: req.params.uniqueId }).select(
      '-passwordHash -phone'
    );

    if (!candidate) {
      return res.status(404).json({ error: 'No candidate found with this unique ID' });
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/referral/lookup/:uniqueId (candidate only)
exports.lookupCandidate = async (req, res) => {
  try {
    const candidate = await Candidate.findOne({ uniqueId: req.params.uniqueId.trim() })
      .select('uniqueId name profile.headline profile.location profile.skills profile.experience')
      .lean();

    if (!candidate) {
      return res.status(404).json({ error: 'No candidate found with this unique ID' });
    }

    res.json(candidate);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/referral (candidate only)
exports.createCandidateReferral = async (req, res) => {
  try {
    const { jobId, candidateUniqueId } = req.body;
    if (!jobId || !candidateUniqueId?.trim()) {
      return res.status(400).json({ error: 'Job and candidate unique ID are required.' });
    }

    const [referrer, referredCandidate, job] = await Promise.all([
      Candidate.findById(req.user.id).select('name uniqueId profile.experience'),
      Candidate.findOne({ uniqueId: candidateUniqueId.trim() }).select('name uniqueId'),
      Job.findById(jobId).select('title status adminClosed postedBy').populate('postedBy', 'companyName'),
    ]);

    if (!referrer) return res.status(401).json({ error: 'Referrer account not found.' });
    if (!referredCandidate) return res.status(404).json({ error: 'No candidate found with this unique ID.' });
    if (String(referrer._id) === String(referredCandidate._id)) {
      return res.status(400).json({ error: 'You cannot refer yourself.' });
    }
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    if (job.status !== 'open' || job.adminClosed) {
      return res.status(400).json({ error: 'This job is no longer accepting referrals.' });
    }

    const referrerCompanyName = currentCompanyName(referrer);
    const jobCompanyName = job.postedBy?.companyName?.trim() || '';
    if (!referrerCompanyName) {
      return res.status(403).json({ error: 'Add your current company to your candidate profile before referring someone.' });
    }
    if (!jobCompanyName || normalizeCompanyName(referrerCompanyName) !== normalizeCompanyName(jobCompanyName)) {
      return res.status(403).json({ error: 'You can only refer candidates for jobs posted by your current company.' });
    }

    const existing = await Referral.findOne({
      referrer: referrer._id,
      referredCandidate: referredCandidate._id,
      job: job._id,
      referrerCompanyName,
      jobCompanyName,
    });
    if (existing) return res.status(409).json({ error: 'You have already referred this candidate for this job.' });

    const referral = await Referral.create({
      referrer: referrer._id,
      referredCandidate: referredCandidate._id,
      job: job._id,
      referrerCompanyName,
      jobCompanyName,
    });

    await createNotification({
      candidate: referredCandidate._id,
      type: 'referral',
      title: 'You got a referral for a job',
      message: `${referrer.name} referred you for ${job.title}.`,
      relatedId: job._id,
    });

    res.status(201).json({
      message: `Referral sent to ${referredCandidate.name}.`,
      referral: { id: referral._id, candidate: referredCandidate.name, job: job.title },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'You have already referred this candidate for this job.' });
    }
    res.status(500).json({ error: err.message });
  }
};

// GET /api/referral/mine (candidate only)
exports.listMyReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referredCandidate: req.user.id })
      .sort({ createdAt: -1 })
      .populate('referrer', 'name uniqueId')
      .populate({
        path: 'job',
        select: 'title description location salary skillsRequired experienceLevel postedBy status createdAt',
        populate: { path: 'postedBy', select: 'companyName companyLogoUrl' },
      })
      .lean();

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/referral/made (candidate only)
exports.listMadeReferrals = async (req, res) => {
  try {
    const referrals = await Referral.find({ referrer: req.user.id })
      .sort({ createdAt: -1 })
      .populate('referredCandidate', 'name uniqueId')
      .populate({
        path: 'job',
        select: 'title description location salary skillsRequired experienceLevel postedBy status createdAt',
        populate: { path: 'postedBy', select: 'companyName companyLogoUrl' },
      })
      .lean();

    res.json(referrals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/referral/recruiter (recruiter workspace only)
exports.listRecruiterReferrals = async (req, res) => {
  try {
    const recruiterId = req.workspaceOwnerId || req.user.id;
    const recruiterJobs = await Job.find({ postedBy: recruiterId }).select('_id').lean();
    const jobIds = recruiterJobs.map((job) => job._id);
    const referrals = await Referral.find({ job: { $in: jobIds } })
      .populate({ path: 'referredCandidate', select: '-passwordHash -phone' })
      .populate('referrer', 'name uniqueId profile.experience')
      .populate({
        path: 'job',
        select: 'title location status postedBy',
        populate: { path: 'postedBy', select: 'companyName companyLogoUrl' },
      })
      .sort({ createdAt: -1 })
      .lean();

    res.json(referrals.filter((referral) => referral.job && referral.referredCandidate));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
