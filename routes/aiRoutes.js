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
const STELLA_AI = require('../services/STELLA_AI');

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
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(userId, data, ws);
    } catch (error) {
      console.error('❌ WebSocket Message Parse Error:', error);
    }
  });
});

// Handle WebSocket messages
const handleWebSocketMessage = async (userId, data, ws) => {
  try {
    switch (data.type) {
      case 'request_guidance':
        const guidance = await aiCoachInstance.generateCoachingSuggestions({
          userId,
          moduleId: data.moduleId,
          context: data.context
        });
        
        ws.send(JSON.stringify({
          type: 'guidance',
          guidance
        }));
        break;
        
      case 'track_progress':
        const progressResult = await trackProgress(userId, data.progressData);
        
        ws.send(JSON.stringify({
          type: 'progress_update',
          progress: progressResult
        }));
        break;
      
      // Handle other message types as needed
    }
  } catch (error) {
    console.error('❌ WebSocket Message Handler Error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: { message: 'Failed to process message', details: error.message }
    }));
  }
};

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
// 🔹 NEW AIHANDLER INTEGRATION ROUTES
// ==============================

// Get AI guidance for module
router.post('/ai/guidance', authenticate, async (req, res) => {
  try {
    const { userId, moduleId, moduleType, context = {} } = req.body;
    
    // Validate request
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing userId parameter'
      });
    }
    
    // Create context for STELLA_AI
    const userContext = {
      moduleId,
      moduleType: moduleType || context.moduleType || getModuleTypeFromId(moduleId),
      context
    };
    
    // Generate guidance using STELLA_AI or AISpaceCoach
    let guidance;
    
    if (moduleType === 'physical' || context.trainingType === 'space') {
      // Use STELLA_AI for space/physical training
      guidance = await generateSpaceTrainingGuidance(userContext);
    } else {
      // Use AISpaceCoach for other training types
      guidance = await aiCoachInstance.generateCoachingSuggestions({
        userId,
        moduleId,
        context
      });
      
      // Format as needed
      guidance = {
        message: guidance.message || guidance.suggestion || 'Focus on your current training objectives.',
        actionItems: guidance.recommendations || guidance.actions || [],
        priority: guidance.priority || 'normal'
      };
    }
    
    // Store guidance for this session
    const session = await TrainingSession.findOneAndUpdate(
      { userId, status: 'in-progress' },
      { 
        $push: { 
          'aiGuidance.history': {
            timestamp: new Date(),
            guidance,
            context
          }
        }
      },
      { new: true }
    );
    
    // Return guidance
    res.json({
      success: true,
      guidance,
      sessionId: session?._id
    });
    
  } catch (error) {
    console.error('❌ Error generating guidance:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate guidance',
      message: error.message
    });
  }
});

