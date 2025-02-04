// models/studyGroup.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
    modules: [{
        type: Schema.Types.ObjectId,
        ref: 'Module'
    }],
    achievements: [{
        type: Schema.Types.ObjectId,
        ref: 'Achievement'
    }],
    certifications: [{
        type: Schema.Types.ObjectId,
        ref: 'Certification'
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
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('StudyGroup', studyGroupSchema);