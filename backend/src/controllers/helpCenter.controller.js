const HelpCenterReport = require('../models/HelpCenterReport');
const Candidate = require('../models/Candidate');
const Recruiter = require('../models/Recruiter');
const { createAdminNotification } = require('../services/adminNotification.service');

const SUPPORT_CONCERNS = new Set([
  'Account',
  'Job search',
  'Billing & payments',
  'Job posting',
  'Application / profile',
  'Resume & documents',
  'Applicants & hiring',
  'Team & access',
  'Report abuse',
  'Other',
]);

exports.createReport = async (req, res) => {
  try {
    const { name, email, phone, concern, message } = req.body;
    if (![name, email, concern, message].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ error: 'Name, email, concern, and message are required.' });
    }
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedConcern = concern.trim();
    const normalizedMessage = message.trim();
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!SUPPORT_CONCERNS.has(normalizedConcern)) {
      return res.status(400).json({ error: 'Please select a valid support topic.' });
    }
    if (normalizedName.length > 120 || normalizedEmail.length > 254 || normalizedPhone.length > 30 || normalizedMessage.length > 2000) {
      return res.status(400).json({ error: 'One or more fields exceed the allowed length.' });
    }

    const [candidateAccount, recruiterAccount] = await Promise.all([
      Candidate.findOne({ email: normalizedEmail }).select('name email phone uniqueId').lean(),
      Recruiter.findOne({ $or: [{ email: normalizedEmail }, { companyEmail: normalizedEmail }] })
        .select('fullName email phone companyName companyEmail')
        .lean(),
    ]);
    const account = candidateAccount || recruiterAccount;

    if (!account) {
      return res.status(400).json({ error: 'User not registered. Please use your registered email address.' });
    }

    const isCandidateAccount = Boolean(candidateAccount);
    const report = await HelpCenterReport.create({
      name: account?.name || account?.fullName || normalizedName,
      email: (account?.email || account?.companyEmail || normalizedEmail).trim().toLowerCase(),
      phone: account?.phone || normalizedPhone,
      concern: normalizedConcern,
      message: normalizedMessage,
      submittedByType: isCandidateAccount ? 'candidate' : 'recruiter',
      submittedBy: account._id,
      submittedByModel: isCandidateAccount ? 'Candidate' : 'Recruiter',
    });

    try {
      await createAdminNotification({
        key: 'supportRequest',
        title: 'New support request',
        message: `${report.name} submitted a ${report.concern} support request.`,
        relatedId: report._id,
      });
    } catch (notificationError) {
      console.error('Support request notification failed:', notificationError.message);
    }

    res.status(201).json({ message: 'Support request submitted.', reportId: report._id });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Unable to submit support request.' });
  }
};