// Track progress for the AIHandler
router.post('/progress/track', authenticate, async (req, res) => {
  try {
    const { userId, moduleId, moduleType, type, ...progressData } = req.body;
    
    if (!userId || !moduleId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Get session or create one
    let session = await TrainingSession.findOne({
      userId,
      moduleId,
      status: 'in-progress'
    });
    
    if (!session) {
      session = new TrainingSession({
        userId,
        moduleId,
        moduleType: moduleType || getModuleTypeFromId(moduleId),
        status: 'in-progress',
        startedAt: new Date()
      });
    }
    
    // Update progress based on type
    switch (type) {
      case 'MODULE_COMPLETION':
        session.status = 'completed';
        session.completedAt = new Date();
        session.progress = 100;
        
        // Calculate metrics
        if (progressData.performanceData) {
          session.metrics = {
            ...session.metrics,
            ...progressData.performanceData
          };
        }
        break;
        
      case 'EXERCISE_COMPLETION':
        // Add to completed exercises
        if (!session.completedExercises) {
          session.completedExercises = [];
        }
        
        session.completedExercises.push({
          exerciseId: progressData.exerciseId,
          completedAt: new Date(),
          score: progressData.score || 100,
          timeSpent: progressData.timeSpent || 0
        });
        
        // Update progress percentage based on exercises completed
        const requiredExercises = 3; // This should come from module data
        const exercisesCompleted = session.completedExercises.length;
        session.progress = Math.min(Math.round((exercisesCompleted / requiredExercises) * 100), 100);
        break;
        
      case 'EXERCISE_ACTIVITY':
        // Update metrics
        session.metrics = {
          ...session.metrics,
          ...progressData.metrics
        };
        break;
        
      case 'ASSESSMENT_COMPLETION':
        // Handle assessment completion
        if (!session.completedAssessments) {
          session.completedAssessments = [];
        }
        
        session.completedAssessments.push({
          assessmentId: progressData.assessmentId,
          completedAt: new Date(),
          score: progressData.score || 100
        });
        break;
    }
    
    // Save session
    await session.save();
    
    // Check for achievements
    const achievements = await checkAchievements(userId, {
      type,
      moduleId,
      moduleType: session.moduleType,
      ...progressData
    });
    
    // Calculate credits
    const credits = await calculateCredits(userId, type, progressData);
    
    // Notify via WebSocket if available
    const ws = clients.get(userId);
    if (ws) {
      ws.send(JSON.stringify({
        type: 'progress_update',
        progress: {
          moduleId,
          percentage: session.progress,
          metrics: session.metrics
        },
        achievements,
        credits
      }));
      
      // Send achievement notifications individually
      if (achievements && achievements.length > 0) {
        achievements.forEach(achievement => {
          ws.send(JSON.stringify({
            type: 'achievement_unlocked',
            achievement
          }));
        });
      }
    }
    
    res.json({
      success: true,
      progress: {
        moduleId,
        percentage: session.progress,
        metrics: session.metrics
      },
      achievements,
      credits
    });
    
  } catch (error) {
    console.error('❌ Error tracking progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to track progress',
      message: error.message
    });
  }
});

// Session tracking endpoints
router.post('/ai/session/start', authenticate, async (req, res) => {
  try {
    const { userId, sessionId, moduleId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Create session record
    const session = await TrainingSession.findOneAndUpdate(
      {
        userId,
        sessionId,
        moduleId
      },
      {
        $set: {
          startedAt: new Date(),
          status: 'active',
          lastActivity: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      sessionId: session._id,
      startedAt: session.startedAt
    });
    
  } catch (error) {
    console.error('❌ Error starting session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start session',
      message: error.message
    });
  }
});

router.post('/ai/session/end', authenticate, async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Find and update session
    const session = await TrainingSession.findOneAndUpdate(
      {
        userId,
        sessionId,
        status: 'active'
      },
      {
        $set: {
          status: 'completed',
          endedAt: new Date(),
          duration: function() {
            return (this.endedAt - this.startedAt) / 1000; // in seconds
          }
        }
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session._id,
        duration: session.duration || 0,
        status: session.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error ending session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end session',
      message: error.message
    });
  }
});

// Add pause/resume endpoints
router.post('/ai/session/pause', authenticate, async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const session = await TrainingSession.findOneAndUpdate(
      {
        userId,
        sessionId,
        status: 'active'
      },
      {
        $set: {
          status: 'paused',
          pausedAt: new Date(),
          lastActivity: new Date()
        }
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Active session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session._id,
        status: session.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error pausing session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to pause session',
      message: error.message
    });
  }
});

router.post('/ai/session/resume', authenticate, async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    const session = await TrainingSession.findOneAndUpdate(
      {
        userId,
        sessionId,
        status: 'paused'
      },
      {
        $set: {
          status: 'active',
          lastActivity: new Date()
        }
      },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Paused session not found'
      });
    }
    
    res.json({
      success: true,
      session: {
        id: session._id,
        status: session.status
      }
    });
    
  } catch (error) {
    console.error('❌ Error resuming session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resume session',
      message: error.message
    });
  }
});

