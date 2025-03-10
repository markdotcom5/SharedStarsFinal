/**
 * models/Application.js
 * MongoDB model for academy applications
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  background: {
    type: String,
    required: true,
    enum: ['engineering', 'science', 'medical', 'military', 'aviation', 'business', 'other']
  },
  motivation: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted'],
    default: 'pending'
  },
  aiReview: {
    score: Number,
    notes: String,
    recommendedPathway: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  }
});

// Create index for email to prevent duplicates
ApplicationSchema.index({ email: 1 }, { unique: true });

// Pre-save hook to update the updatedAt date
ApplicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to check if email already exists
ApplicationSchema.statics.emailExists = async function(email) {
  const count = await this.countDocuments({ email });
  return count > 0;
};

// Static method to get recent applications
ApplicationSchema.statics.getRecent = function(limit = 20) {
  return this.find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

// Static method to get application statistics
ApplicationSchema.statics.getStats = async function() {
  const totalCount = await this.countDocuments({});
  const pendingCount = await this.countDocuments({ status: 'pending' });
  const approvedCount = await this.countDocuments({ status: 'approved' });
  const rejectedCount = await this.countDocuments({ status: 'rejected' });
  const waitlistedCount = await this.countDocuments({ status: 'waitlisted' });
  
  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekCount = await this.countDocuments({ createdAt: { $gte: lastWeekDate } });
  
  return {
    total: totalCount,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    waitlisted: waitlistedCount,
    lastWeek: lastWeekCount
  };
};

console.log("✅ Application model loaded successfully");

// Prevent duplicate schema registration
const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

module.exports = Application;