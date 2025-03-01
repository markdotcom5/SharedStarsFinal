const express = require("express");
const rateLimit = require("express-rate-limit");
const Joi = require("joi");
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");

const Module = require("../models/Module.js");
const UserProgress = require("../models/UserProgress.js");
const TrainingSession = require("../models/TrainingSession.js");
const SpaceTimelineManager = require("../services/SpaceTimelineManager.js");
const webSocketService = require("../services/webSocketService.js");
const ModuleCreditSystem = require("../services/ModuleCreditSystem.js");
const { authenticate, requireRole, authenticateWebSocket, setupWebSocketServer } = require("../middleware/authenticate.js");

// ✅ Import Training Modules
const physicalRoutes = require('./training/physical');
const evaRoutes = require("./eva/index.js");
const simulationRoutes = require("./simulation/index.js");
const technicalRoutes = require("./technical/index.js");
const router = express.Router();
const STELLA_AI = require('../services/STELLA_AI');
const User = require('../models/User');
const TrainingModule = require('../models/trainingModule');  // Lowercase filename
const PhysicalTrainingService = require("../services/physicalTrainingService");


// ✅ Attach Training Module Routes
router.use("/physical", physicalRoutes);
router.use("/simulation", simulationRoutes);
router.use("/modules/physical", authenticate, physicalRoutes);
router.use("/modules/eva", authenticate, evaRoutes);
router.use("/modules/technical", authenticate, technicalRoutes);

// ✅ Rate Limiting (Prevent API Abuse)
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later." }
});

router.get("/modules/physical", authenticate, async (req, res) => {
    try {
        const userProgress = await PhysicalTrainingService.getPhysicalTrainingProgress(req.user.id);
        res.render("training/modules/physical/index", {
            title: "Physical Training",
            progress: userProgress?.progress || 0,
            modules: userProgress?.modules || []
        });
    } catch (error) {
        console.error("❌ Error loading physical training module:", error);
        res.status(500).json({ success: false, error: "Failed to load physical training module." });
    }
});

/**
 * ✅ GET: Fetch Technical Training Modules
 */
router.get("/modules/technical", async (req, res) => {
    try {
        console.log("📚 Fetching technical training modules...");
        const technicalModules = await Module.find({ category: "technical" });

        if (!technicalModules.length) {
            return res.status(404).json({ success: false, error: "No technical modules found." });
        }

        res.json({ success: true, modules: technicalModules });
    } catch (error) {
        console.error("❌ Error fetching technical modules:", error);
        res.status(500).json({ success: false, error: "Failed to fetch technical modules." });
    }
});

/**
 * ✅ GET: Fetch AI-Guided Modules
 */
router.get("/modules/ai-guided", async (req, res) => {
    try {
        console.log("📚 Fetching AI-guided training modules...");
        const aiGuidedModules = await Module.find({ category: "ai-guided" });

        if (!aiGuidedModules.length) {
            return res.status(404).json({ success: false, error: "No AI-guided modules found." });
        }

        res.json({ success: true, modules: aiGuidedModules });
    } catch (error) {
        console.error("❌ Error fetching AI-guided modules:", error);
        res.status(500).json({ success: false, error: "Failed to fetch AI-guided modules." });
    }
});

/**
 * ✅ GET: Fetch Academy Page Data
 */
router.get("/academy", async (req, res) => {
    try {
        console.log("🚀 Loading Academy Page...");

        const modules = await Module.find()
            .select("name description category")
            .sort({ category: 1, name: 1 });

        res.render("academy", { 
            title: "SharedStars Academy",
            user: req.user,
            modules,
            trainingPhases: [
                { title: "Home-Based AI Training", description: "Personalized assessments and foundational learning", icon: "brain" },
                { title: "AR/VR Simulations", description: "AI-enhanced astronaut training simulations", icon: "vr-cardboard" },
                { title: "Team Training", description: "Group exercises and mission planning", icon: "users" },
                { title: "HQ Training", description: "Hands-on astronaut readiness training", icon: "building" },
                { title: "Final Certification", description: "Mission evaluations and space certification", icon: "certificate" }
            ],
            subscriptionTiers: [
                { name: "Explorer", price: 49, features: ["Basic AI coaching", "Standard training modules", "Daily space briefings"], timeToSpace: 48 },
                { name: "Pioneer", price: 149, features: ["Advanced AI coaching", "Priority training slots", "Enhanced space briefings"], timeToSpace: 36 },
                { name: "Elite", price: 499, features: ["24/7 AI coaching", "All training modules", "Exclusive briefings", "1-on-1 astronaut mentoring"], timeToSpace: 24 }
            ],
            spotsRemaining: 100 
        });
    } catch (error) {
        console.error("❌ Error loading Academy Page:", error);
        res.status(500).render("error", { message: "Error loading academy page", error });
    }
});

