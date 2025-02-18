const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const AIAssistant = require('../services/aiAssistant');
const AIController = require('../controllers/AIController');

const trainingSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        moduleType: {
            type: String,
            required: true,
            enum: [
                'training',
                'assessment',
                'physical',
                'mental',
                'technical',
                'simulation',
                'certification',
            ],
        },
        moduleId: {
            type: String,
            required: true,
        },
        dateTime: {
            type: Date,
            required: true,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
            default: 'in-progress',
        },
        adaptiveAI: {
            enabled: { type: Boolean, default: true },
            skillFactors: {
                physical: Number,
                technical: Number,
                mental: Number,
            },
            lastAdjustment: { type: Date, default: Date.now },
        },
        metrics: {
            completionRate: { type: Number, min: 0, max: 100, default: 0 },
            effectivenessScore: { type: Number, min: 0, max: 100, default: 0 },
            overallRank: { type: Number, default: 999999 },
        },
        aiGuidance: {
            recommendations: [String],
            liveAdaptations: [String],
        },
        assessment: {
            score: { type: Number },
            aiRecommendations: [String],
            completedAt: { type: Date },
        },
        achievements: [
            {
                name: String,
                description: String,
                earnedAt: { type: Date, default: Date.now },
            },
        ],
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Pre-save middleware
trainingSessionSchema.pre('save', function (next) {
    this.lastUpdated = new Date();
    next();
});

// Model methods
trainingSessionSchema.methods.completeAssessment = async function (score) {
    if (!this.assessment) {
        throw new Error('No active assessment found');
    }

    const aiAnalysis = await AIController.generateTrainingContent({
        module: this.moduleId,
    });

    this.assessment.score = score;
    this.assessment.aiRecommendations = aiAnalysis.content;
    this.assessment.completedAt = new Date();
    await this.save();

    return {
        score,
        recommendations: aiAnalysis.content,
    };
};

// ✅ Restore missing function to create and save a training session
async function saveTrainingSession(
    userId,
    intensity,
    duration,
    streakMultiplier,
    aiAnalysis,
    userProgress,
    physicalModule
) {
    const trainingSession = new mongoose.model('TrainingSession', trainingSessionSchema)({
        userId: userId,
        moduleType: 'physical',
        moduleId: 'core-phys-001',
        adaptiveAI: {
            enabled: true,
            skillFactors: {
                physical: intensity,
                technical:
                    calculatePhase(physicalModule.completedSessions) === 'Foundation' ? 1 : 2,
                mental: physicalModule.streak > 7 ? 2 : 1,
            },
        },
        metrics: {
            completionRate: 100,
            effectivenessScore: intensity * (duration / 30) * streakMultiplier,
            overallRank: userProgress.credits.total,
        },
        aiGuidance: {
            recommendations: aiAnalysis?.recommendations || [],
            liveAdaptations: [],
        },
    });

    try {
        await trainingSession.save();
        return trainingSession;
    } catch (error) {
        console.error('Error saving training session:', error);
        throw new Error('Error saving training session');
    }
}

// ✅ Ensure the model is properly defined in Mongoose
module.exports = mongoose.models.TrainingSession
    ? mongoose.models.TrainingSession
    : mongoose.model('TrainingSession', trainingSessionSchema);

module.exports.saveTrainingSession = saveTrainingSession;
