// routes/api/training-physical.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const path = require('path');
const { authenticate } = require('../../middleware/authenticate');
const UserProgress = require('../../models/UserProgress');
const { TrainingSession } = require('../../models/TrainingSession');
const AIGuidanceSystem = require('../../services/AIGuidanceSystem');
const PhysicalTrainingService = require('../../services/physicalTrainingService');
const STELLA_AI = require('../../services/STELLA_AI');

/**
 * GET /api/training/physical/missions-data
 * Serves the mission-data.json file for dynamic rendering
 */
router.get('/missions-data', (req, res) => {
    try {
        res.sendFile(path.join(process.cwd(), 'public', 'js', 'training', 'physical', 'mission-data.json'));
    } catch (error) {
        console.error("❌ Error loading Mission Data:", error);
        res.status(500).json({ success: false, error: 'Failed to load mission data' });
    }
});

/**
 * GET /api/training/physical/missions
 * Get all available missions with user progress
 */
router.get('/missions', authenticate, async (req, res) => {
    try {
        const userId = req.user?._id || req.session.user?.id;
        
        // Get user's physical training progress
        const progress = await PhysicalTrainingService.getPhysicalTrainingProgress(userId);
        
        // Read mission data
        const missionsFilePath = path.join(process.cwd(), 'public', 'js', 'training', 'physical', 'mission-data.json');
        const fs = require('fs');
        const missionsData = JSON.parse(fs.readFileSync(missionsFilePath, 'utf8'));
        
        // Merge progress with mission data
        const missions = missionsData.map(mission => {
            // Find mission progress if available
            const missionProgress = progress?.missions?.find(m => m.id === mission.id);
            return {
                ...mission,
                progress: missionProgress?.progress || 0,
                unlocked: missionProgress?.unlocked !== false // Default to true if not specified
            };
        });
        
        res.json({
            success: true,
            missions
        });
    } catch (error) {
        console.error('Error fetching missions:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/session/start
 * Start a new training session for a specific mission
 */
router.post('/session/start', authenticate, async (req, res) => {
    try {
        const { missionId } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Use PhysicalTrainingService to start session
        const session = await PhysicalTrainingService.startTrainingSession(userId, missionId);
        
        // Initialize STELLA AI for this session
        try {
            await STELLA_AI.initializeSession(userId, missionId, session.sessionId);
        } catch (error) {
            console.warn("STELLA AI initialization issue:", error);
            // Continue anyway - STELLA is optional
        }
        
        res.json({
            success: true,
            sessionId: session.sessionId || session._id
        });
    } catch (error) {
        console.error('Error starting session:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/mission/:missionId/start
 * Start a new training session for a specific mission (legacy endpoint)
 */
router.post('/mission/:missionId/start', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const userId = req.user?._id || req.session.user?.id;
        
        // Create new training session
        const session = new TrainingSession({
            userId,
            moduleType: 'physical',
            moduleId: missionId,
            status: 'active',
            startTime: new Date(),
            stellaSupport: true
        });
        
        await session.save();
        
        // Find or create user progress
        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            userProgress = new UserProgress({
                userId,
                physicalTraining: {
                    totalMissions: 10,
                    completedMissions: 0,
                    activeMission: missionId,
                    overallProgress: 0,
                    lastActivity: new Date()
                }
            });
            await userProgress.save();
        }
        
        res.json({
            success: true,
            sessionId: session._id
        });
    } catch (error) {
        console.error('Error starting mission:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Removed duplicate STELLA routes as they should be in stella.js

/**
 * POST /api/training/physical/progress/update
 * Update training progress and get STELLA recommendations
 */
router.post('/progress/update', authenticate, async (req, res) => {
    try {
        const { sessionId, missionId, exerciseId, metrics } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Update progress via PhysicalTrainingService
        await PhysicalTrainingService.updateTrainingProgress(
            userId, missionId, sessionId, { exerciseId, metrics }
        );
        
        // Get STELLA recommendations using updated model
        let recommendations = [];
        try {
            // Update PhysicalTrainingService to use GPT-4.5 Plus if possible
            recommendations = await PhysicalTrainingService.getSTELLARecommendations(
                userId, missionId, "gpt-4.5-plus"  // Pass preferred model
            );
        } catch (error) {
            console.warn("Error getting STELLA recommendations:", error);
            // Provide default recommendations
            recommendations = [
                "Focus on maintaining proper form.",
                "Remember to breathe steadily throughout the exercise.",
                "Keep your core engaged for better stability."
            ];
        }
        
        res.json({
            success: true,
            recommendations,
            metricsReceived: true
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/mission/:missionId/metrics
 * Record metrics data for a specific mission and exercise
 */
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
        await session.updateExerciseMetrics(exerciseId, metrics);
        
        // Generate STELLA feedback
        let feedback = {
            message: "Good job! Keep pushing yourself.",
            corrections: []
        };
        
        // If STELLA AI service is available, get more detailed feedback using GPT-4.5 Plus
        try {
            const aiResponse = await AIGuidanceSystem.generateAIResponse({
                context: "exercise_feedback",
                metrics,
                exerciseId,
                missionId,
                preferredModel: "gpt-4.5-plus" // Use the preferred model
            });
            
            if (aiResponse) {
                feedback = aiResponse;
            }
        } catch (error) {
            console.error("Error generating AI feedback:", error);
            // Try fallback model if available
            try {
                const fallbackResponse = await AIGuidanceSystem.generateAIResponse({
                    context: "exercise_feedback",
                    metrics,
                    exerciseId,
                    missionId,
                    preferredModel: "gpt-4o" // Fallback model
                });
                
                if (fallbackResponse) {
                    feedback = fallbackResponse;
                    console.log("Successfully used fallback model for feedback");
                }
            } catch (fallbackError) {
                console.error("Fallback model also failed:", fallbackError);
            }
        }
        
        res.json({
            success: true,
            feedback
        });
    } catch (error) {
        console.error('Error recording metrics:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/credits/calculate
 * Calculate and award credits for exercise completion
 */
router.post('/credits/calculate', authenticate, async (req, res) => {
    try {
        const { sessionId, missionId, exerciseId, performanceData } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Calculate credits via PhysicalTrainingService
        const creditData = await PhysicalTrainingService.calculateCredits(
            userId, missionId, performanceData || { completion: true }
        );
        
        // Award credits to user account
        await UserProgress.updateOne(
            { userId },
            { 
                $inc: { 
                    'credits.total': creditData.totalEarned,
                    'credits.breakdown.performance': creditData.totalEarned
                }
            },
            { upsert: true }
        );
        
        // Get updated total credits
        const userProgress = await UserProgress.findOne({ userId });
        
        res.json({
            success: true,
            ...creditData,
            newBalance: userProgress?.credits?.total || creditData.totalEarned
        });
    } catch (error) {
        console.error('Error calculating credits:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/mission/:missionId/credits
 * Award credits for completing exercises (legacy endpoint)
 */
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
        
        // Update session credits
        session.creditsEarned = (session.creditsEarned || 0) + amount;
        await session.save();
        
        // Find or create user progress
        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            userProgress = new UserProgress({
                userId,
                credits: {
                    breakdown: {
                        performance: amount
                    },
                    total: amount
                }
            });
        } else {
            // Update credits
            userProgress.credits.breakdown.performance = (userProgress.credits.breakdown.performance || 0) + amount;
            userProgress.credits.total = (userProgress.credits.total || 0) + amount;
            
            // Find or create physical module progress
            let physicalModule = userProgress.moduleProgress.find(m => m.moduleId === 'physical');
            if (!physicalModule) {
                userProgress.moduleProgress.push({
                    moduleId: 'physical',
                    completedSessions: 0,
                    totalCreditsEarned: amount
                });
            } else {
                physicalModule.totalCreditsEarned = (physicalModule.totalCreditsEarned || 0) + amount;
            }
        }
        
        await userProgress.save();
        
        res.json({
            success: true,
            creditsEarned: amount,
            totalCredits: userProgress.credits.total
        });
    } catch (error) {
        console.error('Error awarding credits:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/training/physical/mission/:missionId/progress
 * Update mission progress
 */
router.post('/mission/:missionId/progress', authenticate, async (req, res) => {
    try {
        const { missionId } = req.params;
        const { progress } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Find user progress
        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(404).json({ success: false, error: 'User progress not found' });
        }
        
        // Update mission progress
        await userProgress.updateMissionProgress(missionId, progress);
        
        res.json({
            success: true,
            progress
        });
    } catch (error) {
        console.error('Error updating progress:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/training/physical/mission/:missionId/leaderboard
 * Get leaderboard for a specific mission
 */
router.get('/mission/:missionId/leaderboard', async (req, res) => {
    try {
        const { missionId } = req.params;
        const userId = req.user?._id || req.session.user?.id;
        
        // Mock leaderboard data (replace with actual DB query)
        const leaderboard = [
            { username: 'AstroTrainer', points: 1250, isCurrentUser: false },
            { username: 'SpaceCommander', points: 1120, isCurrentUser: false },
            { username: 'StarFit', points: 980, isCurrentUser: false },
            { username: 'GravityHero', points: 920, isCurrentUser: userId ? false : true },
            { username: 'MoonRunner', points: 850, isCurrentUser: false }
        ];
        
        res.json({
            success: true,
            leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * STELLA AI Integration Routes
 */

/**
 * POST /api/training/stella/connect
 * Initialize STELLA for a user session (redirects to main STELLA API)
 */
router.post('/stella/connect', authenticate, async (req, res) => {
    try {
        const { trainingType, metrics, adaptiveLearning } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Forward the request to the main STELLA routes
        // This avoids duplication and ensures consistent behavior
        const stellaResponse = await fetch(`${req.protocol}://${req.get('host')}/api/stella/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            body: JSON.stringify({
                userId,
                trainingType,
                metrics,
                adaptiveLearning
            })
        });
        
        if (!stellaResponse.ok) {
            throw new Error(`STELLA connect failed: ${stellaResponse.statusText}`);
        }
        
        const stellaData = await stellaResponse.json();
        res.json(stellaData);
    } catch (error) {
        console.error('Error connecting to STELLA:', error);
        
        // Fallback if the forward fails
        res.json({
            success: true,
            sessionId: `stella_${Date.now()}`
        });
    }
});

/**
 * POST /api/training/stella/guidance
 * Get real-time guidance from STELLA (redirects to main STELLA API)
 */
router.post('/stella/guidance', authenticate, async (req, res) => {
    try {
        const { sessionId, exerciseId, metrics, question } = req.body;
        const userId = req.user?._id || req.session.user?.id;
        
        // Forward the request to the main STELLA routes
        const stellaResponse = await fetch(`${req.protocol}://${req.get('host')}/api/stella/guidance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            body: JSON.stringify({
                userId,
                sessionId,
                exerciseId,
                metrics,
                question
            })
        });
        
        if (!stellaResponse.ok) {
            throw new Error(`STELLA guidance failed: ${stellaResponse.statusText}`);
        }
        
        const stellaData = await stellaResponse.json();
        res.json(stellaData);
    } catch (error) {
        console.error('Error getting guidance:', error);
        
        // Provide a fallback response if the forward fails
        res.json({
            success: true,
            guidance: {
                message: "Focus on maintaining proper form throughout the exercise.",
                actionItems: [
                    "Keep your core engaged",
                    "Breathe steadily",
                    "Move with control"
                ]
            }
        });
    }
});

module.exports = router;