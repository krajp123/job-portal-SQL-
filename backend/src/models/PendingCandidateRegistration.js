const mongoose = require('mongoose');

// Holds a candidate's registration details BETWEEN "create order" and
// "payment verified". No Candidate document (and therefore no login-capable
// account) is created until the ₹9 payment is verified — see
// candidateAuth.controller.js (createRegistrationOrder / verifyRegistrationPayment).
//
// `expiresAt` has a TTL index so MongoDB automatically deletes abandoned
// registrations (user opened the payment sheet and never paid) after 30 minutes.
const pendingCandidateRegistrationSchema = new mongoose.Schema({
  razorpayOrderId: { type: String, required: true, unique: true, index: true },

  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true },
  passwordHash: { type: String, required: true },
  workStatus: {
    type: String,
    enum: ['fresher', 'experienced'],
    default() {
      return this.candidateCategory === 'student' ? 'fresher' : undefined;
    },
  },
  experienceCertificateUrl: { type: String },
  medicalCertificateUrl: { type: String },
  candidateCategory: {
    type: String,
    enum: ['student', 'construction', 'security', 'technical'],
    required: true,
  },
  candidateSubCategory: {
    type: String,
    enum: [
      'student',
      'labour',
      'mason',
      'crane_operator',
      'site_supervisor',
      'retired_army',
      'retired_police',
      'ex_navy_air_force',
      'sme',
    ],
    required: true,
  },
  categoryData: { type: mongoose.Schema.Types.Mixed, default: {} },

  amount: { type: Number, required: true },
  baseAmount: { type: Number },
  gstAmount: { type: Number, default: 0 },
  gstRate: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, index: { expires: 0 } }, // TTL: Mongo deletes once expiresAt is in the past
});

module.exports = mongoose.model('PendingCandidateRegistration', pendingCandidateRegistrationSchema);
