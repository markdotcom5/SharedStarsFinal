const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const peerMatchSchema = new Schema({
    user1: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    preferences: {
        trainingLevel: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "expert"]
        },
        interests: [String],
        availability: [{
            day: String,
            timeSlots: [String]
        }],
        languages: [String],
        certificationGoals: [{
            type: Schema.Types.ObjectId,
            ref: "Certification"
        }],
        moduleInterests: [{
            type: Schema.Types.ObjectId,
            ref: "Module"
        }]
    },
    status: {
        type: String,
        enum: ["active", "paused", "inactive", "matched"], // ✅ Added "matched"
        default: "active"
    },
    
    matches: [{
        peer: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        compatibilityScore: Number,
        matchReason: [String],
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected"],
            default: "pending"
        },
        sessionHistory: [{
            date: Date,
            type: String,
            duration: Number,
            rating: Number
        }]
    }],
    aiAnalysis: {
        recommendedActivities: [String],
        learningStyle: String,
        collaborationSuggestions: [String],
        skillGaps: [String],
        strengthAreas: [String]
    },
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient peer matching
peerMatchSchema.index({ 
    "preferences.trainingLevel": 1,
    "preferences.interests": 1,
    "status": 1
});

module.exports = mongoose.model("PeerMatch", peerMatchSchema); // ✅ Corrected export
