const Recruiter = require('../../models/Recruiter');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');
const { generateUserToken } = require('../../utils/generateToken');
const { isValidEmail, isStrongEnoughPassword } = require('../../utils/validators');
const { createAdminNotification } = require('../../services/adminNotification.service');
const { razorpayInstance, PRICING } = require('../../config/razorpay');
const { calculateCharge } = require('../../services/tax.service');
const Payment = require('../../models/Payment');
const crypto = require('crypto');
const { sendEmail } = require('../../services/email.service');
const fs = require('fs');
const path = require('path');
const { cloudinary, isCloudinaryConfigured } = require('../../config/cloudinary');

async function uploadRegistrationDocument(req, file, folder) {
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `recruiter-registration-documents/${folder}`, resource_type: 'auto' },
        (error, result) => (error ? reject(error) : resolve(result.secure_url))
      );
      stream.end(file.buffer);
    });
  }

  const uploadsDir = path.join(__dirname, '..', '..', 'uploads', 'recruiter-registration-documents', folder);
  fs.mkdirSync(uploadsDir, { recursive: true });
  const safeName = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  fs.writeFileSync(path.join(uploadsDir, safeName), file.buffer);
  return `${req.protocol}://${req.get('host')}/uploads/recruiter-registration-documents/${folder}/${safeName}`;
}

