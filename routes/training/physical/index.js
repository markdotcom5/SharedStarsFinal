// routes/training/physical/index.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const UserProgress = require('../../../models/UserProgress');
const { TrainingSession } = require('../../../models/TrainingSession');
const Module = require('../../../models/Module');
const { authenticate } = require('../../../middleware/authenticate');
const phaseFeatures = require('../../../config/phaseFeatures');

// Import your existing services
const AIGuidanceSystem = require('../../../services/AIGuidanceSystem');
const BayesianTracker = require('../../../services/BayesianTracker');
const { ProgressTracker } = require('../../../services/TrainingLearningSystem');
const RealTimeMonitoring = require('../../../services/RealTimeMonitoring');

// Import mission1 and mission2 routes for backward compatibility
const mission1Routes = require('./mission1');
const mission2Routes = require('./mission2');

// Import physical training service functions
const {
  getPhysicalTrainingProgress,
  getAvailableMissions,
  getLeaderboardRank,
  getMissionDetails,
  checkMissionAccess,
  getMissionProgress,
  getSTELLARecommendations,
  createTrainingSession,
  calculateAIDifficulty,
  validateSession,
  updateMissionProgress,
  getSTELLAFeedback,
  completeMission,
  checkUnlockedContent,
  calculateCredits,
  updateLeaderboard,
  getSTELLAAnalysis,
  getReadinessAssessment,
  getSTELLAReadinessRecommendations,
  saveReadinessAssessment,
  analyzeReadiness,
  adjustTrainingDifficulty
} = require('../../../services/physicalTrainingService');

// Serve Physical Training Module Page - Main Overview
router.get('/', (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'index.html'));
    } catch (error) {
        console.error("❌ Error loading Physical Training Module:", error);
        res.status(500).send("Failed to load training module");
    }
});

// API endpoint to serve mission data as JSON
router.get('/missions-data', (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), 'public', 'js', 'training', 'physical', 'mission-data.json'));
    } catch (error) {
        console.error("❌ Error loading Mission Data:", error);
        res.status(500).json({ success: false, error: 'Failed to load mission data' });
    }
});

// For backward compatibility - Serve old mission HTML files directly
// These can be phased out as you fully transition to the SPA model
router.get('/mission/1', authenticate, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission1-core-balance.html'));
});

router.get('/mission/2', authenticate, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission2-endurance.html'));
});

router.get('/mission/3', authenticate, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission3-strength-training.html'));
});

router.get('/mission/4', authenticate, (req, res) => {
    res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission4-flexibility-training.html'));
});

// Get all available training modules for current phase
router.get('/modules', async (req, res) => {
    console.log("🚀 PHYSICAL MODULES ROUTE HIT!");
    res.json({ success: true, message: "Physical training modules loaded!" });
});

/**
 * GET /api/training/physical
 * Returns overall physical training progress and available missions
 */
