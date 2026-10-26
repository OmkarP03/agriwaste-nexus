const mongoose = require('mongoose');

/**
 * A named field on the farm.
 *
 * Farms are several plots with different crops and yields. Without this,
 * a farmer re-enters crop, area and yield on every visit to every
 * calculator — the main reason people stop using a tool like this.
 */
const PlotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },

  name: {
    type: String,
    required: true,
    trim: true,
  },

  cropType: { type: String, required: true },
  area:     { type: Number, required: true },
  unit:     { type: String, default: 'acres' },
  yieldPerAcre: { type: Number, required: true },

  note: String,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Plot', PlotSchema);
