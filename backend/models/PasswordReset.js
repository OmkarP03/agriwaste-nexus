const mongoose = require('mongoose');

/**
 * One-time password-reset codes.
 *
 * Kept in its own collection so the User schema is untouched and the
 * OTP hash can never leak through a login/register response.
 * Documents delete themselves 30 minutes after creation (TTL index).
 */
const PasswordResetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  // bcrypt hash of the 6-digit code — the plain code is never stored
  otpHash: {
    type: String,
    required: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },

  attempts: {
    type: Number,
    default: 0,
  },

  createdAt: {
    type: Date,
    default: Date.now,
    // TTL: Mongo removes the document 30 minutes after it was created
    expires: 1800,
  },
});

module.exports = mongoose.model('PasswordReset', PasswordResetSchema);
