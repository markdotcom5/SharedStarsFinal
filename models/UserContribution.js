const mongoose = require('mongoose');

const userContributionSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  questionCount: {
    type: Number,
    default: 0
  },
  helpfulFeedbackCount: {
    type: Number,
    default: 0
  },
  contributionScore: {
    type: Number,
    default: 0
  },
  usefulQuestionsCount: {
    type: Number,
    default: 0  // Count of questions that helped improve STELLA
  },
  recognitionBadges: [{
    type: String,
    enum: [
      'KNOWLEDGE_CONTRIBUTOR', 
      'FEEDBACK_CHAMPION',
      'QUESTION_PIONEER',
      'STELLA_TRAINER'
    ]
  }],
  rank: {
    type: Number
  },
  lastContribution: {
    type: Date
  }
});

// Index for ranking display
userContributionSchema.index({ contributionScore: -1 });

const UserContribution = mongoose.model('UserContribution', userContributionSchema);

module.exports = UserContribution;