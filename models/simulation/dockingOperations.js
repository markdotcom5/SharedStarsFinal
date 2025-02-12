const mongoose = require('mongoose');

const dockingOperationSchema = new mongoose.Schema({
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
    phase: { type: String, enum: ['initialApproach', 'orientationAdjustment', 'finalDocking'], default: 'initialApproach' },
    metrics: {
        approachVelocity: { type: Number, default: null },
        orientationDeviation: { type: Number, default: null },
        dockingAttempts: { type: Number, default: 0 }
    },
    errorLogs: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String }
        }
    ],
    conditions: {
        lighting: { type: String, enum: ['day', 'shadowed'], default: 'day' },
        thrusterInconsistencies: { type: Boolean, default: false }
    },
    challenges: [
        {
            description: { type: String },
            isResolved: { type: Boolean, default: false }
        }
    ],
    completed: { type: Boolean, default: false }
}, { timestamps: true });

const DockingOperation = mongoose.model('DockingOperation', dockingOperationSchema); // ✅ Now properly defined
module.exports = DockingOperation;
