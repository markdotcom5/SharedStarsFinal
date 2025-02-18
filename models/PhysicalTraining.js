const mongoose = require('mongoose');

const physicalTrainingSchema = new mongoose.Schema(
    {
        moduleId: { type: String, required: true }, // ❌ Removed `unique: true`
        moduleName: { type: String, required: true },
        description: { type: String },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
        duration: { type: Number, required: true }, // Duration in minutes
        exercises: [
            {
                name: { type: String, required: true },
                reps: { type: Number, default: 0 },
                sets: { type: Number, default: 0 },
                restTime: { type: Number, default: 30 }, // Rest time in seconds
            },
        ],
        metrics: {
            caloriesBurned: { type: Number, default: 0 },
            averageHeartRate: { type: Number, default: 0 },
            effortScore: { type: Number, min: 0, max: 100, default: 50 }, // AI-driven effort estimation
            completionRate: { type: Number, min: 0, max: 100, default: 0 },
        },
        progressTracking: {
            sessionsCompleted: { type: Number, default: 0 },
            lastCompleted: { type: Date },
            streak: { type: Number, default: 0 },
        },
        aiGuidance: {
            recommendations: [String],
            performanceFeedback: String,
            lastUpdated: { type: Date, default: Date.now },
        },
    },
    { timestamps: true }
);

// Pre-save middleware to update AI guidance timestamp
physicalTrainingSchema.pre('save', function (next) {
    this.aiGuidance.lastUpdated = new Date();
    next();
});

const PhysicalTraining = mongoose.model('PhysicalTraining', physicalTrainingSchema);
module.exports = PhysicalTraining;
