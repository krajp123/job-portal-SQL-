const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    referredCandidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true, index: true },
  },
  { timestamps: true }
);

referralSchema.index({ referrer: 1, referredCandidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Referral', referralSchema);
