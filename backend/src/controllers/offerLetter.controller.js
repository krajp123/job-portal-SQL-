const OfferLetter = require('../models/OfferLetter');
const Application = require('../models/Application');
const { confirmHiredBadge } = require('../services/badge.service');

function emitToUser(userId, event, payload) {
  try {
    const { getIO } = require('../config/socket');
    const io = getIO();
    if (io && userId) io.to(`user:${userId}`).emit(event, payload);
  } catch (error) {
    console.error(`Unable to emit ${event}:`, error.message);
  }
}
const { createNotification } = require('../services/notification.service');
const { sendOfferEmail } = require('../services/email.service');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const path = require('path');

async function uploadToCloudinary(file, keyPrefix) {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured. Add Cloudinary credentials before uploading documents.');
  }

  const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, '_');
  const publicId = `${keyPrefix}/${Date.now()}-${safeName}`;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { public_id: publicId, resource_type: 'raw' },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(file.buffer);
  });
}

// POST /api/offer-letters (recruiter only) - step 1: send offer letter
exports.uploadOfferLetter = async (req, res) => {
  try {
    const { applicationId } = req.body;

    const application = await Application.findOne({ _id: applicationId, recruiter: req.user.id })
      .populate({ path: 'candidate', select: 'name email' })
      .populate({ path: 'job', select: 'title' });
    if (!application) return res.status(404).json({ error: 'Application not found' });

    const offerLetterUrl = await uploadToCloudinary(req.file, 'offer-letters');

    const offerLetter = await OfferLetter.create({ application: applicationId, offerLetterUrl });

    application.status = 'offered';
    await application.save();

    const emailStatus = { offerSent: null };
    if (application.candidate?.email) {
      try {
        const result = await sendOfferEmail(
          application.candidate.email,
          application.candidate.name,
          application.job?.title,
          'Hiring Team',
          'Our Company',
          req.file
        );
        emailStatus.offerSent = result?.sent ?? false;
      } catch (emailErr) {
        console.error('Offer email failed:', emailErr.message);
        emailStatus.offerSent = false;
      }
    } else {
      emailStatus.offerSent = false;
      console.warn('Offer email not sent because candidate email is missing for application', applicationId);
    }

    try {
      await createNotification({
        candidate: application.candidate?._id || application.candidate,
        type: 'application_status',
        title: 'You have an offer letter!',
        message: 'A recruiter has uploaded an offer letter for one of your applications.',
        relatedId: application._id,
      });
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr.message);
    }

    res.status(201).json({ offerLetter, emailStatus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/offer-letters/:id/signed (recruiter only) - step 2: upload candidate's signed acceptance
// This is the step that triggers the Hired badge (Section 5.3)
exports.uploadSignedAcceptance = async (req, res) => {
  try {
    const offerLetter = await OfferLetter.findById(req.params.id).populate('application');
    if (!offerLetter) return res.status(404).json({ error: 'Offer letter not found' });

    if (String(offerLetter.application.recruiter) !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this offer letter' });
    }

    const signedAcceptanceUrl = await uploadToCloudinary(req.file, 'signed-acceptances');

    offerLetter.signedAcceptanceUrl = signedAcceptanceUrl;
    offerLetter.signedUploadedAt = new Date();
    await offerLetter.save();

    // System confirms the signed copy -> Hired badge appears on profile
    const candidate = await confirmHiredBadge({
      applicationId: offerLetter.application._id,
      signedAcceptanceUrl,
    });

    emitToUser(candidate._id, 'applicationUpdated', {
      type: 'hired',
      applicationId: offerLetter.application._id,
      status: 'hired',
      hiredBadge: candidate.hiredBadge,
    });
    emitToUser(offerLetter.application.recruiter, 'applicationUpdated', {
      type: 'hired',
      applicationId: offerLetter.application._id,
      status: 'hired',
    });

    try {
      await createNotification({
        candidate: candidate._id,
        type: 'application_status',
        title: 'You are Hired! 🎉',
        message: 'Your signed offer letter was confirmed. Your Hired badge is now active on your profile.',
        relatedId: offerLetter.application._id,
      });
    } catch (notifErr) {
      console.error('Notification creation failed:', notifErr.message);
    }

    res.json({ message: 'Hired badge activated', candidate });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
