const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const rateLimit = require('express-rate-limit');
const AISpaceCoach = require('../services/AISpaceCoach');
const Joi = require('joi');
const Module = require('../models/Module');
const mongoose = require('mongoose');
const SpaceTimelineManager = require('../services/SpaceTimelineManager');
const webSocketService = require('../services/webSocketService');
const { ObjectId } = require('mongodb'); // Import ObjectId for correct usage
const TrainingSession = require('../models/TrainingSession'); // Adjust the path if needed
const ModuleCreditSystem = require('../services/ModuleCreditSystem');

// Initialize Services
const timelineManager = new SpaceTimelineManager(webSocketService);

// Rate Limiter Configuration
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
});

// Validation Schemas
const sessionSchema = Joi.object({
    sessionType: Joi.string().required(),
    dateTime: Joi.date().greater('now').required(),
    participants: Joi.array().items(Joi.string()),
    points: Joi.number().min(0).default(0),
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

// ============================
// Module Routes
// ============================

// Get All Modules
router.get('/modules', authenticate, async (req, res) => {
    try {
        const modules = await Module.find()
            .select('id name description category')
            .sort({ category: 1, name: 1 });

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error);
        res.status(500).json({ error: 'Failed to fetch training modules.' });
    }
});

// Get Physical Training Modules
router.get('/modules/physical', authenticate, async (req, res) => {
    try {
        const physicalModules = await Module.find({ category: 'physical' });
        if (!physicalModules || physicalModules.length === 0) {
            return res.status(404).json({ error: 'No physical modules found' });
        }
        res.json({ success: true, modules: physicalModules });
    } catch (error) {
        console.error('Error fetching physical modules:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Technical Training Modules
router.get('/modules/technical', authenticate, async (req, res) => {
    try {
        const technicalModules = await Module.find({ category: 'technical' });
        if (!technicalModules || technicalModules.length === 0) {
            return res.status(404).json({ error: 'No technical modules found' });
        }
        res.json({ success: true, modules: technicalModules });
    } catch (error) {
        console.error('Error fetching technical modules:', error);
        res.status(500).json({ error: 'Failed to fetch technical modules.' });
    }
});

// Get AI-Guided Modules
router.get('/modules/ai-guided', authenticate, async (req, res) => {
    try {
        const aiGuidedModules = await Module.find({ category: 'ai-guided' });
        if (!aiGuidedModules || aiGuidedModules.length === 0) {
            return res.status(404).json({ error: 'No AI-guided modules found' });
        }
        res.json({ success: true, modules: aiGuidedModules });
    } catch (error) {
        console.error('Error fetching AI-guided modules:', error);
        res.status(500).json({ error: 'Failed to fetch AI-guided modules.' });
    }
});
// Temporary Debug Route - Get All Sessions for a User
router.get('/debug/sessions/:userId', async (req, res) => {
    try {
        console.log('🚀 DEBUG: Fetching all sessions for user:', req.params.userId);

        // Convert userId to ObjectId only if it's 24 characters long
        const userId = req.params.userId.match(/^[0-9a-fA-F]{24}$/)
            ? new ObjectId(req.params.userId)
            : req.params.userId;

        console.log('🔍 Using userId:', userId);

        const sessions = await TrainingSession.find({ userId });

        console.log('🔍 Sessions Found:', sessions);
        res.json(sessions);
    } catch (error) {
        console.error('❌ ERROR Fetching Sessions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Start Module
// training.js
router.post('/modules/:moduleId/start', authenticate, async (req, res) => {
    try {
        console.log('Starting module with:', {
            moduleId: req.params.moduleId,
            body: req.body,
            user: req.user._id,
        });

        const { moduleId } = req.params;
        const { moduleType } = req.body;

        // Validate moduleId format
        console.log('Validating moduleId:', moduleId);
        const modulePattern = /^(physical|technical|simulation)-\d{3}$/;
        if (!modulePattern.test(moduleId)) {
            console.log('ModuleId validation failed:', moduleId);
            return res.status(400).json({
                error: 'Invalid moduleId format',
                expectedFormat: 'type-number (e.g., physical-001)',
                receivedId: moduleId,
            });
        }

        console.log('Creating training session...');
        const session = new TrainingSession({
            userId: req.user._id,
            moduleId,
            moduleType: moduleType || moduleId.split('-')[0],
            status: 'in-progress',
            startedAt: new Date(),
            adaptiveAI: {
                enabled: true,
                skillFactors: {
                    physical: 0,
                    technical: 0,
                    mental: 0,
                },
            },
        });

        console.log('Saving session:', session);
        await session.save();

        res.json({
            success: true,
            message: `Module ${moduleId} started successfully`,
            session,
        });
    } catch (error) {
        console.error('Error starting module:', error);
        res.status(500).json({
            error: 'Failed to start module',
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        });
    }
});
router.post('/modules/:moduleId/complete', authenticate, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            {
                userId: req.user._id,
                moduleId: req.params.moduleId,
                status: 'in-progress',
            },
            {
                $set: {
                    status: 'completed',
                    completedAt: new Date(),
                    'metrics.completionRate': req.body.completionRate || 100,
                    'metrics.effectivenessScore': req.body.effectivenessScore || 100,
                    'metrics.consistency': req.body.consistency || 100,
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        // Calculate and award credits
        const creditResults = await ModuleCreditSystem.awardCredits(session._id);

        // Send real-time update via WebSocket
        req.app.locals.webSocketService.sendToUser(req.user._id, 'module_completed', {
            moduleId: req.params.moduleId,
            creditResults,
            newTimeline: creditResults.newTimeline,
        });

        res.json({
            success: true,
            message: 'Module completed successfully',
            session: {
                id: session._id,
                type: session.moduleType,
                metrics: session.metrics,
            },
            credits: {
                earned: creditResults.earnedCredits,
                streak: creditResults.streak,
                multipliers: {
                    performance: creditResults.performanceMultiplier,
                    streak: creditResults.streakMultiplier,
                },
            },
            timelineImpact: {
                yearsReduced: creditResults.timelineImpact,
                newTimelineYears: creditResults.newTimeline,
            },
        });
    } catch (error) {
        console.error('Error completing module:', error);
        res.status(500).json({
            error: 'Failed to complete module',
            message: error.message,
        });
    }
});
// ============================
// Training Session Routes
// ============================

// Create Training Session
router.post('/sessions', authenticate, async (req, res) => {
    try {
        const { userId, moduleId, sessionData } = req.body;

        if (!userId || !moduleId || !sessionData) {
            return res.status(400).json({ success: false, message: 'Missing required fields.' });
        }

        let userProgress = await UserProgress.findOne({ userId });

        if (!userProgress) {
            userProgress = new UserProgress({ userId, moduleProgress: [] });
        }

        let moduleProgress = userProgress.moduleProgress.find((m) => m.moduleId === moduleId);

        if (!moduleProgress) {
            moduleProgress = {
                moduleId,
                completedSessions: 0,
                totalCreditsEarned: 0,
                trainingLogs: [],
            };
            userProgress.moduleProgress.push(moduleProgress);
        }

        moduleProgress.completedSessions += 1;
        moduleProgress.totalCreditsEarned += 100; // Adjust credit system if needed
        moduleProgress.trainingLogs.push({
            date: new Date(),
            exercisesCompleted: sessionData.exercisesCompleted || [],
            duration: sessionData.duration,
            caloriesBurned: sessionData.caloriesBurned || 0,
        });

        await userProgress.save();

        res.json({ success: true, message: 'Training session logged successfully.' });
    } catch (error) {
        console.error('Training session error:', error);
        res.status(500).json({ success: false, message: 'Failed to log training session.' });
    }
});

// Update Training Session
router.patch('/sessions/:sessionId', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            { $set: req.body },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        // Update timeline and notify
        await timelineManager.updatePersonalTimeline(req.user._id);
        webSocketService.sendToUser(req.user._id, 'session_updated', { session });

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error updating session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Complete Training Session
router.patch('/sessions/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            {
                $set: {
                    status: 'completed',
                    progress: 100,
                    completedAt: new Date(),
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        // Update timeline and notify
        await timelineManager.updatePersonalTimeline(req.user._id);
        webSocketService.sendToUser(req.user._id, 'session_completed', { session });

        res.json({ success: true, session });
    } catch (error) {
        console.error('Error completing session:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============================
// Assessment Routes
// ============================

// Start Assessment
router.post('/assessment/start', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = new TrainingSession({
            userId: req.user._id,
            moduleType: 'assessment', // ✅ Correct
            dateTime: new Date(),
            status: 'in-progress',
            aiGuidance: {
                enabled: true,
                lastGuidance: 'Starting initial assessment',
            },
            assessment: {
                type: 'initial',
                responses: [],
                startedAt: new Date(),
                aiRecommendations: {
                    focusAreas: [],
                    suggestedModules: [],
                    personalizedFeedback: '',
                    nextSteps: [],
                },
            },
        });

        await session.save();

        const assessmentQuestions = await AISpaceCoach.getInitialAssessment();

        webSocketService.sendToUser(req.user._id, 'assessment_started', {
            sessionId: session._id,
            questions: assessmentQuestions,
        });

        res.json({
            success: true,
            sessionId: session._id,
            questions: assessmentQuestions,
        });
    } catch (error) {
        console.error('Error starting assessment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Submit Assessment Answer
router.post('/assessment/:sessionId/submit', authenticate, sessionLimiter, async (req, res) => {
    try {
        const { question, answer } = req.body;
        const session = await TrainingSession.findOne({
            _id: new ObjectId(req.params.sessionId), // Ensure ObjectId format
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Get AI analysis
        const aiAnalysis = await AISpaceCoach.analyzeResponse(question, answer);

        // Update session
        session.assessment.responses.push({ question, answer, analysis: aiAnalysis });

        if (aiAnalysis.recommendations) {
            session.assessment.aiRecommendations = {
                ...session.assessment.aiRecommendations,
                ...aiAnalysis.recommendations,
            };
        }

        await session.save();

        const isComplete = session.assessment.responses.length >= aiAnalysis.totalQuestions;

        // Notify via WebSocket
        webSocketService.sendToUser(req.user._id, 'assessment_progress', {
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            progress: (session.assessment.responses.length / aiAnalysis.totalQuestions) * 100,
        });

        res.json({
            success: true,
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            immediateGuidance: aiAnalysis.immediateGuidance,
        });
    } catch (error) {
        console.error('Error submitting assessment:', error);
        res.status(500).json({ error: error.message });
    }
});

// Complete Assessment
router.post('/assessment/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOne({
            _id: new ObjectId(req.params.sessionId), // Ensure ObjectId format
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Generate final analysis and training plan
        const finalAnalysis = await AISpaceCoach.generateTrainingPlan(session.assessment.responses);

        // Update session
        session.status = 'completed';
        session.completedAt = new Date();
        session.assessment.aiRecommendations = finalAnalysis.recommendations;
        session.metrics = {
            physicalReadiness: finalAnalysis.metrics.physical,
            mentalPreparedness: finalAnalysis.metrics.mental,
            technicalProficiency: finalAnalysis.metrics.technical,
            overallScore: finalAnalysis.metrics.overall,
        };

        await session.save();

        // Update timeline and notify
        await timelineManager.updatePersonalTimeline(req.user._id);
        webSocketService.sendToUser(req.user._id, 'assessment_completed', {
            sessionId: session._id,
            recommendations: finalAnalysis.recommendations,
            metrics: session.metrics,
        });

        res.json({
            success: true,
            trainingPlan: {
                recommendedModules: finalAnalysis.recommendations.suggestedModules,
                focusAreas: finalAnalysis.recommendations.focusAreas,
                timeline: finalAnalysis.recommendations.timeline,
                nextSteps: finalAnalysis.recommendations.nextSteps,
            },
            metrics: session.metrics,
        });
    } catch (error) {
        console.error('Error completing assessment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
