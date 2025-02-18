// Part 1: Core Setup and Module Handling
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const ServiceIntegrator = require('../services/ServiceIntegrator');
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const { authenticate } = require('../middleware/authenticate');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const Session = require('../models/Session');
const validateRequest = require('../middleware/validateRequest'); // Adjust path as needed
const aiController = require('../controllers/AIController');
const aiCoachInstance = require('../services/AISpaceCoach');
const moduleLoader = require('../modules/moduleLoader');
const { ObjectId } = require('mongodb'); // ✅ Import ObjectId for correct usage

// Enhanced error handling
const handleError = (res, error, message = 'An error occurred') => {
    console.error(`${message}:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context: error.context || {},
        userId: error.userId || 'unknown',
        moduleId: error.moduleId || 'unknown',
    });

    res.status(500).json({
        error: message,
        message: error.message,
        timestamp: new Date().toISOString(),
        errorCode: error.code || 'INTERNAL_ERROR',
    });
};

// Module Routes
router.get('/training/modules', authenticate, async (req, res) => {
    try {
        const modules = await moduleLoader.getAvailableModules(req.user._id);
        const userProgress = await calculateUserProgress(req.user._id);

        res.json({
            success: true,
            modules,
            userProgress,
            nextRecommendedModule: await aiCoachInstance.getNextRecommendedModule(req.user._id),
        });
    } catch (error) {
        handleError(res, error, 'Failed to fetch modules');
    }
});

router.get('/training/modules/:moduleId', authenticate, async (req, res) => {
    try {
        const module = await moduleLoader.loadModule(req.params.moduleId);
        if (!module) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const userEligibility = await moduleLoader.validateModulePrerequisites(
            req.params.moduleId,
            req.user._id
        );

        res.json({
            success: true,
            module,
            userEligibility,
            estimatedCompletion: await aiCoachInstance.calculateEstimatedCompletion(
                req.user._id,
                req.params.moduleId
            ),
        });
    } catch (error) {
        handleError(res, error, 'Failed to load module details');
    }
});

// Start Module - Update this route in your training.js
router.post('/modules/:moduleId/start', authenticate, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const { moduleType } = req.body;

        // Validate moduleId format (type-number, e.g., physical-001)
        const modulePattern = /^(physical|technical|simulation)-\d{3}$/;
        if (!modulePattern.test(moduleId)) {
            console.log('Invalid moduleId format:', moduleId);
            return res.status(400).json({
                error: 'Invalid moduleId format',
                expectedFormat: 'type-number (e.g., physical-001)',
            });
        }

        // Create new training session
        const session = new TrainingSession({
            userId: req.user._id,
            moduleId,
            moduleType: moduleType || moduleId.split('-')[0], // Extract type from moduleId if not provided
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
            metrics: {
                completionRate: 0,
                effectivenessScore: 0,
                overallRank: 0,
            },
        });

        await session.save();

        // Notify via WebSocket
        webSocketService.sendToUser(req.user._id, 'module_started', {
            moduleId,
            sessionId: session._id,
            moduleType: session.moduleType,
        });

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
        });
    }
});
// Task-specific progress tracking
router.post('/training/modules/:moduleId/task/:taskId', authenticate, async (req, res) => {
    try {
        console.log('Updating task progress...');
        console.log('User ID:', req.user._id);
        console.log('Module ID:', req.params.moduleId);
        console.log('Task ID:', req.params.taskId);

        // Find active session
        const session = await TrainingSession.findOne({
            userId: req.user._id,
            moduleId: req.params.moduleId,
            status: 'in-progress',
        });

        console.log('Found session:', session);

        if (!session) {
            return res.status(404).json({
                error: 'No active session found',
                message: 'Please start a training session first',
            });
        }

        // Update task progress
        const taskUpdate = {
            taskId: req.params.taskId,
            completedAt: new Date(),
            ...req.body,
        };

        // Initialize taskProgress array if it doesn't exist
        if (!session.taskProgress) {
            session.taskProgress = [];
        }

        session.taskProgress.push(taskUpdate);
        await session.save();

        res.json({
            success: true,
            message: 'Task progress updated successfully',
            taskUpdate,
            sessionId: session._id,
        });
    } catch (error) {
        console.error('Error updating task progress:', error);
        res.status(500).json({
            error: 'Failed to update task progress',
            details: error.message,
        });
    }
});

// Real-time performance metrics
router.post('/training/modules/:moduleId/metrics', authenticate, async (req, res) => {
    try {
        const { metricType, value } = req.body;

        const updatedMetrics = await TrainingSession.findOneAndUpdate(
            {
                moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
                userId: req.user._id,
                status: 'in-progress',
            },
            {
                $push: {
                    [`metrics.${metricType}`]: {
                        value,
                        timestamp: new Date(),
                        context: req.body.context || {},
                    },
                },
            },
            { new: true }
        );

        const analysis = await aiCoachInstance.analyzeMetrics(updatedMetrics.metrics);

        res.json({
            success: true,
            metrics: updatedMetrics.metrics,
            analysis,
            recommendations: analysis.recommendations,
        });
    } catch (error) {
        handleError(res, error, 'Failed to update metrics');
    }
});

// Module Checkpoint Assessment
router.post('/training/modules/:moduleId/checkpoint', authenticate, async (req, res) => {
    try {
        console.log('🚀 DEBUG: Searching for session with:');
        console.log('moduleId:', req.params.moduleId);
        console.log('userId:', req.user._id);
        console.log('moduleType: physical');
        console.log('status: in-progress');

        const session = await TrainingSession.findOne({
            moduleId: new ObjectId(req.params.moduleId),
            sessionType: 'physical',
            userId: new ObjectId(req.user._id),
            status: 'in-progress',
        });

        console.log('🔍 Session Found:', session);

        if (!session) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        const checkpointResults = await performCheckpointAssessment(session);
        const adaptiveChanges = await updateAdaptiveDifficulty(session, checkpointResults);

        session.checkpoints = session.checkpoints || [];
        session.checkpoints.push({
            timestamp: new Date(),
            results: checkpointResults,
            adaptiveChanges,
        });

        await session.save();

        res.json({
            success: true,
            checkpointResults,
            adaptiveChanges,
            recommendations: await generateCheckpointRecommendations(checkpointResults),
        });
    } catch (error) {
        handleError(res, error, 'Failed to complete checkpoint assessment');
    }
});

// Emergency Response Training
router.post('/training/modules/:moduleId/emergency-scenario', authenticate, async (req, res) => {
    try {
        const { scenarioId } = req.body;

        const scenario = await generateEmergencyScenario({
            moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
            userId: req.user._id,
            scenarioId,
        });

        const session = await TrainingSession.findOneAndUpdate(
            {
                moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
                userId: req.user._id,
                status: 'in-progress',
            },
            {
                $push: {
                    emergencyScenarios: {
                        scenarioId,
                        startedAt: new Date(),
                        difficulty: scenario.difficulty,
                    },
                },
            },
            { new: true }
        );

        res.json({
            success: true,
            scenario,
            timeLimit: scenario.timeLimit,
            objectives: scenario.objectives,
            initialConditions: scenario.initialConditions,
        });
    } catch (error) {
        handleError(res, error, 'Failed to generate emergency scenario');
    }
});

// Team Coordination Training
router.post('/training/modules/:moduleId/team-exercise', authenticate, async (req, res) => {
    try {
        const { teamSize, role, difficulty } = req.body;

        const exercise = await generateTeamExercise({
            moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
            teamSize,
            role,
            difficulty,
        });

        const session = await TrainingSession.findOneAndUpdate(
            {
                moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
                userId: req.user._id,
                status: 'in-progress',
            },
            {
                $push: {
                    teamExercises: {
                        exerciseId: exercise.id,
                        startedAt: new Date(),
                        role,
                        teamSize,
                    },
                },
            },
            { new: true }
        );

        res.json({
            success: true,
            exercise,
            role: exercise.roleSpecificInstructions[role],
            teamComposition: exercise.teamComposition,
            communicationProtocols: exercise.communicationProtocols,
        });
    } catch (error) {
        handleError(res, error, 'Failed to generate team exercise');
    }
});

// Performance Review and Feedback
router.post('/training/modules/:moduleId/review', authenticate, async (req, res) => {
    try {
        console.log('🚀 DEBUG: Searching for session with:');
        console.log(
            'moduleId (API request):',
            req.params.moduleId,
            'Type:',
            typeof req.params.moduleId
        );
        console.log('userId (API request):', req.user._id, 'Type:', typeof req.user._id);
        console.log('moduleType (API request):', 'physical');
        console.log('status (API request):', 'in-progress');

        const session = await TrainingSession.findOne({
            moduleId: new ObjectId(req.params.moduleId),
            moduleType: 'physical',
            userId: new ObjectId(req.user._id),
            status: 'in-progress',
        });

        console.log('🔍 Session Found:', session);

        const performanceReview = await generatePerformanceReview(session);
        const aiFeedback = await aiCoachInstance.generateDetailedFeedback(session);

        res.json({
            success: true,
            review: performanceReview,
            feedback: aiFeedback,
            improvements: await generateImprovementPlan(session),
            nextSteps: await recommendNextTrainingPhase(session),
        });
    } catch (error) {
        handleError(res, error, 'Failed to generate performance review');
    }
});
// Render AI Guidance Page
router.get('/guidance', async (req, res) => {
    try {
        const guidanceData = await aiGuidance.getGuidanceData();
        res.render('ai-guidance', { title: 'AI Guidance', guidance: guidanceData });
    } catch (error) {
        console.error('Error rendering AI Guidance view:', error);
        res.status(500).send('Error rendering AI Guidance view.');
    }
});

// Render AI-Guided Coaching Page
router.get('/ai-coaching', async (req, res) => {
    try {
        const guidanceData = await aiGuidance.getGuidanceData();
        res.render('ai-coaching', { title: 'AI-Guided Coaching', guidance: guidanceData });
    } catch (error) {
        console.error('Error rendering AI-Guided Coaching module:', error);
        res.status(500).send('Error rendering AI module.');
    }
});

// Generate Training Content for a Module (updated to include moduleType)
router.get('/training-content/:moduleType/:module', authenticate, async (req, res) => {
    try {
        // Now your controller should handle the moduleType parameter as well.
        await aiController.generateTrainingContent(req, res);
    } catch (error) {
        console.error('Error generating training content:', error);
        res.status(500).json({ error: 'Failed to generate training content' });
    }
});

// AI Guidance JSON Endpoint
router.get('/ai-guidance', async (req, res) => {
    try {
        // Use aiCoachInstance to generate coaching suggestions; note the optional chaining on req.user.
        const guidanceData = await aiCoachInstance.generateCoachingSuggestions({
            userId: req.user?._id,
            currentProgress: req.query.currentProgress || 0,
            context: req.query.context || '',
        });
        res.json({ success: true, guidance: guidanceData });
    } catch (error) {
        handleError(res, error, 'Failed to generate AI guidance');
    }
});

// Get available training modules (using moduleLoader which now returns modules with type info)
router.get('/training/modules', authenticate, async (req, res) => {
    try {
        const modules = await moduleLoader.getAvailableModules(req.user._id);
        res.json({
            success: true,
            modules,
        });
    } catch (error) {
        handleError(res, error, 'Failed to fetch modules');
    }
});

// Alternative: Render Training Content view (updated route)
router.get('/training-content/view/:moduleType/:module', async (req, res) => {
    try {
        const contentResponse = await aiController.generateTrainingContent(req, res);
        res.render('training-content', {
            title: 'Training Content',
            module: req.params.module,
            content: contentResponse.content,
            difficulty: contentResponse.difficulty,
        });
    } catch (error) {
        console.error('Error generating training content:', error);
        res.status(500).json({ error: 'Failed to generate training content' });
    }
});

/* -------------------------------
   Module Endpoints for Training
---------------------------------*/
// Physical Training Module Endpoint
router.get('/modules/physical', authenticate, async (req, res) => {
    try {
        const physicalData = {
            title: 'Physical Training',
            description: 'Prepare your body for space travel with focused physical training.',
            objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation'],
        };
        res.json({ success: true, data: physicalData });
    } catch (err) {
        console.error('Physical module error:', err);
        res.status(500).json({
            error: 'Failed to fetch physical training data.',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
    }
});

// Technical Training Module Endpoint
router.get('/modules/technical', authenticate, async (req, res) => {
    try {
        const technicalData = {
            title: 'Technical Training',
            description: 'Develop essential technical skills for space operations.',
            objectives: ['System operations', 'Emergency procedures', 'Navigation'],
        };
        res.json({ success: true, data: technicalData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch technical training data.' });
    }
});

// AI-Guided Training Module Endpoint
router.get('/modules/ai-guided', authenticate, async (req, res) => {
    try {
        const aiData = await aiGuidance.getGuidanceData();
        res.json({ success: true, data: aiData });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch AI-guided training data.' });
    }
});

// Hardcoded modules list endpoint (updated to include moduleType)
router.get('/training/modules/list', authenticate, async (req, res) => {
    try {
        const modules = [
            {
                id: 'physical-001',
                moduleType: 'physical',
                name: 'Physical Training',
                description: 'Space readiness physical preparation',
                difficulty: 'beginner',
                duration: '4 weeks',
                prerequisites: [],
                objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation'],
            },
            {
                id: 'technical-001',
                moduleType: 'technical',
                name: 'Technical Skills',
                description: 'Essential space operations training',
                difficulty: 'intermediate',
                duration: '6 weeks',
                prerequisites: ['physical-001'],
                objectives: ['System operations', 'Emergency procedures', 'Navigation'],
            },
            {
                id: 'simulation-001',
                moduleType: 'simulation',
                name: 'Space Simulation',
                description: 'Practical space mission simulation',
                difficulty: 'advanced',
                duration: '8 weeks',
                prerequisites: ['physical-001', 'technical-001'],
                objectives: ['Mission planning', 'Team coordination', 'Crisis management'],
            },
        ];

        res.json({
            success: true,
            modules,
            userProgress: await calculateUserProgress(req.user._id),
        });
    } catch (error) {
        handleError(res, error, 'Failed to fetch training modules');
    }
});

// Start a Training Module (updated to include moduleType)
router.post('/training/modules/:moduleType/:moduleId/start', authenticate, async (req, res) => {
    try {
        console.log('Module Type and ID from params:', req.params.moduleType, req.params.moduleId); // Debug log
        const moduleDetails = await getModuleDetails(req.params.moduleType, req.params.moduleId);
        console.log('Retrieved module details:', moduleDetails); // Debug log

        if (!moduleDetails) {
            return res.status(404).json({ error: 'Module not found' });
        }

        const session = new TrainingSession({
            userId: req.user._id,
            moduleType: req.params.moduleType,
            moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
            moduleType: req.params.moduleType, // ✅ Correct// assuming sessionType matches moduleType
            dateTime: new Date(),
            status: 'in-progress',
            adaptiveAI: {
                enabled: true,
                skillFactors: {
                    physical: 0,
                    technical: 0,
                    mental: 0,
                },
            },
            metrics: {
                completionRate: 0,
                effectivenessScore: 0,
                overallRank: 999999,
            },
        });

        await session.save();

        res.json({
            success: true,
            sessionId: session._id,
            module: moduleDetails,
            initialGuidance: `Welcome to ${moduleDetails.name}. Let's begin with the basics.`,
        });
    } catch (error) {
        console.error('Error starting training module:', error);
        res.status(500).json({
            error: 'Failed to start training module',
            message: error.message,
            timestamp: new Date().toISOString(),
        });
    }
});

