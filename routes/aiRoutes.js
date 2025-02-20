// ==============================
// 🚀 AI & WebSocket Routes
// ==============================
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');

// 🔹 Services & AI Modules
const ServiceIntegrator = require('../services/ServiceIntegrator');
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const aiCoachInstance = require('../services/AISpaceCoach');

// 🔹 Middleware
const { authenticate } = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest'); 

// 🔹 Database Models
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const Session = require('../models/Session');
// 🔹 Controllers
const aiController = require('../controllers/AIController');

// 🔹 Utility Imports
const { ObjectId } = require('mongodb');  
const { moduleLoader } = require('../modules/moduleLoader');

// ✅ Debugging Log
console.log("moduleLoader:", moduleLoader); 

// ✅ Declare wsServer BEFORE using it
const wsServer = new WebSocket.Server({ noServer: true });
const clients = new Map(); // Store active WebSocket connections

// ✅ WebSocket Connection Handling (Keep this ONE instance)
wsServer.on('connection', (ws, req) => {
  const userId = req.userId;
  clients.set(userId, ws);

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    clients.delete(userId);
    ServiceIntegrator.stopMonitoring(userId);
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error);
    ServiceIntegrator.handleConnectionError(userId, error);
  });
});

// ✅ WebSocket Upgrade Handling
// ✅ WebSocket Upgrade Handling
const upgradeConnection = (server) => {
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
      console.error('❌ WebSocket Upgrade Error:', error);
      socket.destroy();
    }
  });
};
// ==============================
// 📡 AI Initialization Endpoint
// ==============================
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const { mode } = req.body;
    console.log('Initializing AI for user:', req.user._id, 'Mode:', mode);

    const initResult = await aiCoachInstance.selectAIMode({
      userId: req.user._id,
      preferredMode: mode || 'full_guidance'
    });

    const session = await TrainingSession.findOneAndUpdate(
      { userId: req.user._id, status: 'in-progress' },
      {
        $set: {
          'aiGuidance.enabled': true,
          'aiGuidance.mode': mode,
          'aiGuidance.lastInitialized': new Date()
        }
      },
      { new: true, upsert: true }
    );

    // 🔹 WebSocket Notification
    const ws = clients.get(req.user._id);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'AI_INITIALIZED',
        data: { mode, sessionId: session._id }
      }));
    }

    res.json({
      success: true,
      sessionId: session._id,
      aiMode: initResult,
      guidance: await aiCoachInstance.generateInitialGuidance(req.user._id)
    });

  } catch (err) {
    console.error("❌ Failed to initialize AI:", err);
    res.status(500).json({ error: "Failed to initialize AI systems", details: err.message });
  }
});

// ==============================
// 🎯 AI Guidance API Endpoint
// ==============================
router.post('/ai-guidance', authenticate, async (req, res) => {
  try {
    const { questionId, currentProgress, context } = req.body;
    const suggestions = await aiCoachInstance.generateCoachingSuggestions({
      questionId, currentProgress, context
    });

    res.json({ success: true, suggestions });

  } catch (error) {
    console.error("❌ Failed to generate AI guidance:", error);
    res.status(500).json({ error: "Failed to generate AI guidance", message: error.message });
  }
});

// ==============================
// 🎯 AI Controller Routes
// ==============================
router.get('/', aiController.renderAIGuidance);
router.post('/launch', aiController.launchAIGuidedTraining);


// ==============================
// 💰 Credit Calculation Endpoint
// ==============================
router.get('/calculate-credits/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const credits = await CreditSystem.calculateUserCredits(userId);
    
    res.json({ success: true, userId, credits });

  } catch (error) {
    console.error("❌ Credit Calculation Error:", error);
    res.status(500).json({ error: "Credit calculation failed", message: error.message });
  }
});

// ==============================
// 🏆 Achievement Tracking
// ==============================
router.get('/achievements/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const achievements = await AchievementSystem.getUserAchievements(userId);
    
    res.json({ success: true, userId, achievements });

  } catch (error) {
    console.error("❌ Achievement Retrieval Error:", error);
    res.status(500).json({ error: "Achievement retrieval failed", message: error.message });
  }
});

