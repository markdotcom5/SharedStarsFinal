// models/UserCountdown.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReductionHistorySchema = new Schema({
  date: { type: Date, default: Date.now },
  amount: { type: Number, required: true },
  reason: { type: String, required: true },
  type: { type: String, required: true }
});

const UserCountdownSchema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  daysRemaining: {
    type: Number,
    required: true,
    default: 1460 // 4 years in days
  },
  baselineDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  totalReduction: {
    type: Number,
    required: true,
    default: 0
  },
  reductionHistory: [ReductionHistorySchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate schema compilation
const UserCountdown = mongoose.models.UserCountdown || mongoose.model('UserCountdown', UserCountdownSchema);

module.exports = UserCountdown;