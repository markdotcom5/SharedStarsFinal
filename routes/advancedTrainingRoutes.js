// routes/advancedTrainingRoutes.js

const express = require('express');
const mongoose = require('mongoose'); // Required for ObjectId conversion
const router = express.Router();
const WebSocket = require('ws');
const { authenticate, authenticateWebSocket } = require('../middleware/authenticate');
const TrainingSession = require('../models/TrainingSession');
const aiCoachInstance = require('../services/AISpaceCoach');
const moduleLoader = require('../modules/moduleLoader');

// Create a WebSocket server instance for advanced routes if needed
const wsServer = new WebSocket.Server({ noServer: true });
const clients = new Map();

/* =====================================================
   Advanced Training Module Routes
===================================================== */

// 1. Task-specific progress tracking
router.post(
    '/training/modules/:moduleType/:moduleId/task/:taskId',
    authenticate,
    async (req, res) => {
        try {
            const { performance, timeSpent, metrics } = req.body;
            let { moduleType, moduleId, taskId } = req.params;

            console.log('Route parameters:', req.params);

            // Trim parameters to remove extra whitespace/newlines
            moduleType = moduleType.trim();
            taskId = taskId.trim();
            console.log('Using moduleType:', moduleType);
            console.log('Using taskId:', taskId);

            // Build query using sessionType instead of moduleType, and moduleId as a string
            const query = {
                moduleId: moduleId,
                moduleType: moduleType.trim(), // ✅ Correct
                userId: new mongoose.Types.ObjectId(req.user._id),
                status: 'in-progress',
            };

            console.log('Final query:', JSON.stringify(query));

            const session = await TrainingSession.findOne(query);
            console.log('Found session:', session);

            if (!session) {
                return res.status(404).json({ error: 'Active session not found' });
            }

            // Proceed with your task tracking logic...
            const taskFeedback = await generateDetailedTaskFeedback(
                req.user._id,
                moduleId,
                taskId,
                performance,
                timeSpent,
                metrics
            );

            session.taskProgress = session.taskProgress || [];
            session.taskProgress.push({
                taskId: taskId,
                feedback: taskFeedback,
                completedAt: new Date(),
            });
            session.adaptiveDifficulty = await updateAdaptiveDifficulty(session, {
                score: performance,
            });
            await session.save();

            res.json({
                success: true,
                taskFeedback: taskFeedback,
                nextTask: await determineNextTask(req.user._id, moduleId),
            });
        } catch (error) {
            handleError(res, error, 'Failed to update task progress');
        }
    }
);

// 2. Real-time performance metrics (stub)
router.post('/training/modules/:moduleType/:moduleId/metrics', authenticate, async (req, res) => {
    try {
        const { metricType, value, context } = req.body;
        let { moduleType, moduleId } = req.params;
        moduleType = moduleType.trim();

        const query = {
            moduleId: new mongoose.Types.ObjectId(moduleId),
            moduleType: moduleType,
            userId: new mongoose.Types.ObjectId(req.user._id),
            status: 'in-progress',
        };

        const session = await TrainingSession.findOne(query);
        if (!session) return res.status(404).json({ error: 'Active session not found' });

        await addRealTimeMetric(session, metricType, value, context);
        const analysis = await analyzeRealTimeMetrics(session);

        res.json({ success: true, metrics: session.metrics, analysis: analysis });
    } catch (error) {
        handleError(res, error, 'Failed to update real-time metrics');
    }
});

// 3. Checkpoint assessments (stub)
router.post(
    '/training/modules/:moduleType/:moduleId/checkpoint',
    authenticate,
    async (req, res) => {
        try {
            let { moduleType, moduleId } = req.params;
            moduleType = moduleType.trim();

            const query = {
                moduleId: new mongoose.Types.ObjectId(moduleId),
                moduleType: moduleType,
                userId: new mongoose.Types.ObjectId(req.user._id),
                status: 'in-progress',
            };

            const session = await TrainingSession.findOne(query);
            if (!session) return res.status(404).json({ error: 'Active session not found' });

            const checkpointResults = await generateCheckpointAssessment(session);
            session.checkpoints = session.checkpoints || [];
            session.checkpoints.push({
                timestamp: new Date(),
                results: checkpointResults,
                adaptiveChanges: await updateAdaptiveDifficulty(session, checkpointResults),
            });
            await session.save();

            const recommendations = await generateCheckpointRecommendations(checkpointResults);
            res.json({
                success: true,
                checkpointResults: checkpointResults,
                recommendations: recommendations,
            });
        } catch (error) {
            handleError(res, error, 'Failed to perform checkpoint assessment');
        }
    }
);

