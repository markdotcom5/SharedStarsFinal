// routes/aiRoutes.js
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');
const ServiceIntegrator = require('../services/ServiceIntegrator');
const AIGuidanceSystem = require('../services/AIGuidanceSystem');
const AISpaceCoach = require('../services/AISpaceCoach');
const aiGuidance = require('../services/aiGuidance');
const aiAssistant = require('../services/aiAssistant');
const { authenticate } = require('../middleware/authenticate');
const Leaderboard = require('../models/Leaderboard');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const Session = require('../models/Session');
const validateRequest = require('../middleware/validateRequest');
const aiController = require('../controllers/aiController');

// Map to hold WebSocket clients
const clients = new Map();

// Helper function for module details
async function getModuleDetails(moduleId) {
  const modules = {
    'physical-001': {
      id: 'physical-001',
      name: 'Physical Training',
      description: 'Space readiness physical preparation',
      difficulty: 'beginner',
      duration: '4 weeks',
      prerequisites: [],
      objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation'],
      tasks: [
        { id: 'PT001', name: 'Basic Fitness Assessment', duration: '60 minutes' },
        { id: 'PT002', name: 'Strength Training Basics', duration: '90 minutes' },
        { id: 'PT003', name: 'Endurance Building', duration: '120 minutes' }
      ]
    }
  };

  return modules[moduleId] ?? null;
}

/* -------------------------------
   Training & Assessment Endpoints
---------------------------------*/

router.post('/training/start-assessment', 
  authenticate, 
  validateRequest('assessment.start'),
  async (req, res) => {
    try {
      console.log('Starting new assessment session...');
      
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
          startedAt: new Date()
        }
      });
  
      console.log('Getting initial assessment questions...');
      const assessmentQuestions = await AISpaceCoach.getInitialAssessment();
      
      await session.save();
      
      res.json({
        success: true,
        sessionId: session._id,
        questions: assessmentQuestions
      });
    } catch (error) {
      console.error('Error starting assessment:', error);
      res.status(500).json({ 
        error: 'Failed to start assessment',
        details: error.message 
      });
    }
});

