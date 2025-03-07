const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  moduleType: { type: String, required: true },  // 'initial', 'physical', 'mental', 'technical', 'mission-core-balance', etc.
  
  // Original response structure (maintain backward compatibility)
  responses: {
    // Professional assessment fields
    professionalBackground: {
      professionalCategory: String,
      yearsExperience: String,
      educationLevel: String
    },
    aptitudeSkills: {
      decisionMakingPreference: String,
      taskPreference: String,
      comfortWithTechnology: String,
      projectGoal: String
    },
    technicalCognitive: {
      troubleshootingConfidence: String,
      instructionsPreference: String,
      logicalReasoning: String,
      multitaskingComfort: String
    },
    personalityTraits: {
      environmentPreference: String,
      feedbackResponse: String,
      colleagueDescription: String
    },
    spaceReadinessGoals: {
      primaryMotivation: String,
      interestArea: String,
      physicalFitnessLevel: String
    },
    
    // New readiness assessment fields
    physicalBaseline: {
      cardio_fitness: Number,
      strength_pushups: Number,
      strength_core: String, // duration format
      flexibility: String,
      balance: String, // duration format
      previous_training: [String]
    },
    medicalConsiderations: {
      motion_sickness: Number,
      vision: String,
      medical_conditions: [String],
      altitude_adaptation: Number,
      medication: String
    },
    psychologicalReadiness: {
      stress_response: String,
      claustrophobia: Number,
      team_dynamics: String,
      decision_making: String,
      sleep_quality: Number,
      adaptation: Number
    },
    technicalAptitude: {
      space_knowledge: Number,
      technical_background: [String],
      problem_solving: String,
      learning_style: [String],
      tech_comfort: Number
    },
    
    // Physical assessment specific fields
    physicalSpecific: {
      cardio_endurance: String,
      strength_assessment: Number,
      recovery_time: String
    },
    
    // Mental assessment specific fields
    mentalSpecific: {
      stress_tolerance: Number,
      focus_duration: String
    },
    
    // Mission-specific fields
    missionSpecific: {
      plank_duration: String,
      balance_challenge: Number,
      core_experience: [String]
    },
    
    // Flexible field for any additional responses
    dynamicFollowUps: mongoose.Schema.Types.Mixed
  },
  
  // Enhanced results and analysis
  results: {
    scores: {
      overall: Number,
      physical: Number,
      mental: Number,
      technical: Number,
      strength: Number,
      endurance: Number,
      flexibility: Number,
      adaptation: Number,
      teamwork: Number,
      problemSolving: Number
    },
    strengths: [String],
    areasForImprovement: [String],
    readinessLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
    }
  },
  
  // STELLA AI recommendations
  stellaRecommendations: {
    topSkills: [String],
    personalizedPath: [String],
    message: String,
    actionItems: [String],
    suggestedModules: [String],
    estimatedTimeToReady: {
      years: Number,
      months: Number
    }
  },
  
  // Metadata
  completionDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  assessmentVersion: { type: String, default: '1.0' },
  assessmentDuration: Number // Time taken to complete in seconds
});

// Pre-save hook to update lastUpdated timestamp
assessmentSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Add methods for scoring
assessmentSchema.methods.calculateScores = function() {
  // Implement scoring logic here
  // This would analyze responses and populate the scores object
};

// Add virtual for assessment age
assessmentSchema.virtual('assessmentAge').get(function() {
  return Math.floor((Date.now() - this.completionDate) / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Assessment', assessmentSchema);