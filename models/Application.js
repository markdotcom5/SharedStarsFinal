/**
 * models/Application.js
 * MongoDB model for enhanced SharedStars academy applications with cognitive profiling
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Cognitive Profile Schema for Space Cognitive Load Balancer™
const CognitiveProfileSchema = new Schema({
  // Baseline cognitive capacity (0-1 scale)
  baselineCapacity: {
    type: Number,
    default: 0.7,
    min: 0.3,
    max: 1.0
  },
  
  // Optimal learning periods throughout the day
  optimalLearningPeriods: [{
    startHour: Number,
    endHour: Number,
    capacity: Number
  }],
  
  // Cognitive fatigue threshold
  fatigueThreshold: {
    type: Number,
    default: 0.65,
    min: 0.3,
    max: 0.9
  },
  
  // Recovery rate per hour
  recoveryRate: {
    type: Number,
    default: 0.08,
    min: 0.01,
    max: 0.2
  },
  
  // The core cognitive fingerprint
  cognitiveFingerprint: {
    visualProcessing: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    auditoryProcessing: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    proceduralLearning: {
      type: Number,
      default: 0.7,
      min: 0.1,
      max: 1.0
    },
    multiTaskingCapacity: {
      type: Number,
      default: 0.6,
      min: 0.1,
      max: 1.0
    },
    stressResponseFactor: {
      type: Number,
      default: 0.6,
      min: 0.1,
      max: 1.0
    }
  },
  
  // Flag indicating if full assessment is still needed
  initialAssessmentNeeded: {
    type: Boolean,
    default: true
  },
  
  // Tracking info
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Source of the profile data
  source: {
    type: String,
    enum: ['application', 'assessment', 'training', 'ai-analysis', 'manual', 'fallback'],
    default: 'application'
  },
  
  // Notes about the profile
  notes: String
});

const ApplicationSchema = new Schema({
  firstName: {
    type: String,
    trim: true
  },
  middleInitial: {
    type: String,
    trim: true,
    maxlength: 1
  },
  lastName: {
    type: String,
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
  
  // STELLA's Cognitive Profile - Space Cognitive Load Balancer™
  cognitiveProfile: {
    type: CognitiveProfileSchema,
    default: () => ({}) // Will use defaults from schema
  },
  
  // STELLA's personalized insights for this applicant
  stellaInsights: {
    initialImpression: String,
    potentialStrengths: [String],
    suggestedFocus: String,
    personalizedMessage: String,
    lastUpdated: {
      type: Date,
      default: Date.now
    }
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
  
  // If cognitive profile doesn't exist, create default
  if (!this.cognitiveProfile || Object.keys(this.cognitiveProfile).length === 0) {
    this.cognitiveProfile = {
      baselineCapacity: 0.7,
      optimalLearningPeriods: [
        { startHour: 9, endHour: 12, capacity: 0.8 },
        { startHour: 15, endHour: 18, capacity: 0.75 }
      ],
      fatigueThreshold: 0.65,
      recoveryRate: 0.08,
      cognitiveFingerprint: {
        visualProcessing: 0.7,
        auditoryProcessing: 0.7,
        proceduralLearning: 0.7,
        multiTaskingCapacity: 0.6,
        stressResponseFactor: 0.6
      },
      initialAssessmentNeeded: true,
      source: 'application'
    };
  }
  
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

// Method to update cognitive profile based on assessment results
ApplicationSchema.methods.updateCognitiveProfile = async function(assessmentResults) {
  const currentProfile = this.cognitiveProfile || {};
  
  // Create updated profile with weighted averaging of new data
  const updatedProfile = {
    baselineCapacity: weightedAverage(currentProfile.baselineCapacity || 0.7, 
                                     assessmentResults.measuredCapacity || 0.7, 
                                     0.7), // 70% weight to new assessment
    
    fatigueThreshold: weightedAverage(currentProfile.fatigueThreshold || 0.65,
                                    assessmentResults.fatiguePoint || 0.65,
                                    0.8), // 80% weight to new assessment
                                    
    recoveryRate: weightedAverage(currentProfile.recoveryRate || 0.08,
                                assessmentResults.recoveryMetric || 0.08,
                                0.6), // 60% weight to new assessment
                                
    cognitiveFingerprint: {
      visualProcessing: weightedAverage(
        currentProfile.cognitiveFingerprint?.visualProcessing || 0.7,
        assessmentResults.visualScore || 0.7,
        0.8
      ),
      auditoryProcessing: weightedAverage(
        currentProfile.cognitiveFingerprint?.auditoryProcessing || 0.7,
        assessmentResults.auditoryScore || 0.7,
        0.8
      ),
      proceduralLearning: weightedAverage(
        currentProfile.cognitiveFingerprint?.proceduralLearning || 0.7,
        assessmentResults.proceduralScore || 0.7,
        0.8
      ),
      multiTaskingCapacity: weightedAverage(
        currentProfile.cognitiveFingerprint?.multiTaskingCapacity || 0.6,
        assessmentResults.multitaskingScore || 0.6,
        0.8
      ),
      stressResponseFactor: weightedAverage(
        currentProfile.cognitiveFingerprint?.stressResponseFactor || 0.6,
        assessmentResults.stressResponseScore || 0.6,
        0.8
      )
    },
    
    initialAssessmentNeeded: false,
    lastUpdated: new Date(),
    source: 'assessment'
  };
  
  // Preserve optimal learning periods if they exist
  if (currentProfile.optimalLearningPeriods && currentProfile.optimalLearningPeriods.length > 0) {
    updatedProfile.optimalLearningPeriods = currentProfile.optimalLearningPeriods;
  } else {
    updatedProfile.optimalLearningPeriods = [
      { startHour: 9, endHour: 12, capacity: 0.8 },
      { startHour: 15, endHour: 18, capacity: 0.75 }
    ];
  }
  
  // Update the profile
  this.cognitiveProfile = updatedProfile;
  
  // Generate STELLA insights based on updated profile
  this.stellaInsights = {
    initialImpression: generateSTELLAImpression(updatedProfile),
    potentialStrengths: identifyStrengthsFromProfile(updatedProfile),
    suggestedFocus: determineSuggestedFocus(updatedProfile),
    personalizedMessage: generatePersonalizedMessage(updatedProfile),
    lastUpdated: new Date()
  };
  
  await this.save();
  return updatedProfile;
};

// Helper function for weighted averaging
function weightedAverage(oldValue, newValue, newValueWeight) {
  if (typeof oldValue !== 'number') oldValue = 0.5;
  if (typeof newValue !== 'number') newValue = 0.5;
  if (typeof newValueWeight !== 'number') newValueWeight = 0.5;
  
  return (oldValue * (1 - newValueWeight)) + (newValue * newValueWeight);
}

// Helper functions for STELLA insights
function generateSTELLAImpression(profile) {
  const capacity = profile.baselineCapacity;
  if (capacity > 0.8) return "You show excellent cognitive capacity for space training!";
  if (capacity > 0.6) return "You demonstrate solid cognitive capacity for our training program.";
  return "You have the cognitive foundation we can build upon together.";
}

function identifyStrengthsFromProfile(profile) {
  const strengths = [];
  const fingerprint = profile.cognitiveFingerprint || {};
  
  if (fingerprint.visualProcessing > 0.75) strengths.push("Visual Learning");
  if (fingerprint.auditoryProcessing > 0.75) strengths.push("Auditory Processing");
  if (fingerprint.proceduralLearning > 0.75) strengths.push("Procedural Skill Acquisition");
  if (fingerprint.multiTaskingCapacity > 0.75) strengths.push("Multi-tasking");
  if (fingerprint.stressResponseFactor > 0.75) strengths.push("Stress Management");
  
  // Add a default if no clear strengths
  if (strengths.length === 0) strengths.push("Adaptability");
  
  return strengths;
}

function determineSuggestedFocus(profile) {
  const fingerprint = profile.cognitiveFingerprint || {};
  const weakest = Object.entries(fingerprint).sort(([,a], [,b]) => a - b)[0];
  
  switch(weakest[0]) {
    case 'visualProcessing': return "Visual processing exercises";
    case 'auditoryProcessing': return "Auditory processing training";
    case 'proceduralLearning': return "Step-by-step skill building";
    case 'multiTaskingCapacity': return "Multi-tasking enhancement";
    case 'stressResponseFactor': return "Stress management techniques";
    default: return "Balanced cognitive development";
  }
}

function generatePersonalizedMessage(profile) {
  const messages = [
    "I'm looking forward to guiding your space training journey!",
    "Together, we'll optimize your cognitive performance for space missions.",
    "Your unique cognitive profile will help us create the perfect training path for you.",
    "I'll be with you every step of the way to maximize your space readiness."
  ];
  
  return messages[Math.floor(Math.random() * messages.length)];
}

console.log("✅ Enhanced SharedStars Application model loaded successfully with Space Cognitive Load Balancer™");

const Application = mongoose.models.Application || mongoose.model('Application', ApplicationSchema);

module.exports = Application;