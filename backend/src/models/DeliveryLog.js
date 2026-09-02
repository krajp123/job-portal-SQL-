const mongoose = require('mongoose');

const deliveryLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['email', 'sms', 'notification'],
      required: true,
    },
    recipient: { type: String }, // email or phone number
    status: {
      type: String,
      enum: ['sent', 'delivered', 'failed', 'bounced'],
      default: 'sent',
    },

    // Related entity information
    relatedModel: { type: String }, // 'candidate', 'recruiter', 'admin'
    relatedId: { type: mongoose.Schema.Types.ObjectId },

    template: { type: String }, // which email/SMS template (e.g., 'application_received', 'otp')
    provider: { type: String }, // 'twilio', 'mailgun', 'sendgrid', 'custom'
    externalId: { type: String }, // provider's message ID for tracking

    metadata: { type: mongoose.Schema.Types.Mixed }, // additional data

    errorMessage: { type: String }, // error details if failed
    deliveredAt: { type: Date }, // when provider confirmed delivery
  },
  { timestamps: true } // createdAt automatically added
);

// Index for common queries
deliveryLogSchema.index({ createdAt: 1 });
deliveryLogSchema.index({ type: 1, status: 1 });
deliveryLogSchema.index({ type: 1, createdAt: 1 });
deliveryLogSchema.index({ relatedModel: 1, relatedId: 1 });

module.exports = mongoose.model('DeliveryLog', deliveryLogSchema);