// ==============================
// 🎯 AI Controller Routes
// ==============================
router.get('/', aiController.renderAIGuidance);
router.post('/launch', aiController.launchAIGuidedTraining);


// ==============================
// 📚 Training Module Routes
// ==============================
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
      )
    });

  } catch (error) {
    console.error("❌ Module Loading Error:", error);
    res.status(500).json({ error: "Module retrieval failed", message: error.message });
  }
});

// ==============================
// 🎯 Start Training Module
// ==============================
router.post("/modules/:moduleId/start", authenticate, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const { moduleType } = req.body;
    
    // Validate moduleId format
    const modulePattern = /^(physical|technical|simulation)-\d{3}$/;
    if (!modulePattern.test(moduleId)) {
      console.warn('Invalid moduleId format:', moduleId);
      return res.status(400).json({ 
        error: "Invalid moduleId format",
        expectedFormat: "type-number (e.g., physical-001)"
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
        skillFactors: { physical: 0, technical: 0, mental: 0 }
      },
      metrics: { completionRate: 0, effectivenessScore: 0, overallRank: 0 }
    });

    await session.save();

    // Notify via WebSocket
    webSocketService.sendToUser(req.user._id, 'module_started', {
      moduleId,
      sessionId: session._id,
      moduleType: session.moduleType
    });

    res.json({ 
      success: true, 
      message: `Module ${moduleId} started successfully`, 
      session 
    });

  } catch (error) {
    console.error("❌ Module Start Error:", error);
    res.status(500).json({ 
      error: "Module start failed",
      details: error.message 
    });
  }
});

// ==============================
// 📊 Task-Specific Progress Tracking
// ==============================
router.post('/training/modules/:moduleId/task/:taskId', authenticate, async (req, res) => {
  try {
    console.log('Updating task progress...');
    console.log('User ID:', req.user._id, 'Module ID:', req.params.moduleId, 'Task ID:', req.params.taskId);

    // Find active session
    const session = await TrainingSession.findOne({
      userId: req.user._id,
      moduleId: req.params.moduleId,
      status: 'in-progress'
    });

    if (!session) {
      return res.status(404).json({ 
        error: 'No active session found',
        message: 'Please start a training session first'
      });
    }

    // Update task progress
    const taskUpdate = {
      taskId: req.params.taskId,
      completedAt: new Date(),
      ...req.body
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
      sessionId: session._id
    });

  } catch (error) {
    console.error('❌ Task Progress Update Error:', error);
    res.status(500).json({
      error: 'Task progress update failed',
      details: error.message
    });
  }
});
// ==============================
// 📊 Real-Time Performance Metrics
// ==============================
router.post('/training/modules/:moduleId/metrics', authenticate, async (req, res) => {
  try {
    const { metricType, value, context = {} } = req.body;

    // Validate metricType
    if (!metricType || typeof value !== 'number') {
      return res.status(400).json({ error: "Invalid metricType or value" });
    }

    // Update user training session metrics
    const updatedSession = await TrainingSession.findOneAndUpdate(
      {
        moduleId: req.params.moduleId, 
        userId: req.user._id,
        status: 'in-progress'
      },
      {
        $push: { [`metrics.${metricType}`]: { value, timestamp: new Date(), context } }
      },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "Active training session not found" });
    }

    // AI analysis of performance
    const analysis = await aiCoachInstance.analyzeMetrics(updatedSession.metrics);

    res.json({
      success: true,
      metrics: updatedSession.metrics,
      analysis,
      recommendations: analysis.recommendations || []
    });

  } catch (error) {
    console.error("❌ Metrics Update Error:", error);
    res.status(500).json({ error: "Failed to update training metrics", message: error.message });
  }
});

