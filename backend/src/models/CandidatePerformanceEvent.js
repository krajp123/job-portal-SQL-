const mongoose = require('mongoose');

const candidatePerformanceEventSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, index: true },
    recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter', required: true, index: true },
    type: {
      type: String,
      enum: ['search_appearance', 'profile_view', 'resume_download', 'message_started', 'application_shortlisted'],
      required: true,
      index: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

candidatePerformanceEventSchema.index({ candidate: 1, type: 1, createdAt: -1 });

module.exports = mongoose.model('CandidatePerformanceEvent', candidatePerformanceEventSchema);
