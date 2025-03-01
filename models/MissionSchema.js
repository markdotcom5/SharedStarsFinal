// models/Mission4Schema.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Schema for Mission 4: Microgravity Coordination Drills
 * 
 * This schema defines the structure for storing Mission 4 specific training data
 * It extends the base TrainingSession schema with exercise-specific metrics
 */
const Mission4Schema = new Schema({
  // Common fields (also exist in TrainingSession)
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionDate: {
    type: Date,
    default: Date.now,
    index: true
  },
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  creditsEarned: {
    type: Number,
    default: 0
  },

  // Exercise specific data
  exercises: [{
    exerciseId: {
      type: String,
      enum: ['single-leg-balance', 'crossbody-coordination', 'object-manipulation', 'spatial-awareness'],
      required: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    duration: {
      type: Number, // in seconds
      default: 0
    },
    metrics: {
      // Single Leg Balance metrics
      stabilityScore: Number,
      balanceTime: Number,
      
      // Cross-Body Coordination metrics
      accuracyScore: Number,
      tempoScore: Number,
      
      // Object Manipulation metrics
      precisionScore: Number,
      controlScore: Number,
      
      // Spatial Awareness metrics
      reactionScore: Number,
      accuracyScore: Number,
      
      // Common metrics
      progressLevel: {
        type: Number,
        min: 1,
        max: 5,
        default: 1
      }
    },
    stellaFeedback: String
  }],

  // STELLA AI analysis
  stellaAnalysis: {
    strengths: [String],
    improvementAreas: [String],
    recommendations: [String],
    performanceChange: {
      type: Number, // percentage change from last session
      default: 0
    }
  },

  // Training conditions
  environmentalFactors: {
    location: {
      type: String,
      enum: ['home', 'gym', 'outdoor', 'other'],
      default: 'home'
    },
    equipmentUsed: [String],
    difficultyLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    }
  },

  // User feedback
  userFeedback: {
    difficulty: {
      type: Number,
      min: 1,
      max: 10
    },
    enjoyment: {
      type: Number,
      min: 1,
      max: 10
    },
    comments: String
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  collection: 'mission4_sessions'
});

// Indexes for performance
Mission4Schema.index({ userId: 1, sessionDate: -1 });
Mission4Schema.index({ 'exercises.exerciseId': 1 });

// Helper methods
Mission4Schema.methods.getTotalScore = function() {
  let totalScore = 0;
  let validMetricsCount = 0;
  
  this.exercises.forEach(exercise => {
    Object.keys(exercise.metrics).forEach(key => {
      if (key.includes('Score') && typeof exercise.metrics[key] === 'number') {
        totalScore += exercise.metrics[key];
        validMetricsCount++;
      }
    });
  });
  
  return validMetricsCount > 0 ? Math.round(totalScore / validMetricsCount) : 0;
};

Mission4Schema.methods.getImprovementAreas = function() {
  const scores = {};
  
  this.exercises.forEach(exercise => {
    Object.keys(exercise.metrics).forEach(key => {
      if (key.includes('Score') && typeof exercise.metrics[key] === 'number') {
        scores[`${exercise.exerciseId}_${key}`] = exercise.metrics[key];
      }
    });
  });
  
  // Return exercise areas with scores below threshold (75%)
  return Object.keys(scores)
    .filter(key => scores[key] < 75)
    .map(key => {
      const [exerciseId, metric] = key.split('_');
      return { exerciseId, metric, score: scores[key] };
    });
};

// Virtual for checking if session is complete
Mission4Schema.virtual('isComplete').get(function() {
  return this.exercises.every(ex => ex.completed);
});

module.exports = mongoose.model('Mission4Session', Mission4Schema);