const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/* ==========================
   Study Group Schema
========================== */
const studyGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['training', 'certification', 'mission', 'general'],
    required: true
  },
  leader: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['member', 'mentor', 'expert'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  capacity: {
    type: Number,
    default: 10
  },
  status: {
    type: String,
    enum: ['active', 'full', 'archived'],
    default: 'active'
  },
  aiGuidance: {
    recommendedModules: [String],
    groupStrengths: [String],
    improvementAreas: [String],
    lastAnalysis: Date
  },
  metrics: {
    averageEngagement: Number,
    completionRate: Number,
    groupScore: Number
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { timestamps: true });

/* ==========================
   Training Session Schema (Community version)
========================== */
const trainingSessionSchema = new Schema({
  group: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  type: {
    type: String,
    enum: ['study', 'practice', 'assessment', 'mission'],
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active'
    },
    progress: Number,
    performance: {
      accuracy: Number,
      completionTime: Number,
      score: Number
    }
  }],
  module: {
    type: String,
    required: true
  },
  aiGuidance: {
    recommendations: [String],
    adaptations: [String],
    performanceAnalysis: Schema.Types.Mixed
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, { timestamps: true });

/* ==========================
   Challenge Schema
========================== */
const challengeSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: {
    type: String,
    enum: ['individual', 'team', 'global'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'expert'],
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'StudyGroup'
    },
    progress: Number,
    score: Number,
    completedAt: Date
  }],
  objectives: [{
    description: String,
    points: Number,
    type: String
  }],
  rewards: [{
    type: String,
    points: Number,
    description: String
  }],
  leaderboard: [{
    participant: Schema.Types.Mixed, // Can be User or StudyGroup
    score: Number,
    rank: Number,
    updatedAt: Date
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'active', 'completed'],
    default: 'upcoming'
  }
}, { timestamps: true });

/* ==========================
   Discussion Forum Schema
========================== */
const discussionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'mission', 'certification', 'help'],
    required: true
  },
  tags: [String],
  likes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    likes: Number,
    isPinned: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiModeration: {
    topicAnalysis: Schema.Types.Mixed,
    suggestedExperts: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    relatedResources: [String]
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date
}, { timestamps: true });

/* ==========================
   Peer Match Schema
========================== */
const peerMatchSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  preferences: {
    trainingLevel: String,
    interests: [String],
    availability: [String],
    language: [String]
  },
  matches: [{
    peer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    compatibilityScore: Number,
    matchReason: [String],
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    }
  }],
  aiAnalysis: {
    recommendedActivities: [String],
    learningStyle: String,
    collaborationSuggestions: [String]
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

/* ==========================
   Conditional Model Exports
========================== */
const StudyGroup = mongoose.models.StudyGroup
  ? mongoose.models.StudyGroup
  : mongoose.model('StudyGroup', studyGroupSchema);

const CommunityTrainingSession = mongoose.models.TrainingSession
  ? mongoose.models.TrainingSession
  : mongoose.model('TrainingSession', trainingSessionSchema);

const CommunityChallenge = mongoose.models.Challenge
  ? mongoose.models.Challenge
  : mongoose.model('Challenge', challengeSchema);

const Discussion = mongoose.models.Discussion
  ? mongoose.models.Discussion
  : mongoose.model('Discussion', discussionSchema);

const PeerMatch = mongoose.models.PeerMatch
  ? mongoose.models.PeerMatch
  : mongoose.model('PeerMatch', peerMatchSchema);

module.exports = {
  StudyGroup,
  TrainingSession: CommunityTrainingSession,
  Challenge: CommunityChallenge,
  Discussion,
  PeerMatch
};
