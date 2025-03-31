const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ✅ Training Log Schema
const TrainingLogSchema = new Schema({
   date: { type: Date, default: Date.now },
   exercisesCompleted: [String],
   duration: Number,
   caloriesBurned: Number
}); 

// ✅ Module Progress Schema - Enhanced for missions
const ModuleProgressSchema = new Schema({
   moduleId: { type: String, required: true },
   completedSessions: { type: Number, default: 0 },
   totalCreditsEarned: { type: Number, default: 0 },
   streak: { type: Number, default: 0 },
   lastSessionDate: { type: Date },
   trainingLogs: [TrainingLogSchema],

   // Track progress for each mission within the module
   missionProgress: {
      type: Map,
      of: Number,
      default: {}
   },

   // Store completed exercises for each mission
   completedExercises: [{
      missionId: String,
      exerciseId: String,
      completedAt: Date,
      performance: mongoose.Schema.Types.Mixed
   }],

   activeModules: [{
       moduleId: { type: String, required: true },
       progress: { type: Number, default: 0, min: 0, max: 100 },
       startDate: { type: Date, default: Date.now },
       lastAccessed: { type: Date, default: Date.now }
   }],

   completedModules: [{
       moduleId: { type: String, required: true },
       completionDate: Date,
       finalScore: Number
   }],

   sessions: [{
       sessionId: { type: String, required: true },
       completed: { type: Boolean, default: false },
       progress: { type: Number, default: 0, min: 0, max: 100 },
       attempts: { type: Number, default: 0 },
       bestScore: { type: Number, default: 0 },
       lastAttempt: Date
   }],

   milestones: [{
       name: { type: String, required: true },
       completed: { type: Boolean, default: false },
       dateAchieved: Date
   }]
});

// ✅ User Progress Schema
const UserProgressSchema = new mongoose.Schema({
    userId: {
      type: String,  // Change from ObjectId to String
      required: true
    },
    credits: {
        breakdown: {
            attendance: { type: Number, default: 0 },
            performance: { type: Number, default: 0 },
            milestones: { type: Number, default: 0 },
            assessments: { type: Number, default: 0 }
        },
        total: { type: Number, default: 0 }
    },
    completedSessions: { type: Number, default: 0 }, // Total completed across all modules
    moduleProgress: [{
        moduleId: { type: String, required: true },
        completedSessions: { type: Number, default: 0 },
        totalCreditsEarned: { type: Number, default: 0 },
        streak: { type: Number, default: 0 },
        lastSessionDate: { type: Date },
        // Track progress for each mission within the module
        missionProgress: {
            type: Map,
            of: Number,
            default: {}
        },
        // Store completed exercises for each mission
        completedExercises: [{
            missionId: String,
            exerciseId: String,
            completedAt: Date,
            performance: mongoose.Schema.Types.Mixed
        }],
        trainingLogs: [{
            date: { type: Date, default: Date.now },
            exercisesCompleted: [String],
            duration: Number,
            caloriesBurned: Number
        }]
    }],
    achievements: [{
        name: String,
        dateEarned: Date,
        description: String
    }],
    aiGuidance: {
        confidenceHistory: [{
            date: { type: Date, default: Date.now },
            score: { type: Number, default: 0 },
            feedback: { type: String, default: "Keep pushing forward!" }
        }]
    },
    certifications: [{
        name: String,
        dateEarned: Date,
        expiryDate: Date,
        status: { type: String, enum: ['active', 'expired', 'revoked'], default: 'active' }
    }],
    // For SPA integration - track overall progress through missions
    physicalTraining: {
        totalMissions: { type: Number, default: 10 },
        completedMissions: { type: Number, default: 0 },
        activeMission: { type: String, default: 'mission1' },
        overallProgress: { type: Number, default: 0 },
        lastActivity: { type: Date }
    }
}, { timestamps: true });

// ✅ Indexes for Performance
UserProgressSchema.index({ 'moduleProgress.moduleId': 1 });

// ✅ Virtual for Total Number of Completed Modules
UserProgressSchema.virtual('totalCompletedModules').get(function() {
   return this.moduleProgress.reduce((total, module) => total + module.completedModules.length, 0);
});

// ✅ Method to Update Credits
UserProgressSchema.methods.updateCredits = function() {
   const breakdown = this.credits.breakdown;
   this.credits.total = Object.values(breakdown).reduce((a, b) => a + b, 0);
   return this.save();
};

// ✅ Method to Add Training Log
UserProgressSchema.methods.addTrainingLog = async function(moduleId, logData) {
   const module = this.moduleProgress.find(m => m.moduleId === moduleId);
   if (!module) throw new Error('Module not found');

   module.trainingLogs.push(logData);
   module.lastSessionDate = new Date();
   module.completedSessions += 1;
   return this.save();
};
// models/UserProgress.js