// Ask AI a question
router.post('/ai/ask', authenticate, async (req, res) => {
  try {
    const { userId, question, context = {} } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters'
      });
    }
    
    // Use STELLA_AI if available
    let answer;
    
    if (context.moduleType === 'physical' || context.trainingType === 'space') {
      // Use STELLA_AI for space/physical training questions
      try {
        if (STELLA_AI && STELLA_AI.openai) {
          const response = await STELLA_AI.openai.chat.completions.create({
            model: STELLA_AI.config.model,
            messages: [
              {
                role: "system",
                content: `You are STELLA, the Space Training Enhancement and Learning Logic Assistant. 
                        You help astronaut trainees with their space training questions.
                        You have the personality traits: ${STELLA_AI.aiPersonality.traits.join(', ')}.
                        You have experience as a ${STELLA_AI.aiPersonality.experienceLevel}.
                        Your specialties include: ${STELLA_AI.aiPersonality.specialties.join(', ')}.
                        Provide helpful, encouraging, and knowledgeable responses about space training.`
              },
              {
                role: "user",
                content: question
              }
            ],
            temperature: 0.7
          });
          
          answer = response.choices[0]?.message?.content;
        }
      } catch (aiError) {
        console.error('❌ Error with STELLA_AI:', aiError);
        // Fall back to AISpaceCoach
      }
    }
    
    // If no answer yet, use AISpaceCoach
    if (!answer) {
      const aiResponse = await aiCoachInstance.processUserQuestion(userId, question, context);
      answer = aiResponse.answer || aiResponse.response || 
        'I need more information to address your question properly. Could you provide more context?';
    }
    
    // Store question and answer
    await TrainingSession.findOneAndUpdate(
      { userId, status: { $in: ['active', 'in-progress'] } },
      {
        $push: {
          aiInteractions: {
            timestamp: new Date(),
            question,
            answer,
            context
          }
        }
      }
    );
    
    res.json({
      success: true,
      answer,
      userId
    });
    
  } catch (error) {
    console.error('❌ Error processing question:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process question',
      fallbackAnswer: "I'm having trouble processing your question right now. Please try again later."
    });
  }
});

// ==============================
// 🔹 HELPER FUNCTIONS
// ==============================

// Helper function to get module type from ID
function getModuleTypeFromId(moduleId) {
  if (!moduleId) return null;
  
  if (moduleId.includes('phys')) return 'physical';
  if (moduleId.includes('tech')) return 'technical';
  if (moduleId.includes('sim')) return 'simulation';
  if (moduleId.includes('eva')) return 'eva';
  
  // Default to first segment of ID
  const parts = moduleId.split('-');
  return parts[0];
}

// Generate space training guidance
async function generateSpaceTrainingGuidance(context) {
  try {
    const { moduleId, moduleType, activity } = context;
    
    // Use STELLA_AI if available
    if (STELLA_AI) {
      // For different mission types, call specific analyzers from STELLA_AI
      let guidance;
      
      if (activity) {
        switch (activity) {
          case 'balance':
            // Sample session data for physical training
            const physicalSessionData = { metrics: { balance: 60, coreStability: 65, endurance: 70 } };
            const physicalAnalysis = await STELLA_AI.analyzeTraining(context.userId, physicalSessionData);
            guidance = {
              message: `Focus on your ${physicalAnalysis.weaknesses.join(', ')} during this physical training.`,
              actionItems: physicalAnalysis.suggestions,
              priority: physicalAnalysis.performanceScore < 60 ? 'high' : 'normal',
            };
            break;
            
          case 'endurance':
            // Sample session data for endurance training
            const enduranceSessionData = { metrics: { cardioEndurance: 65, recoveryRate: 60, heartRateStability: 70 } };
            const enduranceAnalysis = await STELLA_AI.analyzeEnduranceTraining(context.userId, enduranceSessionData);
            guidance = {
              message: `Your endurance training should focus on ${enduranceAnalysis.weaknesses.join(', ')}.`,
              actionItems: enduranceAnalysis.suggestions,
              priority: enduranceAnalysis.performanceScore < 60 ? 'high' : 'normal',
            };
            break;
            
          case 'eva':
            // Sample session data for EVA training
            const evaSessionData = { metrics: { suitManeuverability: 65, toolHandling: 60, spatialOrientation: 70, oxygenEfficiency: 75 } };
            const evaAnalysis = await STELLA_AI.analyzeEVATraining(context.userId, evaSessionData);
            guidance = {
              message: `Your EVA readiness is: ${evaAnalysis.evaReadiness}. Focus on ${evaAnalysis.weaknesses.join(', ')}.`,
              actionItems: evaAnalysis.suggestions,
              priority: evaAnalysis.performanceScore < 70 ? 'high' : 'normal',
            };
            break;
            
          default:
            // Default scenario generation
            const scenario = await STELLA_AI.generateSpaceScenario(context.userId);
            guidance = {
              message: `Mission scenario: ${scenario.situation}`,
              actionItems: scenario.criticalDecisions || [],
              priority: 'normal',
              scenario: scenario
            };
        }
      } 
      else if (moduleType === 'physical') {
        // Default physical training guidance
        guidance = {
          message: "Focus on maintaining proper form during all physical exercises. Quality is more important than quantity.",
          actionItems: [
            "Keep your core engaged throughout each exercise",
            "Pay attention to your breathing pattern",
            "Maintain proper alignment in each position"
          ],
          priority: "normal"
        };
      } 
      else {
        // General training guidance
        guidance = {
          message: "Follow the training protocol carefully and focus on mastering each skill before advancing.",
          actionItems: [
            "Take your time with new concepts",
            "Practice consistently for best results",
            "Ask questions when something is unclear"
          ],
          priority: "normal"
        };
      }
      
      return guidance;
    }
    
    // Fallback to generic guidance
    return {
      message: "Focus on your current training objectives and follow the instructions carefully.",
      actionItems: [
        "Pay attention to details",
        "Practice consistently",
        "Monitor your progress"
      ],
      priority: "normal"
    };
  } catch (error) {
    console.error('❌ Error generating space training guidance:', error);
    
    // Return fallback guidance
    return {
      message: "Continue with your training program and focus on the current exercise.",
      actionItems: [
        "Focus on proper technique",
        "Monitor your progress",
        "Follow the training schedule"
      ],
      priority: "normal"
    };
  }
}

