// models/StellaInteraction.js
const mongoose = require('mongoose');

const StellaInteractionSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  question: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  userState: {
    emotionalState: String,
    currentActivity: String,
    trainingContext: String,
    summary: Object
  },
  queryAnalysis: {
    intent: String,
    entities: [String],
    topics: [String],
    confidence: Number,
    summary: Object
  },
  contextData: {
    page: String,
    module: String,
    userActivity: Object,
    deviceProperties: Object,
    environmentalContext: Object
  },
  responseData: {
    primaryStrategy: String,
    enginesUsed: [String],
    confidence: Number,
    impactAnalysis: Object,
    processingTime: Number
  },
  feedback: {
    helpful: Boolean,
    rating: Number,
    comments: String,
    timestamp: Date
  }
}, { timestamps: true });

// Indexes for performance
StellaInteractionSchema.index({ userId: 1, timestamp: -1 });
StellaInteractionSchema.index({ sessionId: 1, timestamp: 1 });

module.exports = mongoose.model('StellaInteraction', StellaInteractionSchema);