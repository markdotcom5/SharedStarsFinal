const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ✅ Training Log Schema
const TrainingLogSchema = new Schema({
    date: { type: Date, default: Date.now },
    exercisesCompleted: [String],
    duration: Number,
    caloriesBurned: Number,
});

// ✅ Module Progress Schema
const ModuleProgressSchema = new Schema({
    moduleId: { type: String, required: true },
    completedSessions: { type: Number, default: 0 },
    totalCreditsEarned: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    lastSessionDate: { type: Date },
    trainingLogs: [TrainingLogSchema],

    activeModules: [
        {
            moduleId: { type: String, required: true },
            progress: { type: Number, default: 0, min: 0, max: 100 },
            startDate: { type: Date, default: Date.now },
            lastAccessed: { type: Date, default: Date.now },
        },
    ],

    completedModules: [
        {
            moduleId: { type: String, required: true },
            completionDate: Date,
            finalScore: Number,
        },
    ],

    sessions: [
        {
            sessionId: { type: String, required: true },
            completed: { type: Boolean, default: false },
            progress: { type: Number, default: 0, min: 0, max: 100 },
            attempts: { type: Number, default: 0 },
            bestScore: { type: Number, default: 0 },
            lastAttempt: Date,
        },
    ],

    milestones: [
        {
            name: { type: String, required: true },
            completed: { type: Boolean, default: false },
            dateAchieved: Date,
        },
    ],
});

// ✅ User Progress Schema
const UserProgressSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

        credits: {
            breakdown: {
                attendance: { type: Number, default: 0 },
                performance: { type: Number, default: 0 },
                milestones: { type: Number, default: 0 },
                assessments: { type: Number, default: 0 },
            },
            total: { type: Number, default: 0 },
        },

        moduleProgress: [ModuleProgressSchema],

        achievements: [
            {
                name: String,
                dateEarned: Date,
                description: String,
            },
        ],

        aiGuidance: {
            confidenceHistory: [
                {
                    date: { type: Date, default: Date.now },
                    score: { type: Number, default: 0 },
                    feedback: { type: String, default: 'Keep pushing forward!' },
                },
            ],
        },

        assessments: [
            {
                moduleId: String,
                score: Number,
                date: Date,
                type: String,
            },
        ],

        certifications: [
            {
                name: String,
                dateEarned: Date,
                expiryDate: Date,
                status: {
                    type: String,
                    enum: ['active', 'expired', 'revoked'],
                    default: 'active',
                },
            },
        ],
    },
    { timestamps: true }
);

// ✅ Indexes for Performance
UserProgressSchema.index({ userId: 1 });
UserProgressSchema.index({ 'moduleProgress.moduleId': 1 });

// ✅ Virtual for Total Number of Completed Modules
UserProgressSchema.virtual('totalCompletedModules').get(function () {
    return this.moduleProgress.reduce((total, module) => total + module.completedModules.length, 0);
});

// ✅ Method to Update Credits
UserProgressSchema.methods.updateCredits = function () {
    const breakdown = this.credits.breakdown;
    this.credits.total = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return this.save();
};

// ✅ Method to Add Training Log
UserProgressSchema.methods.addTrainingLog = async function (moduleId, logData) {
    const module = this.moduleProgress.find((m) => m.moduleId === moduleId);
    if (!module) throw new Error('Module not found');

    module.trainingLogs.push(logData);
    module.lastSessionDate = new Date();
    module.completedSessions += 1;
    return this.save();
};

// ✅ Static Method to Get User Progress Summary
UserProgressSchema.statics.getProgressSummary = async function (userId) {
    return this.findOne({ userId })
        .select('moduleProgress.moduleId moduleProgress.completedSessions credits')
        .lean();
};

// ✅ Method to Get Latest Session Data
UserProgressSchema.methods.getLatestSession = function (moduleId) {
    const module = this.moduleProgress.find((m) => m.moduleId === moduleId);
    if (!module || !module.sessions.length) return null;
    return module.sessions[module.sessions.length - 1]; // Return the latest session
};

// ✅ Prevent Duplicate Schema Compilation
module.exports = mongoose.models.UserProgress || mongoose.model('UserProgress', UserProgressSchema);