// 4. Emergency scenario training (stub)
router.post(
    '/training/modules/:moduleType/:moduleId/emergency-scenario',
    authenticate,
    async (req, res) => {
        try {
            let { moduleType, moduleId } = req.params;
            moduleType = moduleType.trim();
            const { scenarioId } = req.body;

            const query = {
                moduleId: new mongoose.Types.ObjectId(moduleId),
                moduleType: moduleType,
                userId: new mongoose.Types.ObjectId(req.user._id),
                status: 'in-progress',
            };

            const session = await TrainingSession.findOne(query);
            if (!session) return res.status(404).json({ error: 'Active session not found' });

            const scenario = await generateEmergencyScenario({
                moduleId,
                moduleType,
                userId: req.user._id,
                scenarioId: scenarioId,
            });
            session.emergencyScenarios = session.emergencyScenarios || [];
            session.emergencyScenarios.push({
                scenarioId: scenarioId,
                startedAt: new Date(),
                difficulty: scenario.difficulty,
            });
            await session.save();

            res.json({
                success: true,
                scenario: scenario,
                timeLimit: scenario.timeLimit,
                objectives: scenario.objectives,
                initialConditions: scenario.initialConditions,
            });
        } catch (error) {
            handleError(res, error, 'Failed to generate emergency scenario');
        }
    }
);

// 5. Team coordination exercises (stub)
router.post(
    '/training/modules/:moduleType/:moduleId/team-exercise',
    authenticate,
    async (req, res) => {
        try {
            let { moduleType, moduleId } = req.params;
            moduleType = moduleType.trim();
            const { teamSize, role, difficulty } = req.body;

            const query = {
                moduleId: new mongoose.Types.ObjectId(moduleId),
                moduleType: moduleType,
                userId: new mongoose.Types.ObjectId(req.user._id),
                status: 'in-progress',
            };

            const session = await TrainingSession.findOne(query);
            if (!session) return res.status(404).json({ error: 'Active session not found' });

            const exercise = await generateTeamExercise({
                moduleId,
                moduleType,
                teamSize,
                role,
                difficulty,
                userId: req.user._id,
            });
            session.teamExercises = session.teamExercises || [];
            session.teamExercises.push({
                exerciseId: exercise.id,
                startedAt: new Date(),
                role: role,
                teamSize: teamSize,
            });
            await session.save();

            res.json({
                success: true,
                exercise: exercise,
                roleInstructions: exercise.roleSpecificInstructions[role],
                teamComposition: exercise.teamComposition,
                communicationProtocols: exercise.communicationProtocols,
            });
        } catch (error) {
            handleError(res, error, 'Failed to generate team exercise');
        }
    }
);

// 6. Detailed performance reviews (stub)
router.post('/training/modules/:moduleType/:moduleId/review', authenticate, async (req, res) => {
    try {
        let { moduleType, moduleId } = req.params;
        moduleType = moduleType.trim();

        const query = {
            moduleId: new mongoose.Types.ObjectId(moduleId),
            moduleType: moduleType,
            userId: new mongoose.Types.ObjectId(req.user._id),
        };

        const session = await TrainingSession.findOne(query);
        if (!session) return res.status(404).json({ error: 'Active session not found' });

        const performanceReview = await generatePerformanceReview(session);
        const improvementPlan = await generateImprovementPlan(session);
        const aiFeedback = await aiCoachInstance.generateDetailedFeedback(session);
        const nextSteps = await recommendNextTrainingPhase(session);

        res.json({
            success: true,
            review: performanceReview,
            improvementPlan: improvementPlan,
            feedback: aiFeedback,
            nextSteps: nextSteps,
        });
    } catch (error) {
        handleError(res, error, 'Failed to generate performance review');
    }
});

/* =====================================================
   Helper Functions for Advanced Routes
===================================================== */

