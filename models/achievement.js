const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'MODULE_COMPLETION',
      'SKILL_MASTERY',
      'TIME_MILESTONE',
      'COMMUNITY_CONTRIBUTION',
      'PERFORMANCE_STREAK',
      'DIFFICULTY_BREAKTHROUGH'
    ],
    required: true
  },
  tier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    required: true
  },
  details: {
    title: String,
    description: String,
    icon: String,
    color: String,
    rarity: String
  },
  progress: {
    current: Number,
    required: Number,
    percentage: Number
  },
  rewards: [{
    type: {
      type: String,
      enum: ['XP', 'BADGE', 'FEATURE_UNLOCK', 'TITLE']
    },
    value: mongoose.Schema.Types.Mixed
  }],
  unlockConditions: {
    moduleProgress: Number,
    skillLevel: Number,
    timeSpent: Number,
    performanceMetric: Number
  },
  status: {
    isUnlocked: {
      type: Boolean,
      default: false
    },
    unlockedAt: Date,
    displayedToUser: {
      type: Boolean,
      default: false
    }
  }
}, { timestamps: true });

// Instance method to return a summary of the achievement
AchievementSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.details.title,
    description: this.details.description,
    tier: this.tier,
    type: this.type,
    isUnlocked: this.status.isUnlocked,
    unlockedAt: this.status.unlockedAt,
    progress: this.progress
  };
};

// Prevent OverwriteModelError by checking if the model already exists
module.exports = mongoose.models.Achievement
  ? mongoose.models.Achievement
  : mongoose.model('Achievement', AchievementSchema);
