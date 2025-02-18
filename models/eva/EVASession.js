// models/eva/EVASession.js
const mongoose = require('mongoose');

const EVASessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        sessionId: {
            type: String,
            required: true,
            unique: true,
        },
        status: {
            type: String,
            enum: ['preparing', 'in-progress', 'completed', 'failed'],
            default: 'preparing',
        },
        metrics: {
            oxygenLevel: Number,
            suitPressure: Number,
            heartRate: Number,
            taskCompletion: Number,
        },
        currentPhase: {
            type: String,
            enum: ['suit-check', 'airlock', 'external-ops', 'return'],
            default: 'suit-check',
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: Date,
        duration: Number,
        performance: {
            score: Number,
            feedback: [String],
            completedTasks: [String],
        },
    },
    { timestamps: true }
);

const EVASession = mongoose.model('EVASession', EVASessionSchema);

module.exports = EVASession;