// ==============================
// 🏁 Module Checkpoint Assessment
// ==============================
router.post('/training/modules/:moduleId/checkpoint', authenticate, async (req, res) => {
  try {
    console.log("🚀 Debug: Checking session for checkpoint assessment");

    const session = await TrainingSession.findOne({
      moduleId: req.params.moduleId,
      userId: req.user._id,
      status: "in-progress"
    });

    if (!session) {
      return res.status(404).json({ error: "No active session found for checkpoint" });
    }

    // Perform assessment
    const checkpointResults = await performCheckpointAssessment(session);
    const adaptiveChanges = await updateAdaptiveDifficulty(session, checkpointResults);

    // Store checkpoint results
    session.checkpoints = session.checkpoints || [];
    session.checkpoints.push({ timestamp: new Date(), results: checkpointResults, adaptiveChanges });

    await session.save();

    res.json({
      success: true,
      checkpointResults,
      adaptiveChanges,
      recommendations: await generateCheckpointRecommendations(checkpointResults)
    });

  } catch (error) {
    console.error("❌ Checkpoint Assessment Error:", error);
    res.status(500).json({ error: "Checkpoint assessment failed", message: error.message });
  }
});

// ==============================
// 🚨 Emergency Response Training
// ==============================
router.post('/training/modules/:moduleId/emergency-scenario', authenticate, async (req, res) => {
  try {
    const { scenarioId } = req.body;

    const scenario = await generateEmergencyScenario({
      moduleId: req.params.moduleId,
      userId: req.user._id,
      scenarioId
    });

    const updatedSession = await TrainingSession.findOneAndUpdate(
      {
        moduleId: req.params.moduleId,
        userId: req.user._id,
        status: 'in-progress'
      },
      {
        $push: {
          emergencyScenarios: {
            scenarioId,
            startedAt: new Date(),
            difficulty: scenario.difficulty
          }
        }
      },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "No active training session found" });
    }

    res.json({
      success: true,
      scenario,
      timeLimit: scenario.timeLimit,
      objectives: scenario.objectives,
      initialConditions: scenario.initialConditions
    });

  } catch (error) {
    console.error("❌ Emergency Scenario Error:", error);
    res.status(500).json({ error: "Failed to generate emergency scenario", message: error.message });
  }
});

// ==============================
// 🤝 Team Coordination Training
// ==============================
router.post('/training/modules/:moduleId/team-exercise', authenticate, async (req, res) => {
  try {
    const { teamSize, role, difficulty } = req.body;

    if (!teamSize || !role || !difficulty) {
      return res.status(400).json({ error: "Missing required fields: teamSize, role, difficulty" });
    }

    const exercise = await generateTeamExercise({
      moduleId: req.params.moduleId,
      teamSize,
      role,
      difficulty
    });

    const updatedSession = await TrainingSession.findOneAndUpdate(
      {
        moduleId: req.params.moduleId,
        userId: req.user._id,
        status: 'in-progress'
      },
      {
        $push: {
          teamExercises: {
            exerciseId: exercise.id,
            startedAt: new Date(),
            role,
            teamSize
          }
        }
      },
      { new: true }
    );

    if (!updatedSession) {
      return res.status(404).json({ error: "No active training session found" });
    }

    res.json({
      success: true,
      exercise,
      roleInstructions: exercise.roleSpecificInstructions[role] || "No specific role instructions found",
      teamComposition: exercise.teamComposition,
      communicationProtocols: exercise.communicationProtocols
    });

  } catch (error) {
    console.error("❌ Team Exercise Error:", error);
    res.status(500).json({ error: "Failed to generate team exercise", message: error.message });
  }
});
// ==============================
// 📊 Performance Review and Feedback
// ==============================
router.post('/training/modules/:moduleId/review', authenticate, async (req, res) => {
  try {
    console.log("🚀 Debug: Fetching session for performance review");

    const session = await TrainingSession.findOne({
      moduleId: req.params.moduleId,
      userId: req.user._id,
      status: "in-progress"
    });

    if (!session) {
      return res.status(404).json({ error: "No active session found for review" });
    }

    const performanceReview = await generatePerformanceReview(session);
    const aiFeedback = await aiCoachInstance.generateDetailedFeedback(session);

    res.json({
      success: true,
      review: performanceReview,
      feedback: aiFeedback,
      improvements: await generateImprovementPlan(session),
      nextSteps: await recommendNextTrainingPhase(session)
    });

  } catch (error) {
    console.error("❌ Performance Review Error:", error);
    res.status(500).json({ error: "Performance review failed", message: error.message });
  }
});

