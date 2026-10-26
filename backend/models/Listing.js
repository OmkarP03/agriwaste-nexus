const mongoose = require('mongoose');

const ListingSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  farmerId: {
  type: String
},

  farmerName: {
    type: String,
    required: true
  },
  location: String,
  cropType: {
    type: String,
    required: true
  },
  wasteType: String,
  quantity: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: 'tons'
  },
  pricePerTon: Number,
  contact: String,

  // How much is still unsold. Set to `quantity` when the listing is
  // created and reduced each time the farmer accepts a request.
  quantityRemaining: Number,

  // Up to three photographs, held as resized data URLs. Residue is bought
  // on condition — moisture, ash, contamination — so buyers need to see it.
  images: {
    type: [String],
    default: []
  },

  // Straw listed in October shouldn't still be on the marketplace in March.
  expiresAt: Date,

  status: {
    type: String,
    default: 'available'
  },

  // Admin moderation. 'removed' hides the listing from the marketplace
  // without destroying the record.
  moderation: {
    state:  { type: String, enum: ['ok', 'flagged', 'removed'], default: 'ok' },
    reason: String,
    by:     String,
    at:     Date,
  },
  postedDate: {
    type: Date,
    default: Date.now
  },
  description: String
});

module.exports = mongoose.model('Listing', ListingSchema);