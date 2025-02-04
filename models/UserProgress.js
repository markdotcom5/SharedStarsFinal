// models/UserProgress.js
const mongoose = require('mongoose');

const UserProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleProgress: {
        currentModule: {
            type: String,
            required: true
        },
        completedModules: [{
            moduleId: String,
            completedAt: Date,
            performance: Number,
            difficulty: String
        }],
        activeModules: [{
            moduleId: String,
            progress: Number,
            lastAccessed: Date,
            difficulty: String
        }]
    },
    metrics: {
        totalTimeSpent: Number,
        averagePerformance: Number,
        consistencyScore: Number,
        engagementLevel: Number
    },
    achievements: [{
        achievementId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Achievement'
        },
        unlockedAt: Date,
        currentTier: String
    }],
    skillLevels: {
        technical: Number,
        theoretical: Number,
        practical: Number,
        problemSolving: Number
    },
    aiGuidance: {
        confidenceHistory: [{
            timestamp: Date,
            value: Number,
            context: String
        }],
        interventionEffectiveness: {
            type: Map,
            of: Number
        },
        learningStyle: {
            type: String,
            enum: ['VISUAL', 'AUDITORY', 'KINESTHETIC', 'READING_WRITING']
        }
    }
}, { timestamps: true });

module.exports = mongoose.model('UserProgress', UserProgressSchema);