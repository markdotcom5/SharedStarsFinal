const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// ✅ User Schema
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true },
    password: { type: String, required: true, minlength: 6 },
    achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
    trainingModules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
    trainingSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "TrainingSession" }],
    trainingProgress: {
        type: Map,
        of: { status: String, score: Number, feedback: [String] },
    },
    unlockedMissions: { type: [String], default: [] },
    aiGuidance: {
        mode: { type: String, enum: ["manual", "assist", "full_guidance"], default: "assist" },
        lastGuidance: { type: Date, default: Date.now },
        preferences: {
            theme: { type: String, enum: ["dark", "light"], default: "dark" },
            difficultyLevel: { type: String, enum: ["easy", "medium", "hard"] },
            notificationsEnabled: { type: Boolean, default: true },
        },
    },
    subscription: {
        type: { type: String, enum: ["individual", "family", "galactic", "custom"], default: "individual" },
        startDate: Date,
        endDate: Date,
        status: { type: String, enum: ["active", "inactive", "cancelled", "pending"], default: "pending" },
        customAmount: { type: Number, min: 50 },
    },
    leaderboard: {
        score: { type: Number, default: 0, index: true },
        rank: Number,
        history: [{
            date: { type: Date, default: Date.now },
            score: Number,
            breakdown: {
                sessionsScore: { type: Number, default: 0 },
                streakScore: { type: Number, default: 0 },
                exerciseVarietyScore: { type: Number, default: 0 },
                durationImprovementScore: { type: Number, default: 0 },
            },
        }],
        lastUpdated: { type: Date, default: Date.now },
    },
    credits: { type: Number, default: 0, min: 0 },
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
    location: {
        coordinates: { type: [Number], index: "2dsphere" },
        state: String,
        country: String,
    },
    badges: [{ name: String, acquired: Date, level: { type: String, enum: ["bronze", "silver", "gold", "platinum"] } }],
    certifications: [{ name: String, issuedDate: Date, expiryDate: Date, creditsEarned: Number }],
    roles: { type: [String], default: ["trainee"] },
    assessmentsCompleted: {
        physical: { type: Boolean, default: false },
        technical: { type: Boolean, default: false },
        psychological: { type: Boolean, default: false },
        // add others as needed
    }
}, { timestamps: true, versionKey: false });

// ✅ Indexes
UserSchema.index({ "leaderboard.score": -1, _id: 1 });
UserSchema.index({ "leaderboard.rank": 1 });

// ✅ Password hashing middleware
// UserSchema.pre("save", async function(next) {
//     if (this.isModified("password")) {
//         const salt = await bcrypt.genSalt(10);
//         this.password = await bcrypt.hash(this.password, salt);
//     }
//     next();
// });

// ✅ Export User Model
const User = mongoose.models.User || mongoose.model("User", UserSchema);
module.exports = User;