router.post('/training/submit-answer', authenticate, async (req, res) => {
  console.log("Request body:", req.body);

  try {
    const { sessionId, question, answer } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!session.assessment) {
      session.assessment = { responses: [] };
    }
    if (!session.assessment.responses) {
      session.assessment.responses = [];
    }

    session.assessment.responses.push({
      question: question.toString(),
      answer: answer,
      timestamp: new Date(),
    });

    await session.save();

    res.json({
      success: true,
      progress: (session.assessment.responses.length / 5) * 100,
      nextQuestionIndex: session.assessment.responses.length + 1
    });

  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ 
      error: 'Failed to submit assessment answer',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.post('/training/assessment/:sessionId/complete', authenticate, async (req, res) => {
  try {
    const session = await TrainingSession.findOne({
      _id: req.params.sessionId,
      userId: req.user._id,
      status: 'in-progress'
    });
  
    if (!session) {
      return res.status(404).json({ error: 'Assessment session not found' });
    }
  
    const finalAnalysis = {
      score: calculateAssessmentScore(session.assessment.responses),
      metrics: {
        physical: calculatePhysicalScore(session.assessment.responses),
        mental: calculateMentalScore(session.assessment.responses),
        technical: calculateTechnicalScore(session.assessment.responses)
      },
      recommendations: {
        suggestedModules: generateSuggestedModules(session.assessment.responses),
        focusAreas: identifyFocusAreas(session.assessment.responses),
        nextSteps: generateNextSteps(session.assessment.responses)
      }
    };
    
    session.status = 'completed';
    session.assessment.completedAt = new Date();
    session.assessment.score = finalAnalysis.score;
    session.metrics = {
      physicalReadiness: finalAnalysis.metrics.physical,
      mentalPreparedness: finalAnalysis.metrics.mental,
      technicalProficiency: finalAnalysis.metrics.technical,
      overallScore: finalAnalysis.score
    };
    
    await session.save();
  
    res.json({
      success: true,
      sessionId: session._id,
      completedAt: session.assessment.completedAt,
      assessmentResults: {
        overall: {
          score: finalAnalysis.score,
          status: getAssessmentStatus(finalAnalysis.score),
          completionTime: calculateCompletionTime(session)
        },
        metrics: finalAnalysis.metrics,
        analysis: {
          strengths: identifyStrengths(session.assessment.responses),
          areasForImprovement: identifyWeaknesses(session.assessment.responses),
          recommendations: finalAnalysis.recommendations
        },
        nextSteps: {
          immediate: finalAnalysis.recommendations.nextSteps,
          suggestedModules: finalAnalysis.recommendations.suggestedModules,
          timeline: generateTrainingTimeline(finalAnalysis)
        }
      },
      certificateUrl: generateCertificateUrl(session._id)
    });
  } catch (error) {
    console.error('Error completing assessment:', error);
    handleError(res, error, 'Failed to complete assessment');
  }
});

/* -------------------------------
   AI & Guidance Endpoints
---------------------------------*/

// New endpoint: GET /api/ai/greeting
router.get('/greeting', async (req, res) => {
  try {
    // Use your AI controller's generateGreeting method.
    // If your method sends the response directly, you might simply call:
    await aiController.generateGreeting(req, res);
    // Alternatively, if it returns a greeting string, you can do:
    // const greeting = await aiController.generateGreeting(req, res);
    // res.json({ greeting });
  } catch (error) {
    console.error("Error generating greeting:", error);
    res.status(500).json({ greeting: "Welcome back, Commander. Let's resume our Mission!" });
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

// Generate Training Content for a Module
router.get('/training-content/:module', authenticate, async (req, res) => {
  try {
    await aiController.generateTrainingContent(req, res);
  } catch (error) {
    console.error('Error generating training content:', error);
    res.status(500).json({ error: 'Failed to generate training content' });
  }
});
router.get('/ai-guidance', async (req, res) => {
  try {
    // For example, generate guidance data or simply forward to the coaching route
    const guidanceData = await AISpaceCoach.generateCoachingSuggestions({
      userId: req.user?._id,
      currentProgress: req.query.currentProgress || 0,
      context: req.query.context || ""
    });
    res.json({ success: true, guidance: guidanceData });
  } catch (error) {
    handleError(res, error, 'Failed to generate AI guidance');
  }
});

// Alternative: Render Training Content view
router.get('/training-content/view/:module', async (req, res) => {
  try {
    const contentResponse = await aiController.generateTrainingContent(req, res);
    res.render('training-content', { 
      title: 'Training Content',
      module: req.params.module,
      content: contentResponse.content,
      difficulty: contentResponse.difficulty
    });
  } catch (error) {
    console.error('Error generating training content:', error);
    res.status(500).json({ error: 'Failed to generate training content' });
  }
});

/* -------------------------------
   Module Endpoints for Training
---------------------------------*/
router.get('/modules/physical', authenticate, async (req, res) => {
  try {
    const physicalData = {
      title: 'Physical Training',
      description: 'Prepare your body for space travel with focused physical training.',
      objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation']
    };
    res.json({ success: true, data: physicalData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch physical training data.' });
  }
});
  
router.get('/modules/technical', authenticate, async (req, res) => {
  try {
    const technicalData = {
      title: 'Technical Training',
      description: 'Develop essential technical skills for space operations.',
      objectives: ['System operations', 'Emergency procedures', 'Navigation']
    };
    res.json({ success: true, data: technicalData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch technical training data.' });
  }
});
  
router.get('/modules/ai-guided', authenticate, async (req, res) => {
  try {
    const aiData = await aiGuidance.getGuidanceData();
    res.json({ success: true, data: aiData });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch AI-guided training data.' });
  }
});
  
router.get('/training/modules', authenticate, async (req, res) => {
  try {
    const modules = [
      {
        id: 'physical-001',
        name: 'Physical Training',
        description: 'Space readiness physical preparation',
        difficulty: 'beginner',
        duration: '4 weeks',
        prerequisites: [],
        objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation']
      },
      {
        id: 'technical-001',
        name: 'Technical Skills',
        description: 'Essential space operations training',
        difficulty: 'intermediate',
        duration: '6 weeks',
        prerequisites: ['physical-001'],
        objectives: ['System operations', 'Emergency procedures', 'Navigation']
      },
      {
        id: 'simulation-001',
        name: 'Space Simulation',
        description: 'Practical space mission simulation',
        difficulty: 'advanced',
        duration: '8 weeks',
        prerequisites: ['physical-001', 'technical-001'],
        objectives: ['Mission planning', 'Team coordination', 'Crisis management']
      }
    ];
  
    res.json({
      success: true,
      modules,
      userProgress: await calculateUserProgress(req.user._id)
    });
  } catch (error) {
    handleError(res, error, 'Failed to fetch training modules');
  }
});
  
router.post('/training/modules/:moduleId/start', authenticate, async (req, res) => {
  try {
    const { moduleId } = req.params;
    const session = new TrainingSession({
      userId: req.user._id,
      sessionType: 'Training',
      moduleId,
      dateTime: new Date(),
      status: 'in-progress',
      progress: 0,
      metrics: {
        physicalReadiness: 0,
        mentalPreparedness: 0,
        technicalProficiency: 0,
        overallScore: 0
      }
    });
  
    await session.save();
  
    res.json({
      success: true,
      sessionId: session._id,
      module: await getModuleDetails(moduleId),
      initialGuidance: await AISpaceCoach.generateInitialGuidance(req.user._id)
    });
  } catch (error) {
    handleError(res, error, 'Failed to start training module');
  }
});
  
router.post('/training/modules/:moduleId/progress', authenticate, async (req, res) => {
  try {
    const { progress, completedTasks } = req.body;
    const session = await TrainingSession.findOneAndUpdate(
      { 
        moduleId: req.params.moduleId,
        userId: req.user._id,
        status: 'in-progress'
      },
      {
        $set: {
          progress,
          'metrics.technicalProficiency': completedTasks.length * 33.33,
          lastUpdated: new Date()
        },
        $push: {
          completedTasks: { $each: completedTasks }
        }
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
        level: session.ranking.level
      },
      nextMilestone,
      achievements: session.achievements
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
  
    const initResult = await AISpaceCoach.selectAIMode({
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
      guidance: await AISpaceCoach.generateInitialGuidance(req.user._id)
    });
  } catch (err) {
    handleError(res, err, 'Failed to initialize AI systems');
  }
});
  
router.post('/ai-guidance', authenticate, async (req, res) => {
  try {
    const { questionId, currentProgress, context } = req.body;
    
    const guidance = await AISpaceCoach.generateCoachingSuggestions({
      userId: req.user._id,
      questionId,
      currentProgress,
      context
    });
  
    await TrainingSession.findOneAndUpdate(
      { userId: req.user._id, status: 'in-progress' },
      {
        $push: {
          aiInteractions: {
            type: 'guidance',
            content: {
              prompt: questionId,
              response: guidance
            }
          }
        }
      }
    );
  
    res.json({
      success: true,
      guidance
    });
  } catch (err) {
    handleError(res, err, 'Failed to generate AI guidance');
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
  
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    timestamp: new Date().toISOString()
  }));
  
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
// Enhanced error handling helper
// -------------------------------
function handleError(res, error, message = 'An error occurred') {
  console.error(`${message}:`, {
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    additionalInfo: error.additionalInfo || {}
  });
  res.status(500).json({
    error: message,
    message: error.message,
    timestamp: new Date().toISOString()
  });
}

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
  if (!session.assessment.startedAt) {
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
    month1: 'Start Advanced Modules'
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
  wss: wsServer
};