router.get('/authenticate', authenticate, async (req, res) => {
    try {
        const userId = req.session.user?.id || req.user?._id;
        const progress = await getPhysicalTrainingProgress(userId);
        const missions = await getAvailableMissions(userId, 'physical');
        const leaderboardRank = await getLeaderboardRank(userId, 'physical');

        res.json({ success: true, progress, missions, leaderboardRank });
    } catch (error) {
        console.error('Error fetching physical training data:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/training/physical/mission/:missionId
 * Returns details for a specific mission
 */
router.get('/mission/:missionId/details', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const userId = req.user?._id || req.session.user?.id;

        const hasAccess = await checkMissionAccess(userId, missionId);
        if (!hasAccess) return res.status(403).json({ success: false, error: 'Mission not available yet' });

        const mission = await getMissionDetails(missionId);
        const progress = await getMissionProgress(userId, missionId);
        const aiRecommendations = await getSTELLARecommendations(userId, missionId);

        res.json({ success: true, mission, progress, aiRecommendations });
    } catch (error) {
        console.error(`Error fetching mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Start a new training session
router.post('/mission/:missionId/start', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const userId = req.user?._id || req.session.user?.id;
        const userProgress = await UserProgress.findOne({ userId });
        const currentPhase = calculatePhase(userProgress?.completedSessions || 0);

        // Create session with STELLA integration
        const session = new TrainingSession({
            userId,
            moduleId: missionId,
            moduleType: 'physical',
            phase: currentPhase,
            stellaSupport: phaseFeatures[`phase${currentPhase}`]?.stellaSupport || true,
            status: 'in-progress'
        });

        await session.save();

        // Start real-time monitoring
        RealTimeMonitoring.startMonitoring(session._id, {
            userId,
            phase: currentPhase,
            moduleId: missionId
        });

        const difficulty = await calculateAIDifficulty(userId, missionId);

        res.json({ 
            success: true, 
            sessionId: session._id,
            difficulty, 
            startTime: new Date() 
        });
    } catch (error) {
        console.error(`Error starting mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update session progress
router.post('/mission/:missionId/progress', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { sessionId, progress } = req.body;
        const userId = req.user?._id || req.session.user?.id;

        const validSession = await validateSession(userId, sessionId, missionId);
        if (!validSession) return res.status(400).json({ success: false, error: 'Invalid session' });

        // Update progress in the database
        await updateMissionProgress(userId, missionId, sessionId, progress);
        
        res.json({
            success: true,
            updatedProgress: progress
        });
    } catch (error) {
        console.error(`Error updating progress for mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API endpoint for real-time metrics
router.post('/mission/:missionId/metrics', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { sessionId, exerciseId, metrics } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Validate session
        const session = await TrainingSession.findById(sessionId);
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, error: 'Invalid session' });
        }
        
        // Update session with metrics
        if (!session.metrics) session.metrics = {};
        session.metrics[exerciseId] = metrics;
        await session.save();
        
        // Process metrics with STELLA
        const feedback = await getSTELLAFeedback(userId, missionId, metrics);
        
        res.json({
            success: true,
            feedback
        });
    } catch (error) {
        console.error(`Error processing metrics for mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Award credits for completing exercises
router.post('/mission/:missionId/credits', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { sessionId, exerciseId, amount = 25 } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Validate session
        const session = await TrainingSession.findById(sessionId);
        if (!session || session.userId.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, error: 'Invalid session' });
        }
        
        // Find user progress
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(404).json({ success: false, error: 'User progress not found' });
        }
        
        // Find or create module progress
        let moduleProgress = userProgress.moduleProgress.find(m => m.moduleId === missionId);
        if (!moduleProgress) {
            userProgress.moduleProgress.push({
                moduleId: missionId,
                completedSessions: 0,
                totalCreditsEarned: 0
            });
            moduleProgress = userProgress.moduleProgress[userProgress.moduleProgress.length - 1];
        }
        
        // Update credits
        moduleProgress.totalCreditsEarned += amount;
        userProgress.credits.total += amount;
        userProgress.credits.breakdown.performance += amount;
        
        // Save changes
        await userProgress.save();
        
        // Update session
        session.creditsEarned = (session.creditsEarned || 0) + amount;
        await session.save();
        
        res.json({
            success: true,
            creditsEarned: amount,
            totalCredits: userProgress.credits.total
        });
    } catch (error) {
        console.error(`Error awarding credits for mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Complete mission
router.post('/mission/:missionId/complete', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { sessionId, performanceData } = req.body;
        const userId = req.user?._id || req.session.user?.id;

        const validSession = await validateSession(userId, sessionId, missionId);
        if (!validSession) return res.status(400).json({ success: false, error: 'Invalid session' });

        const session = await TrainingSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        // Get final analysis from STELLA
        const finalAnalysis = await AIGuidanceSystem.generateMissionSimulation(userId);
        
        // Update session status
        session.status = 'completed';
        session.completedAt = new Date();
        session.finalAnalysis = finalAnalysis;
        await session.save();

        // Stop real-time monitoring
        RealTimeMonitoring.stopMonitoring(session._id);

        // Update user progress
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(404).json({ success: false, error: 'User progress not found' });
        }
        
        // Find module progress
        const moduleProgress = userProgress.moduleProgress.find(m => m.moduleId === missionId);
        if (moduleProgress) {
            moduleProgress.completedSessions += 1;
            moduleProgress.lastSessionDate = new Date();
            
            // Update streak
            const lastDate = moduleProgress.lastSessionDate;
            const now = new Date();
            const daysSinceLastSession = lastDate ? Math.floor((now - lastDate) / (1000 * 60 * 60 * 24)) : null;
            
            if (daysSinceLastSession === 1) {
                moduleProgress.streak += 1;
            } else if (daysSinceLastSession > 1) {
                moduleProgress.streak = 1;
            } else if (daysSinceLastSession === null) {
                moduleProgress.streak = 1;
            }
        }
        
        await userProgress.save();

        const result = await completeMission(userId, missionId, sessionId, performanceData);
        const unlockedContent = await checkUnlockedContent(userId);
        const creditsEarned = await calculateCredits(userId, missionId, performanceData);
        await updateLeaderboard(userId, missionId, performanceData);
        const aiAnalysis = await getSTELLAAnalysis(userId, missionId, performanceData);

        res.json({
            success: true,
            completion: result,
            unlockedContent,
            creditsEarned,
            analysis: finalAnalysis,
            aiAnalysis,
            newPhase: calculatePhase(userProgress.completedSessions)
        });
    } catch (error) {
        console.error(`Error completing mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get leaderboard
router.get('/mission/:missionId/leaderboard', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const userId = req.user?._id || req.session.user?.id;
        
        // Mock leaderboard data (replace with actual DB query)
        const leaderboard = [
            { username: 'AstroTrainer', points: 1250, isCurrentUser: false },
            { username: 'SpaceCommander', points: 1120, isCurrentUser: false },
            { username: 'StarFit', points: 980, isCurrentUser: false },
            { username: 'GravityHero', points: 920, isCurrentUser: true },
            { username: 'MoonRunner', points: 850, isCurrentUser: false }
        ];
        
        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error(`Error fetching leaderboard for mission ${req.params.missionId}:`, error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Get phase-specific challenges
router.get('/challenges', authenticate, async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userId: req.user?._id });
        const currentPhase = calculatePhase(userProgress?.completedSessions || 0);
        
        // Get phase challenges
        const challenges = phaseFeatures[`phase${currentPhase}`]?.challenges || [];
        
        // Get STELLA's recommendations for challenges
        const stellaRecommendations = await AIGuidanceSystem.generateSpaceScenario(req.user._id);

        res.json({
            success: true,
            phase: currentPhase,
            challenges,
            recommendations: stellaRecommendations
        });
    } catch (error) {
        console.error('Error fetching challenges:', error);
        res.status(500).json({ error: error.message });
    }
});

// Keep routes for compatibility during transition
router.use('/mission/1', mission1Routes);
router.use('/mission/2', mission2Routes);

// Helper functions
function calculatePhase(completedSessions) {
    if (completedSessions >= 48) return 5;
    if (completedSessions >= 36) return 4;
    if (completedSessions >= 24) return 3;
    if (completedSessions >= 12) return 2;
    return 1;
}

module.exports = router;