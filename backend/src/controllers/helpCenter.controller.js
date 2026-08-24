const HelpCenterReport = require('../models/HelpCenterReport');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const { createAdminNotification } = require('../services/adminNotification.service');

exports.createReport = async (req, res) => {
  try {
    const { name, email, phone, concern, message } = req.body;
    if (![name, email, concern, message].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Name, email, concern, and message are required.' });
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }

    let account;
    if (req.user?.role === 'candidate') account = await Candidate.findById(req.user.id).select('name email phone uniqueId').lean();
    if (req.user?.role === 'recruiter') account = await Recruiter.findById(req.user.id).select('fullName email phone companyName companyEmail').lean();

    const isAccountSubmission = Boolean(account);
    const report = await HelpCenterReport.create({
      name: account?.name || account?.fullName || name.trim(),
      email: account?.email || account?.companyEmail || email.trim(),
      phone: account?.phone || (typeof phone === 'string' ? phone.trim() : ''),
      concern: concern.trim(),
      message: message.trim(),
      submittedByType: isAccountSubmission ? req.user.role : 'guest',
      submittedBy: isAccountSubmission ? req.user.id : undefined,
      submittedByModel: isAccountSubmission ? (req.user.role === 'candidate' ? 'Candidate' : 'Recruiter') : undefined,
    });

    await createAdminNotification({
      key: 'supportRequest',
      title: 'New Help Center request',
      message: `${report.name} submitted a ${report.concern} support request.`,
      relatedId: report._id,
    });

    res.status(201).json({ message: 'Support request submitted.', reportId: report._id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to submit support request.' });
  }
};