async function generateDetailedTaskFeedback(
    userId,
    moduleId,
    taskId,
    performance,
    timeSpent,
    metrics
) {
    const historicalData = await getUserTaskHistory(userId, taskId);
    const averagePerformance =
        historicalData && historicalData.length
            ? historicalData.reduce((acc, curr) => acc + curr.performance, 0) /
              historicalData.length
            : performance;
    const analysis =
        performance > averagePerformance ? 'Above average performance' : 'Needs improvement';
    return {
        performance: performance,
        timeSpent: timeSpent,
        metrics: metrics,
        analysis: analysis,
        comparison: { averagePerformance: averagePerformance },
    };
}

async function determineNextTask(userId, moduleId) {
    return 'next-task-id';
}

async function addRealTimeMetric(session, metricType, value, context) {
    session.metrics = session.metrics || {};
    session.metrics[metricType] = session.metrics[metricType] || [];
    session.metrics[metricType].push({
        value: value,
        timestamp: new Date(),
        context: context || {},
    });
    await session.save();
    return session.metrics;
}

async function analyzeRealTimeMetrics(session) {
    let analysis = {};
    for (let metric in session.metrics) {
        const values = session.metrics[metric].map((entry) => entry.value);
        const average = values.reduce((sum, val) => sum + val, 0) / values.length;
        analysis[metric] = { average: average, count: values.length };
    }
    return analysis;
}

async function generateCheckpointAssessment(session) {
    const score = session.progress || 50;
    return {
        score: score,
        status: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Improvement',
    };
}

async function updateAdaptiveDifficulty(session, assessmentResults) {
    let adjustment = 0;
    if (assessmentResults.score < 60) adjustment = -1;
    else if (assessmentResults.score > 80) adjustment = 1;
    session.adaptiveDifficulty = (session.adaptiveDifficulty || 0) + adjustment;
    await session.save();
    return session.adaptiveDifficulty;
}

async function generateCheckpointRecommendations(assessmentResults) {
    if (assessmentResults.score < 60)
        return ['Review basic concepts', 'Schedule a coaching session'];
    else if (assessmentResults.score > 80)
        return ['Proceed to advanced challenges', 'Explore new module content'];
    return ['Maintain current pace', 'Focus on consistency'];
}

async function generateEmergencyScenario({ moduleId, moduleType, userId, scenarioId }) {
    return {
        scenarioId: scenarioId,
        difficulty: 'High',
        timeLimit: 300,
        objectives: [
            'Identify system failure',
            'Initiate emergency protocols',
            'Stabilize operations',
        ],
        initialConditions: {
            systemStatus: 'Critical',
            crewMorale: 'Low',
        },
    };
}

async function generateTeamExercise({ moduleId, moduleType, teamSize, role, difficulty, userId }) {
    return {
        id: 'exercise-' + Date.now(),
        name: 'Team Coordination Drill',
        roleSpecificInstructions: {
            leader: 'Coordinate the team and make decisive moves.',
            member: 'Follow instructions and provide support.',
        },
        teamComposition: Array(teamSize).fill('Member'),
        communicationProtocols: ['Standard radio', 'Backup signal'],
    };
}

async function generatePerformanceReview(session) {
    return {
        overallScore:
            session.metrics && session.metrics.completionRate ? session.metrics.completionRate : 75,
        strengths: ['Task efficiency', 'Adaptability'],
        weaknesses: ['Time management', 'Detail orientation'],
        comments: 'Overall, performance is satisfactory. Focus on improving time management.',
    };
}

async function generateImprovementPlan(session) {
    return [
        'Review performance data',
        'Attend targeted training sessions',
        'Implement feedback for improvement',
    ];
}

async function recommendNextTrainingPhase(session) {
    return 'advanced-phase-001';
}

async function getUserTaskHistory(userId, taskId) {
    return [
        { taskId: taskId, performance: 70 },
        { taskId: taskId, performance: 75 },
        { taskId: taskId, performance: 80 },
    ];
}

function handleError(res, error, message = 'An error occurred') {
    console.error(`${message}:`, {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        additionalInfo: error.additionalInfo || {},
    });
    res.status(500).json({
        error: message,
        message: error.message,
        timestamp: new Date().toISOString(),
    });
}

/* =====================================================
   WebSocket Setup for Advanced Routes (if needed)
===================================================== */
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
    });

    ws.on('error', (error) => {
        console.error('WebSocket Error:', error);
    });
});

/* =====================================================
   Final Combined Export
===================================================== */
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