/**
 * ✅ GET: Debugging - Fetch All Sessions for a User
 */
router.get("/debug/sessions/:userId", async (req, res) => {
    try {
        console.log(`🚀 DEBUG: Fetching all sessions for user: ${req.params.userId}`);
        const userId = req.params.userId.match(/^[0-9a-fA-F]{24}$/) ? new ObjectId(req.params.userId) : req.params.userId;
        const sessions = await TrainingSession.find({ userId });

        console.log("🔍 Sessions Found:", sessions);
        res.json(sessions);
    } catch (error) {
        console.error("❌ ERROR Fetching Sessions:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
/**
 * ✅ POST: Start a training module
 */
router.post("/modules/:moduleId/start", authenticate, async (req, res) => {
    try {
        console.log(`🚀 Starting module: ${req.params.moduleId} for user: ${req.user.id}`);

        const { moduleId } = req.params;
        const { moduleType } = req.body;

        // Validate moduleId format
        const modulePattern = /^(physical|technical|simulation)-\d{3}$/;
        if (!modulePattern.test(moduleId)) {
            return res.status(400).json({
                success: false,
                error: "Invalid moduleId format",
                expectedFormat: "type-number (e.g., physical-001)",
                receivedId: moduleId
            });
        }

        const session = await TrainingSession.create({
            userId: req.user.id,
            moduleId,
            moduleType: moduleType || moduleId.split('-')[0],
            status: "in-progress",
            startedAt: new Date()
        });

        res.json({ success: true, message: `Module ${moduleId} started successfully`, session });
    } catch (error) {
        console.error("❌ Error starting module:", error);
        res.status(500).json({ success: false, error: "Failed to start module", details: error.message });
    }
});

/**
 * ✅ POST: Complete a module
 */
router.post("/modules/:moduleId/complete", authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { userId: req.user.id, moduleId: req.params.moduleId, status: "in-progress" },
            {
                $set: {
                    status: "completed",
                    completedAt: new Date(),
                    "metrics.completionRate": req.body.completionRate || 100,
                    "metrics.effectivenessScore": req.body.effectivenessScore || 100,
                    "metrics.consistency": req.body.consistency || 100
                }
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, error: "Active session not found" });
        }

        res.json({ success: true, message: "Module completed successfully", session });
    } catch (error) {
        console.error("❌ Error completing module:", error);
        res.status(500).json({ success: false, error: "Failed to complete module", details: error.message });
    }
});

/**
 * ✅ POST: Update training progress
 */
router.post("/update-progress", authenticate, async (req, res) => {
    try {
        const { userId, moduleId, missionId, performanceMetrics } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        // Initialize trainingProgress if missing
        if (!user.trainingProgress) user.trainingProgress = {};

        user.trainingProgress[missionId] = {
            status: "in_progress",
            score: performanceMetrics.score,
            feedback: ["Great endurance! Keep pushing."]
        };

        await user.save();

        res.json({ success: true, message: "Training progress updated successfully", trainingProgress: user.trainingProgress });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to update training progress", details: error.message });
    }
});

/**
 * ✅ POST: Certify User for Module Completion
 */
router.post("/certify", authenticate, async (req, res) => {
    try {
        const { userId, moduleId } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        if (!user.certifications) user.certifications = [];

        user.certifications.push({ name: `${moduleId} Certification`, issuedDate: new Date() });

        await user.save();

        res.json({ success: true, message: "Certification issued successfully", certifications: user.certifications });
    } catch (error) {
        res.status(500).json({ success: false, error: "Failed to issue certification", details: error.message });
    }
});

/**
 * ✅ POST: Unlock Next Mission
 */
router.post("/unlock-next-mission", authenticate, async (req, res) => {
    try {
        const { userId, currentMissionId } = req.body;
        const user = await User.findById(userId);

        if (!user || !user.trainingProgress[currentMissionId]) {
            return res.status(404).json({ success: false, error: "User or mission not found" });
        }

        const userPerformance = user.trainingProgress[currentMissionId].score;

        if (userPerformance >= 75) {
            user.unlockedMissions.push(currentMissionId + 1);
            await user.save();
            res.json({ success: true, message: "Next mission unlocked!" });
        } else {
            res.json({ success: false, message: "Keep training to improve performance!" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: "Error unlocking next mission", details: error.message });
    }
});

/**
 * ✅ PATCH: Complete Training Session
 */
router.patch("/sessions/:sessionId/complete", authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user.id },
            { $set: { status: "completed", progress: 100, completedAt: new Date() } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ success: false, error: "Session not found." });
        }

        res.json({ success: true, message: "Session completed successfully", session });
    } catch (error) {
        console.error("Error completing session:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
