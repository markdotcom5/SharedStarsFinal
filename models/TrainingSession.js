const mongoose = require("mongoose");
// Import the AIController 
const AIController = require("../controllers/AIController"); // Adjust the path as needed

const trainingSessionSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User", 
        required: true 
    },
    moduleType: { 
        type: String, 
        required: true 
    },
    moduleId: { 
        type: String, 
        required: true 
    },
    status: { 
        type: String, 
        enum: ["scheduled", "in-progress", "active", "paused", "completed", "abandoned"], 
        default: "in-progress" 
    },
    startTime: { 
        type: Date, 
        default: Date.now 
    },
    completedAt: { 
        type: Date 
    },
    progress: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    effectivenessScore: { 
        type: Number, 
        min: 0, 
        max: 100, 
        default: 0 
    },
    phase: {
        type: Number,
        default: 1
    },
    stellaSupport: {
        type: Boolean,
        default: true
    },
    aiGuidance: { 
        recommendations: [String], 
        liveAdjustments: [String] 
    },
    creditsEarned: { 
        type: Number, 
        default: 0 
    },
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
    // For SPA integration - track individual exercise metrics
    exerciseMetrics: [{
        exerciseId: String,
        startTime: Date,
        completedAt: Date,
        metrics: mongoose.Schema.Types.Mixed,
        formScore: Number,
        aiCorrections: [String]
    }],
    lastUpdated: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Pre-save middleware
trainingSessionSchema.pre("save", function(next) {
    this.lastUpdated = new Date();
    next();
});

// Model methods
trainingSessionSchema.methods.completeAssessment = async function(score) {
    if (!this.assessment) {
        this.assessment = {};
    }
    
    try {
        const aiAnalysis = await AIController.generateTrainingContent({
            module: this.moduleId
        });
        
        this.assessment.score = score;
        this.assessment.aiRecommendations = aiAnalysis.content || [];
        this.assessment.completedAt = new Date();
        await this.save();
        
        return {
            score,
            recommendations: aiAnalysis.content || []
        };
    } catch (error) {
        console.error("Error completing assessment:", error);
        this.assessment.score = score;
        this.assessment.completedAt = new Date();
        await this.save();
        
        return { score, recommendations: [] };
    }
};

// Method to update exercise metrics
trainingSessionSchema.methods.updateExerciseMetrics = async function(exerciseId, metrics) {
    // Find existing exercise metrics or create new entry
    let exerciseMetric = this.exerciseMetrics?.find(m => m.exerciseId === exerciseId);
    
    if (!exerciseMetric) {
        if (!this.exerciseMetrics) {
            this.exerciseMetrics = [];
        }
        
        exerciseMetric = {
            exerciseId,
            startTime: new Date(),
            metrics: {}
        };
        
        this.exerciseMetrics.push(exerciseMetric);
    }
    
    // Update metrics
    exerciseMetric.metrics = { ...exerciseMetric.metrics, ...metrics };
    
    // Calculate form score if available
    if (metrics.formScore) {
        exerciseMetric.formScore = metrics.formScore;
    } else if (metrics.coreEngagement || metrics.balance || metrics.stability || metrics.posture) {
        // Calculate average form score from core metrics
        const values = [];
        if (metrics.coreEngagement) values.push(metrics.coreEngagement);
        if (metrics.balance) values.push(metrics.balance);
        if (metrics.stability) values.push(metrics.stability);
        if (metrics.posture) values.push(metrics.posture);
        
        if (values.length > 0) {
            exerciseMetric.formScore = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
        }
    }
    
    // Save changes
    await this.save();
    
    return exerciseMetric;
};

// Method to complete an exercise
trainingSessionSchema.methods.completeExercise = async function(exerciseId) {
    // Find exercise metric
    const exerciseMetric = this.exerciseMetrics?.find(m => m.exerciseId === exerciseId);
    
    if (exerciseMetric) {
        exerciseMetric.completedAt = new Date();
        
        // Get AI corrections if available
        try {
            const aiResponse = await AIController.generateAIResponse({
                context: "exercise_feedback",
                metrics: exerciseMetric.metrics,
                exerciseId,
                moduleId: this.moduleId
            });
            
            if (aiResponse && aiResponse.corrections) {
                exerciseMetric.aiCorrections = aiResponse.corrections;
            }
        } catch (error) {
            console.error("Error getting AI corrections:", error);
        }
        
        // Save changes
        await this.save();
    }
    
    return exerciseMetric;
};

// Helper function
function calculatePhase(completedSessions) {
    return completedSessions < 10 ? 'Foundation' : 'Advanced';
}

// Function to create and save a training session
async function saveTrainingSession(userId, intensity, duration, streakMultiplier, aiAnalysis, userProgress, physicalModule) {
    const trainingSession = new TrainingSession({
        userId: userId,
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

// Define the model AFTER defining the schema but BEFORE using methods on it
const TrainingSession = mongoose.models.TrainingSession || mongoose.model("TrainingSession", trainingSessionSchema);

console.log("✅ TrainingSession model loaded successfully");

// Export both the model and the helper function
module.exports = {
    TrainingSession,
    saveTrainingSession
};