// Check achievements when progress is tracked
async function checkAchievements(userId, progressData) {
  try {
    // Use AISpaceCoach to track achievements
    if (aiCoachInstance && typeof aiCoachInstance.trackAchievement === 'function') {
      // Determine achievement type based on progress data
      let achievementType;
      
      if (progressData.type === 'ASSESSMENT_COMPLETION' && progressData.score >= 90) {
        achievementType = 'ASSESSMENT_MASTER';
      } else if (progressData.type === 'MODULE_COMPLETION') {
        achievementType = 'QUICK_LEARNER';
        
        // Check for streak achievements
        const sessions = await TrainingSession.find({ 
          userId,
          status: 'completed',
          completedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
        });
        
        if (sessions.length >= 7) {
          // Also track streak achievement
          await aiCoachInstance.trackAchievement(userId, 'CONSISTENCY_KING');
        }
      }
      
      // Track the achievement if applicable
      if (achievementType) {
        const result = await aiCoachInstance.trackAchievement(userId, achievementType);
        return result ? [result.achievement] : [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    return [];
  }
}

// Calculate credits for actions
async function calculateCredits(userId, action, data) {
  try {
    if (aiCoachInstance && typeof aiCoachInstance.calculateCredits === 'function') {
      return await aiCoachInstance.calculateCredits(userId, action, data);
    }
    
    // Fallback credit calculation
    let creditsEarned = 0;
    switch (action) {
      case 'MODULE_COMPLETION':
        creditsEarned = 100;
        break;
      case 'EXERCISE_COMPLETION':
        creditsEarned = 25;
        break;
      case 'ASSESSMENT_COMPLETION':
        creditsEarned = 50;
        break;
      default:
        creditsEarned = 10;
    }
    
    return { 
      success: true, 
      creditsEarned,
      newCreditBalance: creditsEarned // This would normally accumulate
    };
  } catch (error) {
    console.error('❌ Error calculating credits:', error);
    return { success: false, error: error.message };
  }
}

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

router.post('/ai/process', (req, res) => { 
  res.json({ message: "AI request processed successfully" });
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
      moduleType: moduleType || moduleId.split('-')[0], // Extract type from moduleId if not provide
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

router.get('/modules', async (req, res) => {
  console.log("🚀 PHYSICAL MODULES ROUTE HIT!");
  res.json({ success: true, message: "Physical training modules loaded!" });
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
module.exports = router;


