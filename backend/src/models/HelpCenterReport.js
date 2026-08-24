const mongoose = require('mongoose');

const helpCenterReportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone: { type: String, trim: true, maxlength: 30 },
    concern: { type: String, required: true, trim: true, maxlength: 80 },
    message: { type: String, required: true, trim: true, maxlength: 2000 },
    submittedByType: { type: String, enum: ['candidate', 'recruiter', 'guest'], default: 'guest' },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'submittedByModel' },
    submittedByModel: { type: String, enum: ['Candidate', 'Recruiter'] },
    status: { type: String, enum: ['pending', 'under_review', 'resolved', 'rejected'], default: 'pending' },
    reviewNotes: { type: String, trim: true, maxlength: 1000 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

helpCenterReportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('HelpCenterReport', helpCenterReportSchema);