UserProgressSchema.methods.calculateScore = function(performanceData) {
    const { completionTime, accuracy, interactions, challengesCompleted } = performanceData;

    const weights = {
        completionTime: 0.2,
        accuracy: 0.4,
        interactions: 0.2,
        challengesCompleted: 0.2
    };

    const normalizedTime = Math.min(1, 600 / Math.max(completionTime, 300));

    const score = 
        (normalizedTime * weights.completionTime) +
        (accuracy * weights.accuracy) +
        (Math.min(1, interactions / 10) * weights.interactions) +
        (Math.min(1, challengesCompleted / 5) * weights.challengesCompleted);

    return Math.round(score * 100) / 100;
};

UserProgressSchema.methods.checkAchievements = function(moduleId, score) {
    const newAchievements = [];

    if (score >= 0.9) {
        newAchievements.push({
            name: 'Excellence in Space Training',
            dateEarned: new Date(),
            description: 'Achieved 90% or higher in a training module'
        });
    }

    if (this.moduleProgress.filter(m => m.completedSessions > 0).length >= 5) {
        newAchievements.push({
            name: 'Dedicated Space Cadet',
            dateEarned: new Date(),
            description: 'Completed 5 training modules'
        });
    }

    this.achievements.push(...newAchievements);
    return newAchievements;
};

// ✅ New Method for SPA Mission Tracking
UserProgressSchema.methods.updateMissionProgress = async function(missionId, progress) {
    // Update overall physical training progress
    if (this.physicalTraining) {
        this.physicalTraining.lastActivity = new Date();
        
        // Find module progress for physical training
        const physicalModule = this.moduleProgress.find(m => m.moduleId === 'physical');
        if (physicalModule) {
            if (!physicalModule.missionProgress) {
                physicalModule.missionProgress = new Map();
            }
            
            // Update progress for this specific mission
            physicalModule.missionProgress.set(missionId, progress);
            
            // Calculate overall progress based on all missions
            const missionProgress = Array.from(physicalModule.missionProgress.values());
            const totalProgress = missionProgress.reduce((sum, p) => sum + p, 0);
            const overallProgress = Math.round(totalProgress / (missionProgress.length * 100) * 100);
            
            this.physicalTraining.overallProgress = overallProgress;
            
            // Check if mission is newly completed
            if (progress >= 100 && !this.physicalTraining.completedMissions.includes(missionId)) {
                this.physicalTraining.completedMissions += 1;
                
                // Update active mission to next one if available
                const missionNumber = parseInt(missionId.replace('mission', ''));
                if (missionNumber < this.physicalTraining.totalMissions) {
                    this.physicalTraining.activeMission = `mission${missionNumber + 1}`;
                }
            }
        }
    }
    
    return this.save();
};

// ✅ Method to Complete an Exercise
UserProgressSchema.methods.completeExercise = async function(missionId, exerciseId, performance) {
    // Find physical module
    const physicalModule = this.moduleProgress.find(m => m.moduleId === 'physical');
    if (!physicalModule) {
        // Create module if it doesn't exist
        this.moduleProgress.push({
            moduleId: 'physical',
            completedSessions: 0,
            totalCreditsEarned: 0,
            missionProgress: new Map(),
            completedExercises: []
        });
        physicalModule = this.moduleProgress[this.moduleProgress.length - 1];
    }
    
    // Add completed exercise
    physicalModule.completedExercises.push({
        missionId,
        exerciseId,
        completedAt: new Date(),
        performance
    });
    
    // Update mission progress based on completed exercises
    const missionExercises = physicalModule.completedExercises.filter(ex => ex.missionId === missionId);
    if (missionExercises.length > 0) {
        // You would need to get the total number of exercises for this mission
        // from your mission data to calculate accurate progress
        const totalExercises = 3; // Default placeholder, replace with actual count
        const progress = Math.min(100, Math.round((missionExercises.length / totalExercises) * 100));
        
        if (!physicalModule.missionProgress) {
            physicalModule.missionProgress = new Map();
        }
        physicalModule.missionProgress.set(missionId, progress);
    }
    
    return this.save();
};

// ✅ Static Method to Get User Progress Summary
UserProgressSchema.statics.getProgressSummary = async function(userId) {
   return this.findOne({ userId })
       .select('moduleProgress.moduleId moduleProgress.completedSessions physicalTraining credits')
       .lean();
};

// ✅ Method to Get Latest Session Data
UserProgressSchema.methods.getLatestSession = function(moduleId) {
   const module = this.moduleProgress.find(m => m.moduleId === moduleId);
   if (!module || !module.sessions.length) return null;
   return module.sessions[module.sessions.length - 1]; // Return the latest session
};

console.log("✅ UserProgress model loaded successfully");

// ✅ Prevent Duplicate Schema Compilation
const UserProgress = mongoose.models.UserProgress || mongoose.model("UserProgress", UserProgressSchema);

module.exports = UserProgress;