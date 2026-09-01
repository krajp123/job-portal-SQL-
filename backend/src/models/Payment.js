const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userType: { type: String, enum: ['candidate', 'recruiter'], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, refPath: 'userTypeRef' }, // Optional during payment creation
    userTypeRef: { type: String, enum: ['Candidate', 'Recruiter'], required: true },
    userEmail: { type: String }, // Store email for pre-registration payments
    userName: { type: String }, // Store name for pre-registration payments
    userCompany: { type: String }, // Store company name for recruiter registrations

    purpose: {
      type: String,
      enum: ['registration', 'renewal', 'resume_download', 'wallet_recharge', 'candidate_registration', 'recruiter_registration'],
      required: true,
    },
    amount: { type: Number, required: true },
    baseAmount: { type: Number },
    gstAmount: { type: Number, default: 0 },
    gstRate: { type: Number, default: 0 },
    totalAmount: { type: Number },

    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },

    relatedResumeDownload: {
      candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    },

    walletCreditDetails: {
      paymentMethodId: String,
      walletTransactionId: { type: mongoose.Schema.Types.ObjectId },
    },

    renewalDueDateAfterPayment: { type: Date },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
