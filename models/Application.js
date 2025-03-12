/**
 * models/Application.js
 * MongoDB model for enhanced SharedStars academy applications
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ApplicationSchema = new Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true
  },
  highestEducation: {
    type: String,
    required: false,
    trim: true
  },
  experience: {
    type: String,
    required: false
  },
  skills: [{
    type: String,
    enum: ['AI', 'Engineering', 'Medical & Biology', 'Space Sciences', 'Entrepreneurship', 'Other']
  }],
  lifeMissionAlignment: {
    type: String,
    required: true,
    trim: true
  },
  spaceMissionChoice: {
    type: String,
    required: true,
    trim: true
  },
  vrAiExperience: {
    type: String,
    required: false,
    trim: true
  },
  linkedInUrl: {
    type: String,
    required: false,
    trim: true
  },
  motivation: { // kept if additional detail is needed
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'waitlisted'],
    default: 'pending'
  },
  aiReview: {
    score: {
      type: Number,
      default: 0.5
    },
    notes: String,
    recommendedPathway: String
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for email to enforce uniqueness
ApplicationSchema.index({ email: 1 }, { unique: true });

// Pre-save hook to automatically update 'updatedAt'
ApplicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Static method to check if email exists
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

// Static method to gather application statistics
ApplicationSchema.statics.getStats = async function() {
  const statuses = ['pending', 'approved', 'rejected', 'waitlisted'];
  const counts = await Promise.all(
    statuses.map(status => this.countDocuments({ status }))
  );

  const lastWeekDate = new Date();
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekCount = await this.countDocuments({ createdAt: { $gte: lastWeekDate } });

  return {
    total: counts.reduce((sum, count) => sum + count, 0),
    pending: counts[0],
    approved: counts[1],
    rejected: counts[2],
    waitlisted: counts[3],
    lastWeek: lastWeekCount
  };
};

console.log("✅ Enhanced SharedStars Application model loaded successfully");

const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

module.exports = Application;