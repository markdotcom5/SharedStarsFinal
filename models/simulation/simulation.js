const mongoose = require('mongoose');

const simulationSchema = new mongoose.Schema(
    {
        sessionId: { type: String, required: true, unique: true, index: true }, // ✅ Keep unique for fast lookups
        simulationId: { type: String, required: true, index: true }, // ✅ Index for performance on queries
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true }, // ✅ Enforce relationship with User collection
        startTime: { type: Date, default: Date.now },
        status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
        progress: { type: Number, default: 0, min: 0, max: 100 }, // ✅ Restrict progress range between 0-100
        results: {
            completionPercentage: { type: Number, min: 0, max: 100 },
            successRate: { type: Number, min: 0, max: 100 },
            metrics: { type: mongoose.Schema.Types.Mixed, default: {} }, // ✅ Ensures non-null metrics object
        },
    },
    { timestamps: true }
); // ✅ Automatically adds `createdAt` & `updatedAt` fields

module.exports = mongoose.model('Simulation', simulationSchema);
