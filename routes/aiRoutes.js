// ==============================
// 🚀 AI & WebSocket Routes
// ==============================
const express = require('express');
const router = express.Router();
const WebSocket = require('ws');

// 🔹 Services & AI Modules - Import with try/catch for better error handling
let ServiceIntegrator, AIGuidanceSystem, aiGuidance, aiAssistant, aiCoachInstance, STELLA_AI;

try {
  ServiceIntegrator = require('../services/ServiceIntegrator');
} catch (e) {
  console.error("❌ Error importing ServiceIntegrator:", e.message);
  ServiceIntegrator = { 
    stopMonitoring: () => {}, 
    handleConnectionError: () => {} 
  };
}

try {
  AIGuidanceSystem = require('../services/AIGuidanceSystem');
} catch (e) {
  console.error("❌ Error importing AIGuidanceSystem:", e.message);
  AIGuidanceSystem = {};
}

try {
  aiGuidance = require('../services/aiGuidance');
} catch (e) {
  console.error("❌ Error importing aiGuidance:", e.message);
  aiGuidance = { getGuidanceData: async () => ({}) };
}

try {
  aiAssistant = require('../services/aiAssistant');
} catch (e) {
  console.error("❌ Error importing aiAssistant:", e.message);
  aiAssistant = {};
}

try {
  aiCoachInstance = require('../services/AISpaceCoach');
} catch (e) {
  console.error("❌ Error importing AISpaceCoach:", e.message);
  aiCoachInstance = { 
    generateCoachingSuggestions: async () => ({}),
    selectAIMode: async () => ({}),
    generateInitialGuidance: async () => ({})
  };
}

try {
  STELLA_AI = require('../services/STELLA_AI');
} catch (e) {
  console.error("❌ Error importing STELLA_AI:", e.message);
  STELLA_AI = {};
}

// 🔹 Middleware
const { authenticate } = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest'); 

// 🔹 Database Models
let Leaderboard, User, TrainingSession, Session;

try {
  Leaderboard = require('../models/Leaderboard');
} catch (e) {
  console.error("❌ Error importing Leaderboard model:", e.message);
  Leaderboard = {};
}

try {
  User = require('../models/User');
} catch (e) {
  console.error("❌ Error importing User model:", e.message);
  User = {};
}

try {
  TrainingSession = require('../models/TrainingSession');
} catch (e) {
  console.error("❌ Error importing TrainingSession model:", e.message);
  TrainingSession = {};
}

try {
  Session = require('../models/Session');
} catch (e) {
  console.error("❌ Error importing Session model:", e.message);
  Session = {};
}

// 🔹 Controllers
let aiController;

try {
  aiController = require('../controllers/AIController');
} catch (e) {
  console.error("❌ Error importing AIController:", e.message);
  aiController = { 
    renderAIGuidance: (req, res) => res.json({ message: "AI Guidance rendering not available" }),
    launchAIGuidedTraining: (req, res) => res.json({ message: "AI Guided Training not available" }),
    generateTrainingContent: async () => ({})
  };
}

// 🔹 Utility Imports
const { ObjectId } = require('mongodb');
let moduleLoader;

try {
  moduleLoader = require('../modules/moduleLoader').moduleLoader;
  console.log("✅ moduleLoader loaded successfully");
} catch (e) {
  console.error("❌ Error importing moduleLoader:", e.message);
  moduleLoader = { loadModule: async () => ({}), validateModulePrerequisites: async () => ({}) };
}

// ✅ WebSocket Setup
const wsServer = new WebSocket.Server({ noServer: true });
const clients = new Map(); // Store active WebSocket connections

// Handle WebSocket connections
wsServer.on('connection', (ws, req) => {
  const userId = req.userId;
  clients.set(userId, ws);

  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    timestamp: new Date().toISOString()
  }));

  ws.on('close', () => {
    clients.delete(userId);
    if (ServiceIntegrator && ServiceIntegrator.stopMonitoring) {
      ServiceIntegrator.stopMonitoring(userId);
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error);
    if (ServiceIntegrator && ServiceIntegrator.handleConnectionError) {
      ServiceIntegrator.handleConnectionError(userId, error);
    }
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
        let guidance = {};
        if (aiCoachInstance && aiCoachInstance.generateCoachingSuggestions) {
          guidance = await aiCoachInstance.generateCoachingSuggestions({
            userId,
            moduleId: data.moduleId,
            context: data.context
          });
        }
        
        ws.send(JSON.stringify({
          type: 'guidance',
          guidance
        }));
        break;
        
      // Handle other message types as needed
      default:
        ws.send(JSON.stringify({
          type: 'unknown_message_type',
          originalType: data.type
        }));
    }
  } catch (error) {
    console.error('❌ WebSocket Message Handler Error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: { message: 'Failed to process message', details: error.message }
    }));
  }
};

