const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const rateLimit = require('express-rate-limit');
const TrainingSession = require('../models/TrainingSession');
const AISpaceCoach = require('../services/AISpaceCoach');
const Joi = require('joi');
const Module = require("../models/Module");
const mongoose = require("mongoose");
const SpaceTimelineManager = require('../services/SpaceTimelineManager');
const webSocketService = require('../services/webSocketService');

// Initialize Services
const timelineManager = new SpaceTimelineManager(webSocketService);

// Rate Limiter Configuration
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later.' }
});

// Validation Schemas
const sessionSchema = Joi.object({
    sessionType: Joi.string().required(),
    dateTime: Joi.date().greater('now').required(),
    participants: Joi.array().items(Joi.string()),
    points: Joi.number().min(0).default(0)
});

const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
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
router.get("/modules/physical", authenticate, async (req, res) => {
    try {
        const physicalModules = await Module.find({ category: "physical" });
        if (!physicalModules || physicalModules.length === 0) {
            return res.status(404).json({ error: "No physical modules found" });
        }
        res.json({ success: true, modules: physicalModules });
    } catch (error) {
        console.error("Error fetching physical modules:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// Get Technical Training Modules
router.get('/modules/technical', authenticate, async (req, res) => {
    try {
        const technicalModules = await Module.find({ category: "technical" });
        if (!technicalModules || technicalModules.length === 0) {
            return res.status(404).json({ error: "No technical modules found" });
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
        const aiGuidedModules = await Module.find({ category: "ai-guided" });
        if (!aiGuidedModules || aiGuidedModules.length === 0) {
            return res.status(404).json({ error: "No AI-guided modules found" });
        }
        res.json({ success: true, modules: aiGuidedModules });
    } catch (error) {
        console.error('Error fetching AI-guided modules:', error);
        res.status(500).json({ error: 'Failed to fetch AI-guided modules.' });
    }
});

// Start Module
router.post("/modules/:moduleId/start", authenticate, async (req, res) => {
    try {
        const { moduleId } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            return res.status(400).json({ error: "Invalid moduleId format" });
        }

        const module = await Module.findById(moduleId);
        if (!module) {
            return res.status(404).json({ error: "Module not found" });
        }

        // Create new training session
        const session = new TrainingSession({
            userId: req.user._id,
            moduleId,
            status: 'in-progress',
            startedAt: new Date()
        });

        await session.save();

        // Notify via WebSocket
        webSocketService.sendToUser(req.user._id, 'module_started', {
            moduleId,
            sessionId: session._id,
            moduleName: module.name
        });

        res.json({ 
            success: true, 
            message: `Module ${moduleId} started successfully`, 
            session 
        });
    } catch (error) {
        console.error("Error starting module:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// ============================
// Training Session Routes
// ============================

// Create Training Session
router.post('/sessions', authenticate, async (req, res) => {
    try {
        await sessionSchema.validateAsync(req.body);
        
        const session = new TrainingSession({
            userId: req.user._id,
            ...req.body,
            status: 'scheduled'
        });
        
        await session.save();
        
        // Update timeline
        await timelineManager.updatePersonalTimeline(req.user._id);
        
        webSocketService.sendToUser(req.user._id, 'session_created', { session });
        
        res.status(201).json({ success: true, session });
    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ error: error.message });
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
                    completedAt: new Date()
                } 
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
            sessionType: 'Assessment',
            dateTime: new Date(),
            status: 'in-progress',
            aiGuidance: {
                enabled: true,
                lastGuidance: 'Starting initial assessment'
            },
            assessment: {
                type: 'initial',
                responses: [],
                startedAt: new Date(),
                aiRecommendations: {
                    focusAreas: [],
                    suggestedModules: [],
                    personalizedFeedback: '',
                    nextSteps: []
                }
            }
        });

        await session.save();
        
        const assessmentQuestions = await AISpaceCoach.getInitialAssessment();
        
        webSocketService.sendToUser(req.user._id, 'assessment_started', {
            sessionId: session._id,
            questions: assessmentQuestions
        });

        res.json({
            success: true,
            sessionId: session._id,
            questions: assessmentQuestions
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
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
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
                ...aiAnalysis.recommendations
            };
        }

        await session.save();

        const isComplete = session.assessment.responses.length >= aiAnalysis.totalQuestions;

        // Notify via WebSocket
        webSocketService.sendToUser(req.user._id, 'assessment_progress', {
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            progress: (session.assessment.responses.length / aiAnalysis.totalQuestions) * 100
        });

        res.json({
            success: true,
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            immediateGuidance: aiAnalysis.immediateGuidance
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
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
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
            overallScore: finalAnalysis.metrics.overall
        };

        await session.save();

        // Update timeline and notify
        await timelineManager.updatePersonalTimeline(req.user._id);
        webSocketService.sendToUser(req.user._id, 'assessment_completed', {
            sessionId: session._id,
            recommendations: finalAnalysis.recommendations,
            metrics: session.metrics
        });

        res.json({
            success: true,
            trainingPlan: {
                recommendedModules: finalAnalysis.recommendations.suggestedModules,
                focusAreas: finalAnalysis.recommendations.focusAreas,
                timeline: finalAnalysis.recommendations.timeline,
                nextSteps: finalAnalysis.recommendations.nextSteps
            },
            metrics: session.metrics
        });
    } catch (error) {
        console.error('Error completing assessment:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;