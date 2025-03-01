const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

const DockingOperationSchema = new mongoose.Schema({
    traineeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'TrainingSession', required: true },
    phase: { type: String, enum: ['initialApproach', 'orientationAdjustment', 'finalDocking'], default: 'initialApproach' },
    metrics: {
        approachVelocity: { type: Number, default: null },
        orientationDeviation: { type: Number, default: null },
        dockingAttempts: { type: Number, default: 0 },
        successfulDocking: { type: Boolean, default: false },
        timeTaken: { type: Number, default: null }, // Time in seconds
        accuracyScore: { type: Number, default: null }, // AI performance tracking
        efficiencyScore: { type: Number, default: null } // Efficiency in docking
    },
    errorLogs: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String },
            severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
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
            difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
        }
    ],
    feedback: [
        {
            timestamp: { type: Date, default: Date.now },
            message: { type: String },
            aiGenerated: { type: Boolean, default: true },
            impactScore: { type: Number, default: null } // AI feedback impact on trainee improvement
        }
    ],
    completed: { type: Boolean, default: false },
    completionTime: { type: Date, default: null },
    overallPerformance: { type: Number, default: null } // AI-generated overall performance metric
}, { timestamps: true });

const DockingOperation = mongoose.model('DockingOperation', DockingOperationSchema);

// ✅ Express Router for Docking Operation API
router.get('/:id', async (req, res) => {
    try {
        const dockingOperation = await DockingOperation.findById(req.params.id);
        if (!dockingOperation) {
            return res.status(404).json({ error: "Docking Operation not found" });
        }
        res.json(dockingOperation);
    } catch (error) {
        console.error("❌ Error fetching Docking Operation:", error);
        res.status(500).json({ error: "Failed to fetch docking operation" });
    }
});

// ✅ Create New Docking Operation
router.post('/', async (req, res) => {
    try {
        const dockingOperation = new DockingOperation(req.body);
        await dockingOperation.save();
        res.status(201).json(dockingOperation);
    } catch (error) {
        console.error("❌ Error creating Docking Operation:", error);
        res.status(500).json({ error: "Failed to create docking operation" });
    }
});

// ✅ Update Docking Operation Metrics
router.put('/:id', async (req, res) => {
    try {
        const dockingOperation = await DockingOperation.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!dockingOperation) {
            return res.status(404).json({ error: "Docking Operation not found" });
        }
        res.json(dockingOperation);
    } catch (error) {
        console.error("❌ Error updating Docking Operation:", error);
        res.status(500).json({ error: "Failed to update docking operation" });
    }
});

// ✅ Delete Docking Operation
router.delete('/:id', async (req, res) => {
    try {
        const result = await DockingOperation.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({ error: "Docking Operation not found" });
        }
        res.json({ message: "Docking Operation deleted successfully" });
    } catch (error) {
        console.error("❌ Error deleting Docking Operation:", error);
        res.status(500).json({ error: "Failed to delete docking operation" });
    }
});

// ✅ Exporting Router & Model
module.exports = {
    router,
    DockingOperation
};
