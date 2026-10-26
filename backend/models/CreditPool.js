const mongoose = require('mongoose');

/**
 * A district credit pool.
 *
 * 11.91 credits from one two-acre farm is unsellable on its own — buyers
 * want volume. Pooling neighbouring farms into one lot is the mechanism
 * smallholders actually use to reach a tradeable quantity, and the app
 * already knows everyone's district.
 */
const CreditPoolSchema = new mongoose.Schema({
  district: { type: String, required: true, index: true },

  // Pools run per season so a farmer's credits aren't counted twice
  season: { type: String, required: true },   // e.g. "2026-kharif"

  members: [{
    userId:  { type: String, required: true },
    name:    String,
    village: String,
    credits: { type: Number, default: 0 },
    co2:     { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
  }],

  // A pool is worth taking to a buyer at roughly this size
  targetCredits: { type: Number, default: 500 },

  status: {
    type: String,
    enum: ['open', 'closed'],
    default: 'open',
  },

  createdAt: { type: Date, default: Date.now },
});

CreditPoolSchema.index({ district: 1, season: 1 }, { unique: true });

module.exports = mongoose.model('CreditPool', CreditPoolSchema);
