const mongoose = require('mongoose');

const PurchaseRequestSchema =
new mongoose.Schema({

  listingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Listing'
  },

  buyerId: String,
  buyerName: String,

  // farmerId is the display code ("AWN-<id>"); farmerUserId is the real
  // account id used for lookups and notifications.
  farmerId: String,
  farmerUserId: String,
  farmerName: String,

  quantity: Number,

  // What the farmer actually agreed to, which may be less than was asked
  acceptedQuantity: Number,

  // ── Price negotiation ────────────────────────────────────
  // Every real agricultural transaction is negotiated; accept-or-walk-away
  // at the listed price is not how a deal gets made.
  listedPricePerTon: Number,   // the price when the request was sent
  offeredPricePerTon: Number,  // what the buyer offered
  counterPricePerTon: Number,  // what the farmer came back with
  agreedPricePerTon: Number,   // settled on acceptance

  message: String,

  // Pickup date, transport, price — the things a deal is actually made of
  messages: [{
    fromId: String,
    fromName: String,
    role: String,
    text: String,
    at: { type: Date, default: Date.now }
  }],

  status: {
    type: String,
    default: 'pending'
  },

  createdAt: {
    type: Date,
    default: Date.now
  }

});

module.exports =
mongoose.model(
  'PurchaseRequest',
  PurchaseRequestSchema
);