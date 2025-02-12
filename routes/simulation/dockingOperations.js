const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const dockingOperationSchema = new Schema({
    traineeId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
    phase: { type: String, enum: ['initialApproach', 'orientationAdjustment', 'finalDocking'], default: 'initialApproach' },
    metrics: {
        approachVelocity: { type: Number, default: null },
        orientationDeviation: { type: Number, default: null },
        dockingAttempts: { type: Number, default: 0 },
        successfulDocking: { type: Boolean, default: false },
        timeTaken: { type: Number, default: null }, // Time in seconds
        accuracyScore: { type: Number, default: null }, // Added for AI performance tracking
        efficiencyScore: { type: Number, default: null } // Tracks efficiency in docking
    },
    errorLogs: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String },
            severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' } // Categorizing errors
        }
    ],
    conditions: {
        lighting: { type: String, enum: ['day', 'shadowed'], default: 'day' },
        thrusterInconsistencies: { type: Boolean, default: false },
        communicationDelays: { type: Boolean, default: false }
    },
    challenges: [
        {
            description: { type: String },
            isResolved: { type: Boolean, default: false },
            resolutionTime: { type: Number, default: null }, // Time taken to resolve in seconds
            difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' } // Added for progression tracking
        }
    ],
    feedback: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String },
            aiGenerated: { type: Boolean, default: true },
            impactScore: { type: Number, default: null } // Measures AI feedback impact on trainee improvement
        }
    ],
    completed: { type: Boolean, default: false },
    completionTime: { type: Date, default: null },
    overallPerformance: { type: Number, default: null } // AI-generated overall performance metric
}, {
    timestamps: true
});

const DockingOperation = mongoose.model('DockingOperation', dockingOperationSchema);
module.exports = DockingOperation;
