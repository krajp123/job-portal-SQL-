const Recruiter = require('../../models/Recruiter');
const { hashPassword, comparePassword } = require('../../utils/hashPassword');
const { generateUserToken } = require('../../utils/generateToken');
const { isValidEmail, isStrongEnoughPassword } = require('../../utils/validators');
const { createAdminNotification } = require('../../services/adminNotification.service');
const { razorpayInstance, PRICING } = require('../../config/razorpay');
const { calculateCharge } = require('../../services/tax.service');
const Payment = require('../../models/Payment');
const crypto = require('crypto');

// POST /api/recruiter/register/create-payment-order
// Creates a Razorpay order for recruiter registration payment
// Public endpoint (no auth required)
exports.createPaymentOrder = async (req, res) => {
  try {
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
      purpose: 'registration', // Use 'registration' enum value, not custom 'recruiter_registration'
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

    // Create temporary recruiter record with 'incomplete' status
    // This allows recruiter to resume registration later if they close browser/lose connection
    const normalizedEmail = email.toLowerCase().trim();
    
    let recruiter = await Recruiter.findOne({ email: normalizedEmail });
    if (!recruiter) {
      recruiter = await Recruiter.create({
        email: normalizedEmail,
        passwordHash: 'temp_hash', // Will be replaced when completing registration
        companyName: 'Pending',
        registrationStatus: 'incomplete',
        renewalDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      });
    }

    // Link payment to recruiter
    payment.userId = recruiter._id;
    await payment.save();

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
      industry, companySize, companyType, companyLocation,
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

    const normalizedEmail = email || workEmail;
    const normalizedName = fullName || [firstName, lastName].filter(Boolean).join(' ');
    const normalizedPhone = phone || mobile;
    const normalizedDetails = companyDetails || companyDescription;
    const normalizedGst = companyGst || gstNumber;
    const normalizedCin = companyCin || cinNumber;
    const normalizedLocation = companyLocation;

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const existing = await Recruiter.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }

    const passwordHash = await hashPassword(password);

    const renewalDueDate = new Date();
    renewalDueDate.setFullYear(renewalDueDate.getFullYear() + 1);

    const recruiter = await Recruiter.create({
      email: normalizedEmail,
      passwordHash,
      fullName: normalizedName,
      phone: normalizedPhone,
      companyName,
      companyWebsite,
      companyEmail: companyEmail || companyEmailDomain,
      companyGst: normalizedGst,
      companyCin: normalizedCin,
      companyDetails: normalizedDetails,
      industry,
      companySize,
      companyType,
      location: normalizedLocation,
      jobTitle,
      recruiterRole,
      hiringVolume,
      hiringFor,
      departments,
      languages: [],
      expertiseTags: [],
      renewalDueDate,
    });

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
      password, fullName, firstName, lastName, phone, mobile,
      companyName, companyWebsite, companyDetails, companyDescription,
      companyEmail, companyEmailDomain, companyGst, gstNumber, companyCin, cinNumber,
      industry, companySize, companyType, companyLocation,
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
      purpose: 'registration',
      status: 'success',
    });

    if (!payment) {
      return res.status(400).json({ error: 'No successful payment found. Please complete payment first.' });
    }

    // Validate required fields
    if (!isValidEmail(recruiter.email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }
    if (!isStrongEnoughPassword(password)) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const normalizedName = fullName || [firstName, lastName].filter(Boolean).join(' ');
    const normalizedPhone = phone || mobile;
    const normalizedDetails = companyDetails || companyDescription;
    const normalizedGst = companyGst || gstNumber;
    const normalizedCin = companyCin || cinNumber;
    const normalizedLocation = companyLocation;

    // Update recruiter with full details
    const passwordHash = await hashPassword(password);
    recruiter.passwordHash = passwordHash;
    recruiter.fullName = normalizedName;
    recruiter.phone = normalizedPhone;
    recruiter.companyName = companyName;
    recruiter.companyWebsite = companyWebsite;
    recruiter.companyEmail = companyEmail || companyEmailDomain;
    recruiter.companyGst = normalizedGst;
    recruiter.companyCin = normalizedCin;
    recruiter.companyDetails = normalizedDetails;
    recruiter.industry = industry;
    recruiter.companySize = companySize;
    recruiter.companyType = companyType;
    recruiter.location = normalizedLocation;
    recruiter.jobTitle = jobTitle;
    recruiter.recruiterRole = recruiterRole;
    recruiter.hiringVolume = hiringVolume;
    recruiter.hiringFor = hiringFor;
    recruiter.departments = departments;
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

    res.json({ token, companyName: recruiter.companyName });
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
