const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },

  email: {
    type: String,
    required: true,
    unique: true
  },

  mobile: String,

  password: {
    type: String,
    required: true,
    // Excluded from every query by default — opt in with .select('+password')
    select: false
  },

  role: {
    type: String,
    enum: ['farmer', 'buyer', 'admin'],
    default: 'farmer'
  },

  village: String,
  district: String,
  cropType: String,
  landArea: String,

  // ── Buyer profile ────────────────────────────────────────
  // Buyers were a hardcoded array in the frontend. These make a buyer
  // a real account that farmers can find and contact.
  companyName: String,
  buyerType: {
    type: String,
    enum: ['Biogas Plant', 'Biochar Mfr', 'Biomass Power', 'Compost', 'Other'],
  },
  capacityTonsPerDay: Number,
  acceptedWaste: { type: [String], default: [] },

  // ── Verification ─────────────────────────────────────────
  // "Verified Buyers" appeared in the marketplace with nothing behind the
  // word. Only an admin can set this, through /api/admin/users/:id/verify.
  verified: { type: Boolean, default: false },
  verifiedAt: Date,
  verifiedBy: String,
  verificationNote: String,

  // ── Phone alerts ─────────────────────────────────────────
  notifyByPhone: { type: Boolean, default: true },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);