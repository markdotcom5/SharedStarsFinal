const mongoose = require('mongoose');
const { OpenAI } = require("openai");
const Schema = mongoose.Schema;

// ✅ OpenAI Configuration with Robust Error Handling
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    console.error('❌ OpenAI Initialization Error:', error.message);
}

// ✅ Define Schema explicitly first
const ModuleSchema = new mongoose.Schema({
    moduleId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String },
    category: { type: String },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    duration: { type: Number, required: true },
    exercises: [{ 
        name: { type: String, required: true },
        reps: { type: Number, default: 0 },
        sets: { type: Number, default: 0 },
        restTime: { type: Number, default: 30 }
    }],
    metrics: {
        caloriesBurned: { type: Number, default: 0 },
        averageHeartRate: { type: Number, default: 0 },
        effortScore: { type: Number, min: 0, max: 100, default: 50 },
        completionRate: { type: Number, min: 0, max: 100, default: 0 },
        averageScore: { type: Number, default: 0 }
    },
    progressTracking: {
        sessionsCompleted: { type: Number, default: 0 },
        lastCompleted: { type: Date },
        streak: { type: Number, default: 0 },
        mastery: { type: Number, min: 0, max: 100, default: 0 }
    },
    creditSystem: {
        totalCredits: { type: Number, default: 0 },
        creditDistribution: {
            bonusActivities: { type: Number, default: 0 }
        }
    },
    aiGuidance: {
        recommendations: [String],
        performanceFeedback: String,
        lastUpdated: { type: Date, default: Date.now }
    },
    prerequisites: [{ type: String }],
    status: { type: String, default: "active" }
}, { timestamps: true });

// ✅ Clearly add indexes here
ModuleSchema.index({ category: 1, difficulty: 1 });
ModuleSchema.index({ 'metrics.averageScore': -1 });
ModuleSchema.index({ status: 1 });
ModuleSchema.index({ moduleId: 1 }, { unique: true });

// ✅ Validation Middleware
ModuleSchema.pre('save', function(next) {
    if (this.prerequisites?.length > 5) {
        return next(new Error('Maximum of 5 prerequisites allowed'));
    }
    this.aiGuidance.lastUpdated = new Date();
    next();
});

// ✅ Virtual fields
ModuleSchema.virtual('isComplete').get(function() {
    return this.progressTracking?.mastery >= 100;
});

ModuleSchema.virtual('totalCreditsPossible').get(function() {
    return (this.creditSystem?.totalCredits || 0) +
           (this.creditSystem?.creditDistribution?.bonusActivities || 0);
});

// ✅ Export model explicitly at the end
module.exports = mongoose.model('Module', ModuleSchema);