// POST /api/recruiter/register/create-payment-order
// Creates a Razorpay order for recruiter registration payment
// Public endpoint (no auth required)
exports.createPaymentOrder = async (req, res) => {
  try {
    const { getPlatformSettings } = require('../../services/platformSettings.service');
    const settings = await getPlatformSettings();
    
    if (!settings.recruiterRegistrationEnabled) {
      return res.status(403).json({ error: 'Recruiter registration is currently disabled. Please contact support.' });
    }

    const { email, companyName } = req.body;
    
    const baseAmount = PRICING.RECRUITER_REGISTRATION;
    const charge = calculateCharge(baseAmount, { gstEnabled: true, gstRate: 18 });
    const amount = Math.round(charge.totalAmount * 100); // Convert to paise and ensure integer
    const devMode = !razorpayInstance && process.env.NODE_ENV !== 'production';

    let order;
    if (devMode) {
      order = { id: `dev_${crypto.randomBytes(12).toString('hex')}` };
    } else {
      order = await razorpayInstance.orders.create({
        amount, // Already in paise as integer
        currency: 'INR',
        receipt: `recruiter_reg_${Date.now()}`,
      });
    }

    const payment = await Payment.create({
      userType: 'recruiter',
      userId: null, // Not yet registered
      userTypeRef: 'Recruiter',
      userEmail: email || null,
      userCompany: companyName || null,
      purpose: 'recruiter_registration',
      amount: charge.totalAmount,
      baseAmount: charge.baseAmount,
      gstAmount: charge.gstAmount,
      gstRate: charge.gstRate,
      razorpayOrderId: order.id,
      status: 'pending',
    });

    res.json({
      orderId: order.id,
      amount: charge.totalAmount,
      baseAmount: charge.baseAmount,
      gst: charge.gstAmount,
      currency: 'INR',
      key: process.env.RAZORPAY_KEY_ID || 'rzp_test_dev',
      paymentRecordId: payment._id,
      devMode,
    });
  } catch (err) {
    console.error('Error creating payment order:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/recruiter/register/verify-payment
// Verifies Razorpay payment signature
// Creates a temporary recruiter record with 'incomplete' status
// Public endpoint (no auth required)
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentRecordId, email } = req.body;

    if (!razorpay_order_id || !paymentRecordId || !email) {
      return res.status(400).json({ error: 'Missing payment details' });
    }

    // In production, ALWAYS require Razorpay to be configured
    if (process.env.NODE_ENV === 'production' && !razorpayInstance) {
      return res.status(500).json({ error: 'Payment processor not configured' });
    }

    // Allow dev mode only if not in production
    const isDevMode = !razorpayInstance && process.env.NODE_ENV !== 'production';

    if (!isDevMode) {
      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ error: 'Missing payment details' });
      }

      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed' });
      }
    }

    const payment = await Payment.findById(paymentRecordId);
    if (!payment) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    if (payment.razorpayOrderId !== razorpay_order_id) {
      return res.status(400).json({ error: 'Order ID mismatch' });
    }

    // Mark payment as completed
    payment.razorpayPaymentId = razorpay_payment_id || 'dev_payment';
    payment.status = 'success';
    payment.paidAt = new Date();
    await payment.save();

    // Create a fresh 'incomplete' recruiter placeholder for THIS payment.
    // Personal email is deliberately not deduped here — the same personal
    // email can pay and receive a link any number of times. Account-level
    // uniqueness is enforced later, on companyEmail, when registration is
    // actually completed (see register() / resumeRegistration()).
    const normalizedEmail = email.toLowerCase().trim();
    const recruiter = await Recruiter.create({
      email: normalizedEmail,
      passwordHash: 'temp_hash', // Will be replaced when completing registration
      companyName: 'Pending',
      registrationStatus: 'incomplete',
      renewalDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    });

    // Link payment to recruiter
    payment.userId = recruiter._id;
    await payment.save();

    // Send the resume-registration link so the recruiter can complete their
    // profile now or later, even if they close the tab right after paying.
    if (recruiter.registrationStatus === 'incomplete') {
      const resumeLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/resume-registration?id=${recruiter._id}`;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 14px;
              line-height: 1.7;
              color: #1f1f1f;
              background: #f8f5f3;
              margin: 0;
              padding: 0;
            }
            .wrapper {
              max-width: 620px;
              margin: 0 auto;
              background: #ffffff;
              padding: 32px 28px;
              border: 1px solid #efd9d1;
              border-radius: 12px;
            }
            .label {
              display: inline-block;
              font-size: 12px;
              font-weight: 700;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              color: #8d5b52;
              margin-bottom: 14px;
            }
            p {
              margin: 0 0 18px;
            }
            .btn-wrap {
              margin: 18px 0 8px;
            }
            .btn {
              display: inline-block;
              background: linear-gradient(135deg, #c75560 0%, #b54653 100%);
              color: #ffffff !important;
              text-decoration: none;
              padding: 14px 28px;
              border-radius: 10px;
              font-weight: 700;
              font-size: 15px;
              box-shadow: 0 10px 18px rgba(199, 85, 96, 0.18);
            }
            .muted {
              color: #6b5d5d;
            }
            .footer {
              margin-top: 18px;
              color: #524847;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="label">Payment Received</div>
            <p>Hi,</p>
            <p class="muted">Your recruiter registration payment has been received successfully. To complete your registration and activate your account, please continue below.</p>
            <div class="btn-wrap">
              <a class="btn" href="${resumeLink}">Complete Registration</a>
            </div>
            <p class="footer">Best regards,<br>Job Portal Team</p>
          </div>
        </body>
        </html>
      `;

      try {
        await sendEmail({
          to: recruiter.email,
          subject: 'Payment Received — Complete Your Recruiter Registration',
          body: `Your payment was received. Complete your recruiter registration here: ${resumeLink}`,
          html: htmlContent,
        });
      } catch (emailErr) {
        // Don't fail the payment-verification response just because the email
        // couldn't be sent — the recruiter can still finish the form in this
        // same session, or use the resume link support gives them manually.
        console.error('Error sending recruiter registration-link email:', emailErr);
      }
    }

    res.json({
      success: true,
      paymentId: payment._id,
      recruiterId: recruiter._id,
      message: 'Payment verified successfully',
    });
  } catch (err) {
    console.error('Error verifying payment:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/recruiter/register
exports.register = async (req, res) => {
  try {
    const {
      email, workEmail, password, fullName, firstName, lastName, phone, mobile,
      companyName, companyWebsite, companyDetails, companyDescription,
      companyEmail, companyEmailDomain, companyGst, gstNumber, companyCin, cinNumber,
      industry, industryOther, companySize, companyType, companyTypeOther, companyLocation,
      paymentId, hiringVolume, hiringFor, departments, jobTitle, recruiterRole,
    } = req.body;

    // Verify payment was completed
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment verification required. Please complete payment first.' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment || payment.status !== 'success' || payment.purpose !== 'registration') {
      return res.status(400).json({ error: 'Invalid or incomplete payment. Please try again.' });
    }

    const normalizedEmail = (email || workEmail || '').toLowerCase().trim();
    const normalizedCompanyEmail = (companyEmail || companyEmailDomain || '').toLowerCase().trim();
    const normalizedName = fullName || [firstName, lastName].filter(Boolean).join(' ');
    const normalizedPhone = phone || mobile;
    const normalizedDetails = companyDetails || companyDescription;
    const normalizedGst = companyGst || gstNumber;
    const normalizedCin = companyCin || cinNumber;
    const normalizedLocation = companyLocation;
    const normalizedCompanyType = companyType === 'Other' && companyTypeOther?.trim()
      ? `Other: ${companyTypeOther.trim()}`
      : companyType;
    const normalizedIndustry = industry === 'Other' && industryOther?.trim()
      ? `Other: ${industryOther.trim()}`
      : industry;
    const normalizedHiringFor = Array.isArray(hiringFor) ? hiringFor : JSON.parse(hiringFor || '[]');
    const normalizedDepartments = Array.isArray(departments) ? departments : JSON.parse(departments || '[]');

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isValidEmail(normalizedCompanyEmail)) {
      return res.status(400).json({ error: 'Invalid company email address' });
    }
    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (companyType === 'Other' && !companyTypeOther?.trim()) {
      return res.status(400).json({ error: 'Please specify your company type.' });
    }
    if (industry === 'Other' && !industryOther?.trim()) {
      return res.status(400).json({ error: 'Please specify your industry.' });
    }

    const registrationFiles = req.files || {};
    const gstFile = registrationFiles.gstFile?.[0];
    const cinFile = registrationFiles.cinFile?.[0];
    const bizRegFile = registrationFiles.bizRegFile?.[0];
    if (!gstNumber?.trim() || !cinNumber?.trim() || !gstFile || !cinFile || !bizRegFile) {
      return res.status(400).json({ error: 'GST number, CIN, GST certificate, CIN certificate, and business registration certificate are required.' });
    }

    const [gstCertificateUrl, cinCertificateUrl, businessRegistrationCertificateUrl] = await Promise.all([
      uploadRegistrationDocument(req, gstFile, 'gst'),
      uploadRegistrationDocument(req, cinFile, 'cin'),
      uploadRegistrationDocument(req, bizRegFile, 'business-registration'),
    ]);

    // Account security key: one company email can only ever back ONE
    // completed registration. This is checked here (not on the personal
    // payment email), so the same person can pay multiple times but can't
    // spin up a second account for a company that's already registered.
    const companyEmailTaken = await Recruiter.findOne({
      companyEmail: normalizedCompanyEmail,
      registrationStatus: 'complete',
    });
    if (companyEmailTaken) {
      return res.status(409).json({ error: 'An account already exists with this company email.' });
    }

    // verify-payment already created an 'incomplete' Recruiter placeholder for
    // this email (so the resume-registration email link has something to find).
    // Reuse that same document here instead of creating a second one, or every
    // immediate (non-resume-link) submission would 409 against its own
    // placeholder record.
    let recruiter = payment.userId ? await Recruiter.findById(payment.userId) : null;
    if (!recruiter) {
      recruiter = await Recruiter.findOne({ email: normalizedEmail, registrationStatus: 'incomplete' });
    }

    if (recruiter && recruiter.registrationStatus === 'complete') {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const renewalDueDate = new Date();
    renewalDueDate.setFullYear(renewalDueDate.getFullYear() + 1);

    if (recruiter) {
      recruiter.email = normalizedEmail;
      recruiter.passwordHash = passwordHash;
      recruiter.fullName = normalizedName;
      recruiter.phone = normalizedPhone;
      recruiter.companyName = companyName;
      recruiter.companyWebsite = companyWebsite;
      recruiter.companyEmail = normalizedCompanyEmail;
      recruiter.companyGst = normalizedGst;
      recruiter.companyCin = normalizedCin;
      recruiter.gstCertificateUrl = gstCertificateUrl;
      recruiter.cinCertificateUrl = cinCertificateUrl;
      recruiter.businessRegistrationCertificateUrl = businessRegistrationCertificateUrl;
      recruiter.companyDetails = normalizedDetails;
      recruiter.industry = normalizedIndustry;
      recruiter.companySize = companySize;
      recruiter.companyType = normalizedCompanyType;
      recruiter.location = normalizedLocation;
      recruiter.jobTitle = jobTitle;
      recruiter.recruiterRole = recruiterRole;
      recruiter.hiringVolume = hiringVolume;
      recruiter.hiringFor = normalizedHiringFor;
      recruiter.departments = normalizedDepartments;
      recruiter.languages = recruiter.languages || [];
      recruiter.expertiseTags = recruiter.expertiseTags || [];
      recruiter.renewalDueDate = renewalDueDate;
      recruiter.registrationStatus = 'complete';
      await recruiter.save();
    } else {
      recruiter = await Recruiter.create({
        email: normalizedEmail,
        passwordHash,
        fullName: normalizedName,
        phone: normalizedPhone,
        companyName,
        companyWebsite,
        companyEmail: normalizedCompanyEmail,
        companyGst: normalizedGst,
        companyCin: normalizedCin,
        gstCertificateUrl,
        cinCertificateUrl,
        businessRegistrationCertificateUrl,
        companyDetails: normalizedDetails,
        industry: normalizedIndustry,
        companySize,
        companyType: normalizedCompanyType,
        location: normalizedLocation,
        jobTitle,
        recruiterRole,
        hiringVolume,
        hiringFor: normalizedHiringFor,
        departments: normalizedDepartments,
        languages: [],
        expertiseTags: [],
        renewalDueDate,
        registrationStatus: 'complete',
      });
    }

    // Link payment record to recruiter
    payment.userId = recruiter._id;
    await payment.save();

    await createAdminNotification({
      key: 'newRecruiterSignup',
      title: 'New recruiter signup',
      message: `${recruiter.fullName || recruiter.email} registered as a recruiter for ${recruiter.companyName || 'a company'}.`,
      relatedId: recruiter._id,
    });

    res.status(201).json({
      message: 'Registration successful. Your account is under review.',
      recruiterId: recruiter._id,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/recruiter/resume-registration/:recruiterId
// Allows recruiter to complete registration after payment if they didn't complete it initially
// Public endpoint (no auth required - only if they know their recruiterId)
exports.resumeRegistration = async (req, res) => {
  try {
    const { recruiterId } = req.params;
    const {
      email, workEmail, password, fullName, firstName, lastName, phone, mobile,
      companyName, companyWebsite, companyDetails, companyDescription,
      companyEmail, companyEmailDomain, companyGst, gstNumber, companyCin, cinNumber,
      industry, industryOther, companySize, companyType, companyTypeOther, companyLocation,
      hiringVolume, hiringFor, departments, jobTitle, recruiterRole,
    } = req.body;

    // Find the incomplete recruiter record
    const recruiter = await Recruiter.findById(recruiterId);
    if (!recruiter) {
      return res.status(404).json({ error: 'Registration session not found. Please start fresh.' });
    }

    // Check if payment was completed for this recruiter
    const payment = await Payment.findOne({
      userId: recruiterId,
      purpose: 'recruiter_registration',
      status: 'success',
    });

    if (!payment) {
      return res.status(400).json({ error: 'No successful payment found. Please complete payment first.' });
    }

    // Resume mode displays the personal email as an editable field. Keep the
    // stored value in sync with the submitted form before completing the account.
    const normalizedEmail = (email || workEmail || recruiter.email || '').toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    if (companyType === 'Other' && !companyTypeOther?.trim()) {
      return res.status(400).json({ error: 'Please specify your company type.' });
    }
    if (industry === 'Other' && !industryOther?.trim()) {
      return res.status(400).json({ error: 'Please specify your industry.' });
    }

    const files = req.files || {};
    const gstCertificate = files.gstCertificate?.[0];
    const cinCertificate = files.cinCertificate?.[0];
    const businessRegistrationCertificate = files.businessRegistrationCertificate?.[0];
    if (!companyGst?.trim() || !companyCin?.trim() || !gstCertificate || !cinCertificate || !businessRegistrationCertificate) {
      return res.status(400).json({ error: 'GST number, CIN, GST certificate, CIN certificate, and business registration certificate are required.' });
    }

    const normalizedCompanyEmail = (companyEmail || companyEmailDomain || '').toLowerCase().trim();
    if (!isValidEmail(normalizedCompanyEmail)) {
      return res.status(400).json({ error: 'Invalid company email address' });
    }

    // Account security key: block a second completed account from reusing a
    // company email that already backs another completed registration.
    const companyEmailTaken = await Recruiter.findOne({
      companyEmail: normalizedCompanyEmail,
      registrationStatus: 'complete',
      _id: { $ne: recruiter._id },
    });
    if (companyEmailTaken) {
      return res.status(409).json({ error: 'An account already exists with this company email.' });
    }

    const normalizedName = fullName || [firstName, lastName].filter(Boolean).join(' ');
    const normalizedPhone = phone || mobile;
    const normalizedDetails = companyDetails || companyDescription;
    const normalizedGst = companyGst || gstNumber;
    const normalizedCin = companyCin || cinNumber;
    const normalizedLocation = companyLocation;
    const normalizedCompanyType = companyType === 'Other' && companyTypeOther?.trim()
      ? `Other: ${companyTypeOther.trim()}`
      : companyType;
    const normalizedIndustry = industry === 'Other' && industryOther?.trim()
      ? `Other: ${industryOther.trim()}`
      : industry;
    const normalizedHiringFor = Array.isArray(hiringFor) ? hiringFor : JSON.parse(hiringFor || '[]');
    const normalizedDepartments = Array.isArray(departments) ? departments : JSON.parse(departments || '[]');

    const [gstCertificateUrl, cinCertificateUrl, businessRegistrationCertificateUrl] = await Promise.all([
      uploadRegistrationDocument(req, gstCertificate, 'gst'),
      uploadRegistrationDocument(req, cinCertificate, 'cin'),
      uploadRegistrationDocument(req, businessRegistrationCertificate, 'business-registration'),
    ]);

    // Update recruiter with full details
    const passwordHash = await hashPassword(password);
    recruiter.email = normalizedEmail;
    recruiter.passwordHash = passwordHash;
    recruiter.fullName = normalizedName;
    recruiter.phone = normalizedPhone;
    recruiter.companyName = companyName;
    recruiter.companyWebsite = companyWebsite;
    recruiter.companyEmail = normalizedCompanyEmail;
    recruiter.companyGst = normalizedGst;
    recruiter.companyCin = normalizedCin;
    recruiter.gstCertificateUrl = gstCertificateUrl;
    recruiter.cinCertificateUrl = cinCertificateUrl;
    recruiter.businessRegistrationCertificateUrl = businessRegistrationCertificateUrl;
    recruiter.companyDetails = normalizedDetails;
    recruiter.industry = normalizedIndustry;
    recruiter.companySize = companySize;
    recruiter.companyType = normalizedCompanyType;
    recruiter.location = normalizedLocation;
    recruiter.jobTitle = jobTitle;
    recruiter.recruiterRole = recruiterRole;
    recruiter.hiringVolume = hiringVolume;
    recruiter.hiringFor = normalizedHiringFor;
    recruiter.departments = normalizedDepartments;
    recruiter.registrationStatus = 'complete';

    await recruiter.save();

    await createAdminNotification({
      key: 'newRecruiterSignup',
      title: 'New recruiter signup',
      message: `${recruiter.fullName || recruiter.email} registered as a recruiter for ${recruiter.companyName || 'a company'}.`,
      relatedId: recruiter._id,
    });

    res.status(200).json({
      message: 'Registration completed successfully. Your account is under review.',
      recruiterId: recruiter._id,
    });
  } catch (err) {
    console.error('Error resuming registration:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/recruiter/resume-registration/:recruiterId
// Returns the saved draft for the registration recovery form.
exports.getResumeRegistration = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({
      _id: req.params.recruiterId,
      registrationStatus: 'incomplete',
    }).select('-passwordHash -passwordResetToken -passwordResetExpiry');

    if (!recruiter) {
      return res.status(404).json({ error: 'Registration session not found. Please start fresh.' });
    }

    res.json({ recruiter });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/recruiter/resume-registration/:recruiterId/draft
// Saves any fields completed so far without requiring the full registration.
exports.saveResumeRegistrationDraft = async (req, res) => {
  try {
    const recruiter = await Recruiter.findOne({
      _id: req.params.recruiterId,
      registrationStatus: 'incomplete',
    });
    if (!recruiter) {
      return res.status(404).json({ error: 'Registration session not found. Please start fresh.' });
    }

    const {
      email, workEmail, firstName, lastName, fullName, phone, mobile, jobTitle,
      companyName, companyWebsite, companyEmailDomain, companyEmail, companySize,
      industry, industryOther, companyLocation, companyType, companyTypeOther,
      recruiterRole, companyDescription, gstNumber, cinNumber, hiringVolume,
      hiringFor, departments, password, currentStep,
    } = req.body;

    const normalizedEmail = (email || workEmail || recruiter.email || '').toLowerCase().trim();
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Enter a valid personal email before saving.' });
    }

    const setIfPresent = (field, value) => {
      if (value !== undefined && value !== null && value !== '') recruiter[field] = value;
    };

    recruiter.email = normalizedEmail;
    if (currentStep) recruiter.registrationDraftStep = Math.min(5, Math.max(1, Number(currentStep)));
    setIfPresent('fullName', fullName || [firstName, lastName].filter(Boolean).join(' '));
    setIfPresent('phone', phone || mobile);
    setIfPresent('jobTitle', jobTitle);
    setIfPresent('companyName', companyName);
    setIfPresent('companyWebsite', companyWebsite);
    setIfPresent('companyEmail', companyEmail || companyEmailDomain);
    setIfPresent('companySize', companySize);
    setIfPresent('industry', industry === 'Other' && industryOther ? `Other: ${industryOther}` : industry);
    setIfPresent('location', companyLocation);
    setIfPresent('companyType', companyType === 'Other' && companyTypeOther ? `Other: ${companyTypeOther}` : companyType);
    setIfPresent('recruiterRole', recruiterRole);
    setIfPresent('companyDetails', companyDescription);
    setIfPresent('companyGst', gstNumber);
    setIfPresent('companyCin', cinNumber);
    setIfPresent('hiringVolume', hiringVolume);

    if (hiringFor !== undefined) recruiter.hiringFor = Array.isArray(hiringFor) ? hiringFor : JSON.parse(hiringFor || '[]');
    if (departments !== undefined) recruiter.departments = Array.isArray(departments) ? departments : JSON.parse(departments || '[]');
    if (password && isStrongEnoughPassword(password)) recruiter.passwordHash = await hashPassword(password);

    const files = req.files || {};
    const uploads = [
      ['gstFile', 'gstCertificateUrl', 'gst'],
      ['cinFile', 'cinCertificateUrl', 'cin'],
      ['bizRegFile', 'businessRegistrationCertificateUrl', 'business-registration'],
    ];
    for (const [fileKey, field, folder] of uploads) {
      const file = files[fileKey]?.[0];
      if (file) recruiter[field] = await uploadRegistrationDocument(req, file, folder);
    }

    await recruiter.save();
    res.json({ message: 'Draft saved successfully.', recruiter });
  } catch (err) {
    console.error('Error saving recruiter registration draft:', err);
    res.status(500).json({ error: err.message });
  }
};

// POST /api/recruiter/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const recruiter = await Recruiter.findOne({ email });
    if (!recruiter) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (recruiter.accountStatus === 'suspended') {
      return res.status(403).json({ error: 'Account suspended! Please contact support.' });
    }

    if (recruiter.accountStatus === 'banned') {
      return res.status(403).json({ error: 'Account banned. Please contact support.' });
    }

    const match = await comparePassword(password, recruiter.passwordHash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Track login history
    const ip = req.ip || req.connection.remoteAddress || 'Unknown';
    const userAgent = req.get('user-agent') || 'Unknown';
    const device = extractDeviceInfo(userAgent);

    recruiter.loginHistory.push({
      ip,
      device,
      timestamp: new Date(),
    });

    // Keep only the 3 most recent login records
    if (recruiter.loginHistory.length > 3) {
      recruiter.loginHistory = recruiter.loginHistory.slice(-3);
    }

    await recruiter.save();

    const token = generateUserToken({ id: recruiter._id, role: 'recruiter' });

    const workspaceOwner = await Recruiter.findOne({
      'teamMembers.email': recruiter.email,
      'teamMembers.status': 'active',
      registrationStatus: 'complete',
    }).select('_id teamMembers').lean();
    const membership = workspaceOwner?.teamMembers?.find(
      (member) => member.email === recruiter.email && member.status === 'active'
    );

    res.json({
      token,
      companyName: recruiter.companyName,
      workspaceAccess: membership
        ? { role: membership.role, isOwner: false, ownerId: workspaceOwner._id }
        : { role: 'admin', isOwner: true, ownerId: recruiter._id },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Helper function to extract device info from user agent
function extractDeviceInfo(userAgent) {
  if (!userAgent) return 'Unknown';

  // Browser detection
  let browser = 'Unknown';
  let os = 'Unknown';

  if (userAgent.includes('Chrome') && !userAgent.includes('Chromium')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  else if (userAgent.includes('Opera')) browser = 'Opera';

  // OS detection
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'Mac';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('Linux')) os = 'Linux';

  return `${browser} · ${os}`;
}