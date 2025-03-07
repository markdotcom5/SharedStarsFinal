const mongoose = require("mongoose");
const AIController = require("../controllers/AIController"); // Adjust path if necessary

// ✅ TrainingSession Schema Definition
const trainingSessionSchema = new mongoose.Schema({
    userId: { 
        type: String, 
        required: true 
    },
    moduleType: { type: String, required: true },
    moduleId: { type: String, required: true },
    status: { 
        type: String, 
        enum: ["scheduled", "in-progress", "active", "paused", "completed", "abandoned"], 
        default: "in-progress" 
    },
    startTime: { type: Date, default: Date.now },
    completedAt: Date,
    progress: { type: Number, min: 0, max: 100, default: 0 },
    effectivenessScore: { type: Number, min: 0, max: 100, default: 0 },
    phase: { type: Number, default: 1 },
    stellaSupport: { type: Boolean, default: true },
    aiGuidance: { 
        recommendations: [String], 
        liveAdjustments: [String] 
    },
    creditsEarned: { type: Number, default: 0 },
    assessment: {
        score: Number,
        aiRecommendations: [String],
        completedAt: Date
    },
    metrics: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    },
    stellaAnalysis: mongoose.Schema.Types.Mixed,
    finalAnalysis: mongoose.Schema.Types.Mixed,
    adaptiveAI: {
        enabled: { type: Boolean, default: true },
        skillFactors: {
            physical: { type: Number, default: 1 },
            technical: { type: Number, default: 1 },
            mental: { type: Number, default: 1 }
        }
    },
    exerciseMetrics: [{
        exerciseId: String,
        startTime: Date,
        completedAt: Date,
        metrics: mongoose.Schema.Types.Mixed,
        formScore: Number,
        aiCorrections: [String]
    }],
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

// ✅ Pre-save middleware to update timestamps
trainingSessionSchema.pre("save", function(next) {
    this.lastUpdated = new Date();
    next();
});

// ✅ Indexes for query performance
trainingSessionSchema.index({ userId: 1, status: 1 });
trainingSessionSchema.index({ moduleId: 1, moduleType: 1 });

// ✅ Method to complete assessments
trainingSessionSchema.methods.completeAssessment = async function(score) {
    if (!this.assessment) this.assessment = {};

    try {
        const aiAnalysis = await AIController.generateTrainingContent({ module: this.moduleId });

        this.assessment.score = score;
        this.assessment.aiRecommendations = aiAnalysis.content || [];
        this.assessment.completedAt = new Date();
        await this.save();

        return { score, recommendations: aiAnalysis.content || [] };
    } catch (error) {
        console.error("Error completing assessment:", error);
        this.assessment.score = score;
        this.assessment.completedAt = new Date();
        await this.save();

        return { score, recommendations: [] };
    }
};

// ✅ Method to update exercise metrics
trainingSessionSchema.methods.updateExerciseMetrics = async function(exerciseId, metrics) {
    let exerciseMetric = this.exerciseMetrics.find(m => m.exerciseId === exerciseId);

    if (!exerciseMetric) {
        exerciseMetric = {
            exerciseId,
            startTime: new Date(),
            metrics: {}
        };
        this.exerciseMetrics.push(exerciseMetric);
    }

    exerciseMetric.metrics = { ...exerciseMetric.metrics, ...metrics };

    if (metrics.formScore) {
        exerciseMetric.formScore = metrics.formScore;
    } else {
        const values = ['coreEngagement', 'balance', 'stability', 'posture']
            .filter(k => metrics[k] !== undefined)
            .map(k => metrics[k]);

        if (values.length > 0) {
            exerciseMetric.formScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
    }

    await this.save();
    return exerciseMetric;
};

// ✅ Method to complete an exercise
trainingSessionSchema.methods.completeExercise = async function(exerciseId) {
    const exerciseMetric = this.exerciseMetrics.find(m => m.exerciseId === exerciseId);
    if (!exerciseMetric) return null;

    exerciseMetric.completedAt = new Date();

    try {
        const aiResponse = await AIController.generateAIResponse({
            context: "exercise_feedback",
            metrics: exerciseMetric.metrics,
            exerciseId,
            moduleId: this.moduleId
        });

        if (aiResponse?.corrections) {
            exerciseMetric.aiCorrections = aiResponse.corrections;
        }
    } catch (error) {
        console.error("Error getting AI corrections:", error);
    }

    await this.save();
    return exerciseMetric;
};

// ✅ Helper function
function calculatePhase(completedSessions) {
    return completedSessions < 10 ? 'Foundation' : 'Advanced';
}

// ✅ Function to save a new training session
async function saveTrainingSession(userId, intensity, duration, streakMultiplier, aiAnalysis, userProgress, physicalModule) {
    const trainingSession = new TrainingSession({
        userId,
        moduleType: "physical",
        moduleId: "core-phys-001",
        adaptiveAI: {
            enabled: true,
            skillFactors: {
                physical: intensity,
                technical: calculatePhase(physicalModule.completedSessions) === 'Foundation' ? 1 : 2,
                mental: physicalModule.streak > 7 ? 2 : 1
            }
        },
        metrics: new Map([
            ["completionRate", 100],
            ["effectivenessScore", intensity * (duration / 30) * streakMultiplier],
            ["overallRank", userProgress.credits.total]
        ]),
        aiGuidance: {
            recommendations: aiAnalysis?.recommendations || [],
            liveAdjustments: []
        }
    });

    try {
        await trainingSession.save();
        return trainingSession;
    } catch (error) {
        console.error("Error saving training session:", error);
        throw new Error("Error saving training session");
    }
}

// ✅ Define model after schema methods
const TrainingSession = mongoose.models.TrainingSession || mongoose.model("TrainingSession", trainingSessionSchema);

console.log("✅ TrainingSession model loaded successfully");

// ✅ Export model & helper function
module.exports = {
    TrainingSession,
    saveTrainingSession
};
