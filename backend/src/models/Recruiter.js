const mongoose = require('mongoose');

const recruiterSchema = new mongoose.Schema(
  {
    // Personal email — collected at payment time. NOT unique: same person can
    // pay and receive the registration link any number of times with this
    // email. Account identity/uniqueness is enforced on companyEmail instead.
    email: { type: String, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    fullName: { type: String, trim: true },
    designation: { type: String, trim: true },
    jobTitle: { type: String, trim: true }, // Job title during registration
    recruiterRole: { type: String, trim: true }, // Role: HR, Talent Acquisition, etc.
    phone: { type: String, trim: true },
    teamMembers: [
      {
        email: { type: String, required: true, lowercase: true, trim: true },
        role: { type: String, enum: ['admin', 'recruiter', 'viewer'], default: 'recruiter' },
        status: { type: String, enum: ['pending', 'active'], default: 'pending' },
      },
    ],
    companyName: { type: String, required: true },
    companyWebsite: { type: String, trim: true },
    // Company email — the account-security key. One company email can back
    // only ONE completed registration; `unique + sparse` lets many
    // 'incomplete' placeholder docs exist with no companyEmail yet (null),
    // while still blocking a second COMPLETE account from reusing the same
    // company email (enforced in the controller, since sparse-unique alone
    // does not distinguish 'incomplete' vs 'complete').
    companyEmail: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    companyGst: { type: String, trim: true },
    companyCin: { type: String, trim: true },
    industry: { type: String, trim: true },
    companySize: { type: String, trim: true },
    companyType: { type: String, trim: true },
    companyLogoUrl: { type: String },
    coverImageUrl: { type: String },
    companyDetails: { type: String },
    hiringVolume: { type: String, trim: true }, // 1-5, 5-20, 20-100, 100+
    hiringFor: [{ type: String, trim: true }], // Full-time, Part-time, Internship, Contract, Remote
    departments: [{ type: String, trim: true }], // List of departments they hire for
    tags: [{ type: String, trim: true }],
    whyJoinUs: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    diversityHighlights: [
      {
        title: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    profilePictureUrl: { type: String }, // Recruiter's own profile picture
    bio: { type: String, trim: true },
    location: { type: String, trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    expertiseTags: [{ type: String, trim: true }],
    languages: [{ type: String, trim: true }],
    experienceTimeline: [
      {
        company: { type: String, trim: true },
        role: { type: String, trim: true },
        location: { type: String, trim: true },
        startDate: { type: String, trim: true },
        endDate: { type: String, trim: true },
        current: { type: Boolean, default: false },
        duration: { type: String, trim: true },
        achievements: [{ type: String, trim: true }],
      },
    ],

    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    registrationStatus: {
      type: String,
      enum: ['incomplete', 'complete'],
      default: 'complete',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    adminNotes: { type: String, trim: true, default: '' },
    kycDocuments: [
      {
        id: { type: String, unique: true },
        type: { type: String, trim: true },
        url: { type: String },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        submittedAt: { type: Date, default: Date.now },
        reviewedAt: { type: Date },
      },
    ],
    passwordResetToken: { type: String },
    passwordResetExpiry: { type: Date },
    registeredAt: { type: Date, default: Date.now },
    renewalDueDate: { type: Date, required: true },
    loginHistory: [
      {
        ip: { type: String },
        device: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Recruiter', recruiterSchema);