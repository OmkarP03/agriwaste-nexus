const mongoose = require('mongoose');

const CalculationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  inputs: {
    type: Object,
    required: true
  },

  result: {
    type: Object,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Calculation = mongoose.model(
  'Calculation',
  CalculationSchema
);

console.log("CALCULATION MODEL FILE LOADED");
console.log(Calculation);

module.exports = Calculation;