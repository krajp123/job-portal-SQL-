const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    referredCandidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
    referrerCompanyName: { type: String, required: true, trim: true },
    jobCompanyName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['referred', 'viewed', 'shortlisted', 'interview_scheduled', 'offered', 'accepted', 'rejected', 'hired'], default: 'referred' },
    viewedAt: { type: Date },
    resumeViewedAt: { type: Date },
    interviewScheduledAt: { type: Date },
    interviewDate: { type: Date },
    interviewTime: { type: String },
    interviewMode: { type: String, enum: ['online', 'offline'] },
    interviewLink: { type: String },
    interviewAddress: { type: String },
    offeredAt: { type: Date },
    acceptedAt: { type: Date },
    hiredAt: { type: Date },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, referredCandidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Referral', referralSchema);