// ==============================
// 📚 Get All Training Modules
// ==============================
router.get("/training/modules/list", authenticate, async (req, res) => {
  try {
    console.log("📡 Fetching training modules from MongoDB...");

    const modules = await Module.find();
    if (!modules.length) {
      return res.status(404).json({ error: "Module list not found" });
    }

    console.log("✅ Modules retrieved:", modules.length);
    res.json({ success: true, modules });

  } catch (error) {
    console.error("❌ Training Module Fetch Error:", error);
    res.status(500).json({ error: "Internal server error", message: error.message });
  }
});

// ==============================
// 🎯 Individual Training Module Details
// ==============================
const moduleData = {
  physical: {
    title: "Physical Training",
    description: "Prepare your body for space travel with focused physical training.",
    objectives: ["Cardiovascular fitness", "Strength training", "Zero-G adaptation"]
  },
  technical: {
    title: "Technical Training",
    description: "Develop essential technical skills for space operations.",
    objectives: ["System operations", "Emergency procedures", "Navigation"]
  }
};

router.get('/modules/:type', authenticate, async (req, res) => {
  try {
    const moduleType = req.params.type;
    if (!moduleData[moduleType]) {
      return res.status(400).json({ error: "Invalid module type" });
    }
    
    res.json({ success: true, data: moduleData[moduleType] });

  } catch (error) {
    console.error(`❌ Error fetching ${req.params.type} training data:`, error);
    res.status(500).json({ error: `Failed to fetch ${req.params.type} training data.` });
  }
});

// ==============================
// 🔹 AI Training & Guidance Routes
// ==============================
router.get('/modules/ai-guided', authenticate, async (req, res) => {
  try {
    const aiData = await aiGuidance.getGuidanceData();
    res.json({ success: true, data: aiData });

  } catch (error) {
    console.error("❌ AI-Guided Training Error:", error);
    res.status(500).json({ error: "Failed to fetch AI-guided training data." });
  }
});

// ==============================
// 🤖 AI Coaching & Guidance Views
// ==============================
const renderAIView = async (req, res, viewName, title) => {
  try {
    const guidanceData = await aiGuidance.getGuidanceData();
    res.render(viewName, { title, guidance: guidanceData });

  } catch (error) {
    console.error(`❌ Error rendering ${title} view:`, error);
    res.status(500).send(`Error rendering ${title} view.`);
  }
};

router.get('/guidance', async (req, res) => renderAIView(req, res, 'ai-guidance', 'AI Guidance'));
router.get('/ai-coaching', async (req, res) => renderAIView(req, res, 'ai-coaching', 'AI-Guided Coaching'));

// ==============================
// 🏆 AI Training Content & Recommendations
// ==============================
router.get('/ai-guidance', async (req, res) => {
  try {
    const guidanceData = await aiCoachInstance.generateCoachingSuggestions({
      userId: req.user?._id || null,
      currentProgress: req.query.currentProgress || 0,
      context: req.query.context || ""
    });

    res.json({ success: true, guidance: guidanceData });

  } catch (error) {
    console.error("❌ AI Guidance Generation Error:", error);
    res.status(500).json({ error: "Failed to generate AI guidance", message: error.message });
  }
});