// WebSocket upgrade handler (to be used in app.js)
const upgradeConnection = (server) => {
  server.on('upgrade', async (request, socket, head) => {
    try {
      // In a real app, you'd authenticate the WebSocket connection
      const userId = 'anonymous'; // Simplified for now
      
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
// 🔹 CORE AI ROUTES - ESSENTIAL FUNCTIONALITY
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
    
    // Generate minimal guidance if service is unavailable
    let guidance = {
      message: 'Focus on your current training objectives.',
      actionItems: ['Complete current training module', 'Practice regularly'],
      priority: 'normal'
    };
    
    // Try to use AI services if available
    if (aiCoachInstance && aiCoachInstance.generateCoachingSuggestions) {
      try {
        const aiGuidance = await aiCoachInstance.generateCoachingSuggestions({
          userId,
          moduleId,
          context
        });
        
        if (aiGuidance) {
          guidance = {
            message: aiGuidance.message || aiGuidance.suggestion || guidance.message,
            actionItems: aiGuidance.recommendations || aiGuidance.actions || guidance.actionItems,
            priority: aiGuidance.priority || guidance.priority
          };
        }
      } catch (aiError) {
        console.error('Error generating AI guidance:', aiError);
        // Continue with default guidance
      }
    }
    
    // Return guidance
    res.json({
      success: true,
      guidance,
      sessionId: null // Would be set if session tracking is available
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

// AI Initialization endpoint
router.post('/initialize', authenticate, async (req, res) => {
  try {
    const { mode } = req.body;
    console.log('Initializing AI for user:', req.user?._id, 'Mode:', mode);

    let initResult = { mode: mode || 'full_guidance' };
    let guidance = { message: "AI assistance initialized. Ready to help with your training." };

    // Try to use AI coach if available
    if (aiCoachInstance && aiCoachInstance.selectAIMode) {
      try {
        initResult = await aiCoachInstance.selectAIMode({
          userId: req.user?._id,
          preferredMode: mode || 'full_guidance'
        });
      } catch (aiError) {
        console.error('Error initializing AI mode:', aiError);
      }
    }

    // Try to get initial guidance if method is available
    if (aiCoachInstance && aiCoachInstance.generateInitialGuidance) {
      try {
        const aiGuidance = await aiCoachInstance.generateInitialGuidance(req.user?._id);
        if (aiGuidance) {
          guidance = aiGuidance;
        }
      } catch (guidanceError) {
        console.error('Error generating initial guidance:', guidanceError);
      }
    }

    res.json({
      success: true,
      aiMode: initResult,
      guidance
    });

  } catch (err) {
    console.error("❌ Failed to initialize AI:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to initialize AI systems", 
      details: err.message 
    });
  }
});

// ==============================
// 🔹 SIMPLE FALLBACK ROUTES
// ==============================

// Ask AI a question - simple version
router.post('/ai/ask', authenticate, async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Missing question'
      });
    }
    
    // Default response if AI services are unavailable
    let answer = "I'm here to help with your space training. Please be more specific with your question.";
    
    res.json({
      success: true,
      answer,
      source: 'AI Assistant'
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

// Process AI requests - simple placeholder
router.post('/ai/process', (req, res) => { 
  res.json({ 
    success: true,
    message: "AI request processed successfully" 
  });
});

// Simple AI guidance endpoint
router.post('/ai-guidance', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      suggestions: [
        "Follow the training protocol carefully",
        "Take breaks as needed",
        "Stay hydrated during physical exercises"
      ]
    });
  } catch (error) {
    console.error("❌ AI Guidance Error:", error);
    res.status(500).json({ 
      success: false,
      error: "Failed to generate AI guidance", 
      message: error.message 
    });
  }
});

// Export router and upgradeConnection function
module.exports = router;
module.exports.upgradeConnection = upgradeConnection;