// Update Training Module Progress (updated to include moduleType)
router.post('/training/modules/:moduleType/:moduleId/progress', authenticate, async (req, res) => {
    try {
        const { progress, completedTasks } = req.body;
        const session = await TrainingSession.findOneAndUpdate(
            {
                moduleId: new ObjectId(req.params.moduleId), // ✅ Correct conversion
                moduleType: req.params.moduleType,
                userId: req.user._id,
                status: 'in-progress',
            },
            {
                $set: {
                    progress,
                    'metrics.technicalProficiency': completedTasks.length * 33.33,
                    lastUpdated: new Date(),
                },
                $push: {
                    completedTasks: { $each: completedTasks },
                },
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Active session not found' });
        }

        session.ranking.points = session.calculatePoints();
        await session.save();
        await TrainingSession.updateGlobalRanks();

        const nextMilestone = await calculateNextMilestone(session);

        res.json({
            success: true,
            currentProgress: progress,
            ranking: {
                globalRank: session.ranking.globalRank,
                points: session.ranking.points,
                level: session.ranking.level,
            },
            nextMilestone,
            achievements: session.achievements,
        });
    } catch (error) {
        handleError(res, error, 'Failed to update progress');
    }
});

/* -------------------------------
   AI & WebSocket Endpoints
---------------------------------*/
router.post('/initialize', authenticate, async (req, res) => {
    try {
        const { mode } = req.body;
        console.log('Initializing AI for user:', req.user._id, 'Mode:', mode);

        const initResult = await aiCoachInstance.selectAIMode({
            userId: req.user._id,
            preferredMode: mode || 'full_guidance',
        });

        const session = await TrainingSession.findOneAndUpdate(
            { userId: req.user._id, status: 'in-progress' },
            {
                $set: {
                    'aiGuidance.enabled': true,
                    'aiGuidance.mode': mode,
                    'aiGuidance.lastInitialized': new Date(),
                },
            },
            { new: true, upsert: true }
        );

        const ws = clients.get(req.user._id);
        if (ws) {
            ws.send(
                JSON.stringify({
                    type: 'AI_INITIALIZED',
                    data: { mode, sessionId: session._id },
                })
            );
        }

        res.json({
            success: true,
            sessionId: session._id,
            aiMode: initResult,
            guidance: await aiCoachInstance.generateInitialGuidance(req.user._id),
        });
    } catch (err) {
        handleError(res, err, 'Failed to initialize AI systems');
    }
});

router.post('/ai-guidance', async (req, res) => {
    try {
        const { questionId, currentProgress, context } = req.body;
        const suggestions = await aiCoachInstance.generateCoachingSuggestions({
            questionId,
            currentProgress,
            context,
        });
        res.json({ suggestions });
    } catch (error) {
        res.status(500).json({
            error: 'Failed to generate AI guidance',
            message: error.message,
        });
    }
});

/* -------------------------------
   AI Controller Routes
---------------------------------*/
router.get('/', aiController.renderAIGuidance);
router.post('/launch', aiController.launchAIGuidedTraining);

/* -------------------------------
   WebSocket Setup
---------------------------------*/
const wsServer = new WebSocket.Server({ noServer: true });
wsServer.on('connection', (ws, req) => {
    const userId = req.userId;
    clients.set(userId, ws);

    ws.send(
        JSON.stringify({
            type: 'CONNECTION_ESTABLISHED',
            timestamp: new Date().toISOString(),
        })
    );

    ws.on('close', () => {
        clients.delete(userId);
        ServiceIntegrator.stopMonitoring(userId);
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
        ServiceIntegrator.handleConnectionError(userId, error);
    });
});

// -------------------------------
// Helper functions for assessment analysis
// -------------------------------
function calculateAssessmentScore(responses) {
    return 85; // Placeholder
}

function calculatePhysicalScore(responses) {
    return 80; // Placeholder
}

function calculateMentalScore(responses) {
    return 85; // Placeholder
}

function calculateTechnicalScore(responses) {
    return 90; // Placeholder
}

function generateSuggestedModules(responses) {
    return ['Advanced Navigation', 'Space Physics', 'EVA Training']; // Placeholder
}

function identifyFocusAreas(responses) {
    return ['Zero Gravity Adaptation', 'Emergency Procedures']; // Placeholder
}

function generateNextSteps(responses) {
    return ['Complete Basic Training', 'Start Simulator Sessions']; // Placeholder
}

function getAssessmentStatus(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Satisfactory';
    return 'Needs Improvement';
}

function calculateCompletionTime(session) {
    if (!session.assessment || !session.assessment.startedAt) {
        return null;
    }
    const start = new Date(session.assessment.startedAt);
    const end = new Date(session.assessment.completedAt || new Date());
    return Math.round((end - start) / 1000);
}

function identifyStrengths(responses) {
    return ['Technical Knowledge', 'Problem Solving']; // Placeholder
}

function identifyWeaknesses(responses) {
    return ['Physical Endurance', 'Emergency Response']; // Placeholder
}

function generateTrainingTimeline(analysis) {
    return {
        immediate: 'Begin Basic Training',
        week1: 'Complete Physical Assessment',
        month1: 'Start Advanced Modules',
    };
}

function generateCertificateUrl(sessionId) {
    return `/api/certificates/assessment/${sessionId}`;
}

async function calculateUserProgress(userId) {
    // Placeholder implementation
    return { progress: 50 };
}

/* -------------------------------
   Final Combined Export
---------------------------------*/
module.exports = {
    router,
    upgradeConnection: (server) => {
        server.on('upgrade', async (request, socket, head) => {
            try {
                const userId = await authenticateWebSocket(request);
                if (!userId) {
                    socket.destroy();
                    return;
                }
                request.userId = userId;
                wsServer.handleUpgrade(request, socket, head, (ws) => {
                    wsServer.emit('connection', ws, request);
                });
            } catch (error) {
                console.error('WebSocket upgrade error:', error);
                socket.destroy();
            }
        });
    },
    wss: wsServer,
};