// ==============================
// 📚 Training Content Generation
// ==============================
const fetchTrainingContent = async (req, res, viewMode = false) => {
  try {
    const contentResponse = await aiController.generateTrainingContent(req, res);

    if (viewMode) {
      res.render('training-content', {
        title: 'Training Content',
        module: req.params.module,
        content: contentResponse.content,
        difficulty: contentResponse.difficulty
      });
    } else {
      res.json({ success: true, content: contentResponse });
    }

  } catch (error) {
    console.error("❌ Training Content Error:", error);
    res.status(500).json({ error: "Failed to generate training content" });
  }
};

router.get('/training-content/:moduleType/:module', authenticate, async (req, res) => fetchTrainingContent(req, res));
router.get('/training-content/view/:moduleType/:module', async (req, res) => fetchTrainingContent(req, res, true));
// ==============================
// 📈 Update Training Module Progress
// ==============================
router.post('/training/modules/:moduleType/:moduleId/progress', authenticate, async (req, res) => {
  try {
    const { progress, completedTasks = [] } = req.body;

    // Find active training session
    const session = await TrainingSession.findOneAndUpdate(
      { 
        moduleId: req.params.moduleId,
        moduleType: req.params.moduleType,
        userId: req.user._id,
        status: 'in-progress'
      },
      {
        $set: {
          progress,
          lastUpdated: new Date(),
          'metrics.technicalProficiency': completedTasks.length * 33.33
        },
        $push: { completedTasks: { $each: completedTasks } }
      },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    // ✅ Ensure session ranking exists before updating
    if (!session.ranking) session.ranking = {};
    session.ranking.points = session.calculatePoints ? session.calculatePoints() : 0;
    
    await session.save();
    await TrainingSession.updateGlobalRanks();

    const nextMilestone = await calculateNextMilestone(session);

    res.json({
      success: true,
      currentProgress: progress,
      ranking: {
        globalRank: session.ranking.globalRank || 0,
        points: session.ranking.points || 0,
        level: session.ranking.level || 1
      },
      nextMilestone,
      achievements: session.achievements || []
    });

  } catch (error) {
    console.error("❌ Progress Update Error:", error);
    res.status(500).json({ error: "Failed to update progress", message: error.message });
  }
});

// ==============================
// 🔹 AI Initialization
// ==============================
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const { mode } = req.body;
    console.log('Initializing AI for user:', req.user._id, 'Mode:', mode);
  
    const initResult = await aiCoachInstance.selectAIMode({
      userId: req.user._id,
      preferredMode: mode || 'full_guidance'
    });

    const session = await TrainingSession.findOneAndUpdate(
      { userId: req.user._id, status: 'in-progress' },
      {
        $set: {
          'aiGuidance.enabled': true,
          'aiGuidance.mode': mode,
          'aiGuidance.lastInitialized': new Date()
        }
      },
      { new: true, upsert: true }
    );

    // ✅ Ensure WebSocket clients exist before sending messages
    if (clients.has(req.user._id)) {
      const ws = clients.get(req.user._id);
      if (ws) {
        ws.send(JSON.stringify({
          type: 'AI_INITIALIZED',
          data: { mode, sessionId: session._id }
        }));
      }
    }

    res.json({
      success: true,
      sessionId: session._id,
      aiMode: initResult,
      guidance: await aiCoachInstance.generateInitialGuidance(req.user._id)
    });

  } catch (error) {
    console.error("❌ AI Initialization Error:", error);
    res.status(500).json({ error: "Failed to initialize AI systems", message: error.message });
  }
});

// ==============================
// 🎯 AI Guidance Generation
// ==============================
router.post('/ai-guidance', async (req, res) => {
  try {
    const { questionId, currentProgress, context } = req.body;
    const suggestions = await aiCoachInstance.generateCoachingSuggestions({
      questionId,
      currentProgress,
      context
    });

    res.json({ success: true, suggestions });

  } catch (error) {
    console.error("❌ AI Guidance Generation Error:", error);
    res.status(500).json({ error: "Failed to generate AI guidance", message: error.message });
  }
});

// ✅ Final Export
module.exports = {
  router,
  upgradeConnection,
  wss: wsServer  // ✅ Ensure `wsServer` is properly defined
};  // ✅ Ensure this is the LAST LINE
