// models/Trial.js
const mongoose = require('mongoose');

const trialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'converted', 'expired'],
        default: 'active'
    },
    initialAssessment: {
        motivation: String,
        experienceLevel: String,
        preferredPath: String,
        completedAt: Date
    },
    progress: {
        modulesStarted: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        }],
        modulesCompleted: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Module'
        }],
        lastActivity: Date
    }
}, { timestamps: true });

module.exports = mongoose.model('Trial', trialSchema);