const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    uniqueId: { type: String, required: true, unique: true, index: true }, // e.g. JS-2026-000123
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true }, // uniqueId is emailed here
    phone: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: true },
    phoneVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    passwordHash: { type: String, required: true },
    workStatus: {
      type: String,
      enum: ['fresher', 'experienced'],
      default() {
        return this.candidateCategory === 'student' ? 'fresher' : undefined;
      },
    },
    experienceCertificateUrl: { type: String }, // Cloudflare R2 link — only set when workStatus is 'experienced'
    candidateCategory: {
      type: String,
      enum: ['student', 'construction', 'security', 'technical'],
      index: true,
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
      index: true,
    },
    categoryData: {
      common: {
        age: { type: Number, min: 0, max: 120 },
        height: { type: Number, min: 0, max: 300 },
        weight: { type: Number, min: 0, max: 500 },
        medicalCertificate: { type: String, enum: ['No', 'Yes'] },
        medicalCertificateUrl: { type: String },
        willingToRelocate: { type: String, enum: ['No', 'Yes'] },
        currentLocation: { type: String, trim: true },
      },
      student: {
        qualification: { type: String, trim: true },
        schoolName: { type: String, trim: true },
        course: { type: String, trim: true },
        yearOfStudy: { type: String, trim: true },
        studentSkills: { type: String, trim: true },
      },
      construction: {
        labour: {
          typeOfWorkDoneBefore: { type: String, trim: true },
        },
        mason: {},
        crane_operator: {
          machineryTypeKnown: { type: String, trim: true },
          operatingLicenseNumber: { type: String, trim: true },
          experiencePerMachine: { type: String, trim: true },
        },
        site_supervisor: {
          qualification: { type: String, trim: true },
          supervisoryExperience: { type: String, trim: true },
          workersManaged: { type: String, trim: true },
        },
      },
      security: {
        retired_army: {
          serviceIdDischargeCertificate: { type: String, trim: true },
          rankHeld: { type: String, trim: true },
          yearsOfService: { type: String, trim: true },
          areaOfExpertise: { type: String, trim: true },
          retirementYear: { type: String, trim: true },
        },
        retired_police: {
          serviceIdRetirementCertificate: { type: String, trim: true },
          rankHeld: { type: String, trim: true },
          yearsOfService: { type: String, trim: true },
          departmentStateCadre: { type: String, trim: true },
        },
        ex_navy_air_force: {
          serviceIdDischargeCertificate: { type: String, trim: true },
          branchAndRank: { type: String, trim: true },
          yearsOfService: { type: String, trim: true },
        },
      },
      technical: {
        sme: {
          fieldOfExpertise: { type: String, trim: true },
          qualification: { type: String, trim: true },
          portfolioResume: { type: String, trim: true },
        },
      },
    },

    profile: {
      headline: { type: String },
      about: { type: String },
      location: { type: String },
      phone: { type: String },
      workPreferences: { type: String },
      availability: { type: String },
      skills: [{ type: String }],
      preferredRoles: [{ type: String }],
      preferredLocations: [{ type: String }],
      preferredSkills: [{ type: String }],
      preferredMinSalary: { type: String },
      preferredMaxSalary: { type: String },
      preferredNoticePeriod: { type: String },
      alertFrequency: { type: String, enum: ['instant', 'daily', 'weekly', 'off'], default: 'daily' },
      experience: [
        {
          company: String,
          role: String,
          from: String,
          to: String,
          description: String,
          current: Boolean,
          salary: String,
          designation: String,
          employmentType: String,
          location: String,
          department: String,
          stipend: String,
          totalExpYears: Number,
          totalExpMonths: Number,
          joiningYear: String,
          joiningMonth: String,
          workingFromYear: String,
          workingFromMonth: String,
          workingTillYear: String,
          workingTillMonth: String,
          noticePeriod: String,
          internshipDescription: String,
          currentSalary: String,
        },
      ],
      education: [
        {
          educationLevel: String,
          institution: String,
          degree: String,
          year: Number,
          courseName: String,
          startYear: String,
          endYear: String,
          courseType: String,
          gradingSystem: String,
          specialization: String,
          doctorateType: String,
          researchStartYear: String,
          researchStartMonth: String,
          researchEndYear: String,
          researchEndMonth: String,
          thesisTitle: String,
          marks: String,
          board: String,
          schoolName: String,
          passingYear: String,
          schoolMedium: String,
          stream: String,
          startMonth: String,
          endMonth: String,
        },
      ],
      certifications: [
        {
          name: String,
          completionId: String,
          credentialUrl: String,
          startMonth: String,
          startYear: String,
          expiryMonth: String,
          expiryYear: String,
          noExpiry: Boolean,
        },
      ],
      languages: [{ type: String }],
      projects: [
        {
          title: String,
          client: String,
          status: String,
          workedFromMonth: String,
          workedFromYear: String,
          workedTillMonth: String,
          workedTillYear: String,
          location: String,
          site: String,
          teamSize: String,
          role: String,
          roleDescription: String,
          skills: [{ type: String }],
        },
      ],
      portfolio: [
        {
          title: String,
          description: String,
          url: String,
          thumbnail: String,
        },
      ],
      resumeUrl: { type: String }, // Cloudflare R2 link
      resumeFilename: { type: String }, // original candidate resume filename
      profilePictureUrl: { type: String }, // Cloudflare R2 link — shown as DP across the app
    },

    savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
    followedRecruiters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Recruiter' }],

    visibility: { type: String, enum: ['public', 'private', 'applied', 'hidden'], default: 'public' },
    searchable: { type: Boolean, default: true },
    hiddenCompanies: [{ type: String }],
    twoFactorEnabled: { type: Boolean, default: false },
    notificationPreferences: {
      jobRecommendations: { type: Boolean, default: true },
      applicationUpdates: { type: Boolean, default: true },
      recruiterMessages: { type: Boolean, default: true },
      marketing: { type: Boolean, default: false },
      smsReminders: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
    },

    socialLinks: {
      github: { type: String },
      linkedin: { type: String },
      website: { type: String },
    },

    gamification: {
      badges: [
        {
          key: { type: String }, // e.g. 'profile_complete', 'first_application'
          label: { type: String },
          unlockedAt: { type: Date, default: Date.now },
        },
      ],
      loginStreak: {
        count: { type: Number, default: 0 },
        lastLoginDate: { type: Date },
      },
      applicationStreak: {
        count: { type: Number, default: 0 },
        weekStart: { type: Date },
      },
    },

    hiredBadge: {
      isHired: { type: Boolean, default: false },
      applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
      confirmedAt: { type: Date },
    },

    accountStatus: {
      type: String,
      enum: ['active', 'suspended', 'banned'],
      default: 'active',
    },
    adminNotes: [
      {
        message: { type: String, required: true },
        author: { type: String, default: 'Admin' },
        createdAt: { type: Date, default: Date.now },
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

module.exports = mongoose.model('Candidate', candidateSchema);