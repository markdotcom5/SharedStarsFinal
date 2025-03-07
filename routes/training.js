const express = require("express");
const rateLimit = require("express-rate-limit");
const Module = require("../models/Module");
const TrainingSession = require("../models/TrainingSession");
const User = require('../models/User');
const { authenticate } = require("../middleware/authenticate");
const PhysicalTrainingService = require("../services/physicalTrainingService");

const router = express.Router();

// ✅ Importing Training Modules
const physicalRoutes = require('./training/physical');
const evaRoutes = require("./eva/index.js");
const simulationRoutes = require("./simulation/index.js");
const technicalRoutes = require("./technical/index.js");

// ✅ Rate Limiting (API abuse protection)
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "Too many requests, please try again later." }
});

// ✅ Attaching Module Routes
router.use("/modules/physical", authenticate, physicalRoutes);
router.use("/modules/eva", authenticate, evaRoutes);
router.use("/simulation", authenticate, simulationRoutes);
router.use("/modules/technical", authenticate, technicalRoutes);

// ✅ Get Physical Training Progress
router.get("/modules/physical", authenticate, async (req, res) => {
    try {
        const userProgress = await PhysicalTrainingService.getPhysicalTrainingProgress(req.user.id);
        res.json({
            success: true,
            progress: userProgress?.progress || 0,
            modules: userProgress?.modules || []
        });
    } catch (error) {
        console.error("❌ Error loading physical training module:", error);
        res.status(500).json({ success: false, error: "Failed to load physical training module." });
    }
});

// ✅ Fetch Technical Modules
router.get("/modules/technical", authenticate, async (req, res) => {
    try {
        const modules = await Module.find({ category: "technical" });
        res.json({ success: true, modules });
    } catch (error) {
        console.error("❌ Error fetching technical modules:", error);
        res.status(500).json({ success: false, error: "Failed to fetch technical modules." });
    }
});

// ✅ Fetch AI-Guided Modules
router.get("/modules/ai-guided", authenticate, async (req, res) => {
    try {
        const modules = await Module.find({ category: "ai-guided" });
        res.json({ success: true, modules });
    } catch (error) {
        console.error("❌ Error fetching AI-guided modules:", error);
        res.status(500).json({ success: false, error: "Failed to fetch AI-guided modules." });
    }
});

// ✅ Start a Training Module
router.post("/modules/:moduleId/start", authenticate, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const session = await TrainingSession.create({
            userId: req.user.id,
            moduleId,
            status: "in-progress",
            startedAt: new Date()
        });
        res.json({ success: true, session });
    } catch (error) {
        console.error("❌ Error starting module:", error);
        res.status(500).json({ success: false, error: "Failed to start module." });
    }
});

// ✅ Complete a Training Module
router.post("/modules/:moduleId/complete", authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { userId: req.user.id, moduleId: req.params.moduleId, status: "in-progress" },
            { $set: { status: "completed", completedAt: new Date() } },
            { new: true }
        );
        if (!session) return res.status(404).json({ success: false, error: "Active session not found." });
        res.json({ success: true, session });
    } catch (error) {
        console.error("❌ Error completing module:", error);
        res.status(500).json({ success: false, error: "Failed to complete module." });
    }
});

// ✅ Debugging: Fetch All Sessions
router.get("/debug/sessions/:userId", authenticate, async (req, res) => {
    try {
        const sessions = await TrainingSession.find({ userId: req.params.userId });
        res.json({ success: true, sessions });
    } catch (error) {
        console.error("❌ Error fetching sessions:", error);
        res.status(500).json({ success: false, error: "Internal server error." });
    }
});

module.exports = router;
