// Console output optimizations
const consoleLogOriginal = console.log;
console.log = function() {
  // Completely block large data arrays and objects
  if (arguments.length > 0) {
    // Block arrays
    if (Array.isArray(arguments[0]) && arguments[0].length > 3) {
      return consoleLogOriginal(`[Array with ${arguments[0].length} items - hidden]`);
    }
    
    // Block large objects
    if (typeof arguments[0] === 'object' && !Array.isArray(arguments[0]) && arguments[0] !== null) {
      return consoleLogOriginal(`[Object with ${Object.keys(arguments[0]).length} keys - hidden]`);
    }
    
    // Block long strings
    if (typeof arguments[0] === 'string' && arguments[0].length > 300) {
      return consoleLogOriginal(`${arguments[0].substring(0, 50)}... [truncated]`);
    }
  }
  
  // Only allow through specific patterns
  if (arguments.length > 0 && typeof arguments[0] === 'string') {
    const message = arguments[0];
    if (message.startsWith('✅') || 
        message.startsWith('🔄') || 
        message.startsWith('🚀') || 
        message.startsWith('⚠️') || 
        message.startsWith('❌') ||
        message.includes('Connected') ||
        message.includes('initialized') ||
        message.includes('Server running')) {
      return consoleLogOriginal.apply(this, arguments);
    }
  }
  
  // Uncomment for debugging
  // return consoleLogOriginal.apply(this, arguments);
};

// Core dependencies
const dotenv = require('dotenv');
dotenv.config();
const http = require("http");
const path = require("path");
const fs = require('fs');
const WebSocket = require("ws");
const net = require("net");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const listEndpoints = require("express-list-endpoints");
const session = require("express-session");
const EventEmitter = require('events');
const User = require('./models/User');
const UserProgress = require("./models/UserProgress");
const cron = require('node-cron');
const dailyBriefingService = require('./services/dailyBriefingService');
const schedule = require('node-schedule');
const { getPhysicalTrainingProgress } = require('./services/progressServices');

// ============================
// 0. SESSION STORE SETUP
// ============================
class MemoryStore extends EventEmitter {
  constructor() {
    super();
    this.sessions = {};
  }

  get(sid, callback) {
    const data = this.sessions[sid];
    callback(null, data || null);
  }

  set(sid, session, callback) {
    this.sessions[sid] = session;
    if (callback) callback(null);
  }

  destroy(sid, callback) {
    delete this.sessions[sid];
    if (callback) callback(null);
  }

  clear(callback) {
    this.sessions = {};
    if (callback) callback(null);
  }

  length(callback) {
    const count = Object.keys(this.sessions).length;
    if (callback) callback(null, count);
  }

  all(callback) {
    const sessions = Object.entries(this.sessions).map(([sid, session]) => {
      return [sid, session];
    });
    if (callback) callback(null, sessions);
  }

  touch(sid, session, callback) {
    if (this.sessions[sid]) {
      this.sessions[sid] = session;
    }
    if (callback) callback(null);
  }
}

// ============================
// 1. MONGOOSE SETUP
// ============================
const mongoose = require("mongoose");

// Disable Mongoose debug mode to reduce console spam
mongoose.set('debug', false);

// Connect to MongoDB with reduced logging
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err.message));

// Add Schema.Types property to Schema constructor
mongoose.Schema.Types = mongoose.Schema.Types || {
  ObjectId: mongoose.Types.ObjectId,
  String: String,
  Number: Number,
  Boolean: Boolean,
  Date: Date,
  Mixed: mongoose.Schema.Types.Mixed || Object,
  Array: Array,
  Buffer: Buffer
};

// ============================
// 2. EXPRESS APP SETUP
// ============================
const app = express();
const server = http.createServer(app);

// ============================
// 3. MIDDLEWARE SETUP
// ============================
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'"]
    }
  }
}));
app.use(compression());
app.use(cookieParser());

// MIME type handling
app.use((req, res, next) => {
  if (req.path.endsWith('.js')) {
    res.type('application/javascript');
  } else if (req.path.endsWith('.css')) {
    res.type('text/css');
  }
  next();
});

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: { error: "Too many requests, please try again later." }
});
app.use("/api/", apiLimiter);

// Session setup
const sessionStore = new MemoryStore();
app.use(session({
    secret: process.env.SESSION_SECRET || "default_secret_key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: { 
      secure: process.env.NODE_ENV === "production", 
      httpOnly: true, 
      maxAge: 1000 * 60 * 60 * 24 * 7 
    }
}));

// ============================
// 4. SCHEDULED TASKS
// ============================
cron.schedule('0 5 * * *', async () => {
  console.log('Running scheduled daily briefing generation');
  try {
    const result = await dailyBriefingService.scheduleDailyBriefing();
    console.log('Completed daily briefing generation');
  } catch (error) {
    console.error('Error in scheduled briefing generation:', error.message);
  }
});

// ============================
// 5. ROUTE IMPORTS & SETUP
// ============================
console.log("🔄 Starting route setup...");

// Define empty objects for all routes
let authRoutes, userRoutes, creditRoutes, paymentRoutes, trainingRoutes, 
    leaderboardRoutes, countdownRoutes, progressRoutes, academyRoutes,
    socialPlatformRoutes, chatRoutes, stripeRoutes, stripeWebhookRoutes,
    subscriptionRoutes, aiRoutes, aiSocialRoutes, briefingRoutes,
    userRoutesAlt, assessmentRoutes, balanceRoutes, enduranceRoutes,
    flexibilityRoutes, stellaRoutes, strengthRoutes;

// Import routes with individual try-catch blocks
try { userRoutes = require("./routes/userRoutes"); } catch (e) { console.error("❌ userRoutes:", e.message); }
try { authRoutes = require("./routes/auth"); } catch (e) { console.error("❌ authRoutes:", e.message); }
try { creditRoutes = require("./routes/credits"); } catch (e) { console.error("❌ creditRoutes:", e.message); }
try { paymentRoutes = require("./routes/payment"); } catch (e) { console.error("❌ paymentRoutes:", e.message); }
try { trainingRoutes = require('./routes/training'); } catch (e) { console.error("❌ trainingRoutes:", e.message); }
try { leaderboardRoutes = require("./routes/leaderboard"); } catch (e) { console.error("❌ leaderboardRoutes:", e.message); }
try { countdownRoutes = require("./routes/countdown"); } catch (e) { console.error("❌ countdownRoutes:", e.message); }
try { progressRoutes = require("./routes/progress"); } catch (e) { console.error("❌ progressRoutes:", e.message); }
try { academyRoutes = require("./routes/academy"); } catch (e) { console.error("❌ academyRoutes:", e.message); }
try { socialPlatformRoutes = require("./routes/socialPlatform"); } catch (e) { console.error("❌ socialPlatformRoutes:", e.message); }
try { chatRoutes = require("./routes/chat"); } catch (e) { console.error("❌ chatRoutes:", e.message); }
try { stripeRoutes = require("./routes/stripe/index"); } catch (e) { console.error("❌ stripeRoutes:", e.message); }
try { stripeWebhookRoutes = require("./webhooks/stripe"); } catch (e) { console.error("❌ stripeWebhookRoutes:", e.message); }
try { subscriptionRoutes = require("./routes/subscription"); } catch (e) { console.error("❌ subscriptionRoutes:", e.message); }
try { aiRoutes = require("./routes/aiRoutes"); } catch (e) { console.error("❌ aiRoutes:", e.message); }
try { aiSocialRoutes = require("./routes/aiSocial"); } catch (e) { console.error("❌ aiSocialRoutes:", e.message); }
try { briefingRoutes = require('./routes/api/briefings'); } catch (e) { console.error("❌ briefingRoutes:", e.message); }
try { userRoutesAlt = require('./routes/user'); } catch (e) { console.error("❌ userRoutesAlt:", e.message); }
try { assessmentRoutes = require('./routes/assessments'); } catch (e) { console.error("❌ assessmentRoutes:", e.message); }
try { balanceRoutes = require('./routes/training/missions/balance.js'); } catch (e) { console.error("❌ balanceRoutes:", e.message); }
try { enduranceRoutes = require('./routes/training/missions/endurance.js'); } catch (e) { console.error("❌ enduranceRoutes:", e.message); }
try { flexibilityRoutes = require('./routes/training/missions/flexibility.js'); } catch (e) { console.error("❌ flexibilityRoutes:", e.message); }
try { strengthRoutes = require('./routes/training/missions/strength.js'); } catch (e) { console.error("❌ strengthRoutes:", e.message); }
try { stellaRoutes = require("./routes/api/stella-minimal"); } catch (e) { console.error("❌ stellaRoutes:", e.message); }

// ============================
// 6. DIRECT STELLA ROUTER SETUP
// ============================
// Create a direct stella router since the imported one isn't working
const stellaDirectRouter = express.Router();

// Simple STELLA endpoints
stellaDirectRouter.get('/test', (req, res) => {
  res.json({ message: "STELLA API is working" });
});

stellaDirectRouter.post('/initialize', (req, res) => {
  res.json({
    success: true,
    message: "STELLA initialized successfully",
    version: "1.0"
  });
});

stellaDirectRouter.post('/connect', (req, res) => {
  const { userId } = req.body;
  res.json({
    success: true,
    sessionId: `stella_${Date.now()}`,
    message: "Connected to STELLA"
  });
});

// New endpoint for assessment status
stellaDirectRouter.post('/assessment/status', (req, res) => {
  const { userId, assessmentType } = req.body;
  
  // Mock response - in production, you'd check a database
  res.json({
    success: true,
    completed: false,
    lastCompleted: null,
    nextAssessment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
});

// New endpoint for assessment completion
stellaDirectRouter.post('/assessment/complete', (req, res) => {
  const { userId, assessmentType, results } = req.body;
  
  // In production, you'd save this to a database
  console.log(`Assessment completed for user ${userId}, type: ${assessmentType}`);
  
  res.json({
    success: true,
    message: "Assessment recorded successfully",
    recommendations: [
      "Focus on core stability exercises",
      "Increase vestibular training frequency",
      "Add balance challenge progressions"
    ]
  });
});

// Mount the correct STELLA routes
if (stellaRoutes) {
  app.use("/api/stella", stellaRoutes);
  console.log("✅ STELLA routes mounted at /api/stella");
} else {
  // Use direct router if import fails
  app.use('/api/stella', stellaDirectRouter);
  console.log("✅ Direct STELLA routes mounted at /api/stella");
}

// Enhanced STELLA guidance endpoint with OpenAI integration
stellaDirectRouter.post('/guidance', async (req, res) => {
  try {
    const { userId, question } = req.body;
    
    if (!question) {
      return res.json({
        success: true,
        guidance: {
          message: "What would you like to know about your space training?",
          actionItems: ["Ask about modules", "Check your progress", "Get exercise guidance"]
        }
      });
    }
    
    // If OpenAI is configured, use it
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "MISSING_KEY") {
      try {
        const { OpenAI } = require("openai");
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        
        // Call OpenAI
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { 
              role: "system", 
              content: "You are STELLA, an AI assistant for space training on SharedStars. You help users prepare for space missions through guided training programs. Your name stands for Space Training Enhancement and Learning Logic Assistant. Respond in a helpful, encouraging tone. Format your response with a main message followed by 2-3 actionable suggestions."
            },
            { role: "user", content: question }
          ],
          max_tokens: 500,
          temperature: 0.7
        });
        
        // Extract the assistant's response
        const assistantResponse = response.choices[0].message.content;
        
        // Split into message and action items
        let message = assistantResponse;
        let actionItems = [];
        
        // Try to extract action items from bullet points
        const paragraphs = assistantResponse.split('\n\n');
        if (paragraphs.length > 1) {
          message = paragraphs[0];
          
          // Look for bullet points in remaining paragraphs
          for (let i = 1; i < paragraphs.length; i++) {
            const bulletPoints = paragraphs[i].split('\n').filter(line => 
              line.trim().startsWith('- ') || 
              line.trim().startsWith('* ')
            );
            
            if (bulletPoints.length > 0) {
              actionItems = bulletPoints.map(bp => 
                bp.trim().replace(/^[\-\*]\s+/, '')
              );
              break;
            }
          }
        }
        
        // If no action items found, use default
        if (actionItems.length === 0) {
          actionItems = [
            "Ask about specific training modules",
            "Check your progress dashboard",
            "Request personalized guidance"
          ];
        }
        
        return res.json({
          success: true,
          guidance: {
            message: message,
            actionItems: actionItems.slice(0, 3)
          }
        });
      } catch (openaiError) {
        console.error('Error with OpenAI API:', openaiError);
      }
    }
    
    // Fallback response if OpenAI fails or isn't configured
    return res.json({
      success: true,
      guidance: {
        message: `I'll help you with your space training. You asked: "${question}"`,
        actionItems: [
          "Check your current training modules",
          "Review your progress in the dashboard",
          "Complete your assessment to unlock personalized guidance"
        ]
      }
    });
  } catch (error) {
    console.error('Error handling guidance request:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get guidance',
      guidance: {
        message: "I'm having trouble with my systems right now. Please try again in a moment.",
        actionItems: ["Try refreshing the page", "Check your internet connection"]
      }
    });
  }
});

// ============================
// 7. TEST ROUTES
// ============================
// Simple test routes
app.get('/api/test-direct', (req, res) => {
  res.json({ message: 'Direct test route is working' });
});

const testRouter = express.Router();
testRouter.get('/test', (req, res) => {
  res.json({ message: 'Test router is working' });
});
app.use('/api/test-router', testRouter);

// ============================
// 8. ROUTES MOUNTING
// ============================
// Mount all imported routes
if (authRoutes) app.use("/api/auth", authRoutes);
if (creditRoutes) app.use("/api/credits", creditRoutes);
if (userRoutes) app.use("/api/users", userRoutes);
if (paymentRoutes) app.use("/api/payment", paymentRoutes);
if (trainingRoutes) app.use("/api/training", trainingRoutes);
if (leaderboardRoutes) app.use("/api/leaderboard", leaderboardRoutes);
if (countdownRoutes) app.use("/api/countdown", countdownRoutes);
if (progressRoutes) app.use("/api/progress", progressRoutes);
if (academyRoutes) app.use("/api/academy", academyRoutes);
if (socialPlatformRoutes) app.use("/api/social", socialPlatformRoutes);
if (chatRoutes) app.use("/api/chat", chatRoutes);
if (stripeRoutes) app.use("/api/stripe", stripeRoutes);
if (stripeWebhookRoutes) app.use("/webhook/stripe", stripeWebhookRoutes);
if (subscriptionRoutes) app.use("/api/subscription", subscriptionRoutes);
if (aiRoutes) app.use("/api/ai", aiRoutes);
if (aiSocialRoutes) app.use("/api/social/auth", aiSocialRoutes);
if (assessmentRoutes) app.use('/api/assessments', assessmentRoutes);
if (briefingRoutes) app.use('/api/briefings', briefingRoutes);
if (balanceRoutes) app.use('/training/physical/mission/balance', balanceRoutes);
if (enduranceRoutes) app.use('/training/physical/mission/endurance', enduranceRoutes);
if (flexibilityRoutes) app.use('/training/physical/mission/flexibility', flexibilityRoutes);
if (strengthRoutes) app.use('/training/physical/mission/strength', strengthRoutes);

// ============================
// 9. ADDITIONAL API ENDPOINTS
// ============================
// Physical training progress endpoint
app.get('/api/training/physical', async (req, res) => {
  try {
    const progress = await getPhysicalTrainingProgress(req.session.user?.id || 'anonymous');
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: "Failed to get physical training progress" });
  }
});

// Training progress data endpoint - resolves 404 errors with progressChart.js
app.post('/api/training/progress', (req, res) => {
  // Get userId from session or request body
  const userId = req.session.user?.id || req.body.userId || 'anonymous';
  
  // Mock data - in production, you'd get this from a database
  res.json({
    success: true,
    userId: userId,
    analysis: 'Your training is progressing well. Focus on completing the Core & Balance assessment to unlock all sessions.',
    moduleCompletion: {
      'Core & Balance': 40,
      'Endurance': 0,
      'Strength': 0,
      'Microgravity Coordination': 0
    },
    recommendations: [
      'Complete the Core & Balance assessment',
      'Practice vestibular adaptation exercises',
      'Focus on core stability in daily activities'
    ]
  });
});

// Assessment status endpoint
app.get('/api/assessment/status/:userId', (req, res) => {
  const { userId } = req.params;
  
  // Mock data - in production, you'd check this in a database
  res.json({
    success: true,
    userId: userId,
    assessments: {
      'mission-core-balance': false,
      'mission-endurance': false,
      'mission-strength': false
    },
    nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });
});

// Assessment completion endpoint
app.post('/api/assessment/complete', (req, res) => {
  const { userId, assessmentType, results } = req.body;
  
  // In production, you'd save this to a database
  console.log(`Assessment completed for user ${userId}, type: ${assessmentType}`);
  
  res.json({
    success: true,
    message: 'Assessment completed successfully',
    assessmentType: assessmentType,
    userId: userId,
    completionDate: new Date().toISOString(),
    progress: 40,
    nextSteps: [
      'Begin with Session 1 training exercises',
      'Review your personalized training plan',
      'Schedule your next assessment in 2 weeks'
    ]
  });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ status: req.session.user ? 'authenticated' : 'unauthenticated' });
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are available' });
});

// ============================
// 10. WEBSOCKET SETUP
// ============================
// Set up WebSocket server
const wsServer = new WebSocket.Server({ noServer: true });
const clients = new Map();

wsServer.on('connection', (ws, req) => {
  const userId = req.userId || 'anonymous';
  clients.set(userId, ws);
  
  ws.send(JSON.stringify({
    type: 'CONNECTION_ESTABLISHED',
    timestamp: new Date().toISOString()
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      // Handle websocket messages here
      ws.send(JSON.stringify({
        type: 'RECEIVED',
        data: data
      }));
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  ws.on('close', () => {
    clients.delete(userId);
  });
});

// Handle WebSocket upgrade
server.on('upgrade', (request, socket, head) => {
  // Simple middleware to authenticate WebSocket connections
  const userId = 'anonymous'; // In a real app, extract from request
  
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    request.userId = userId;
    wsServer.emit('connection', ws, request);
  });
});

// ============================
// 11. STATIC FILES
// ============================
app.use(express.static(path.join(__dirname, "public")));

// Serve the "bhavik-designing" folder inside public
app.use("/bhavik-styling", express.static(path.join(__dirname, "public", "bhavik-styling")));

const staticPages = [
    { route: "/", file: "index.html" },
    { route: "/about", file: "about.html" },
    { route: "/academy", file: "academy.html" },
    { route: "/leaderboard", file: "leaderboard.html" },
    { route: "/login", file: "login.html" },
    { route: "/signup", file: "signup.html" },
    { route: "/subscribe", file: "subscribe.html" },
    { route: "/training", file: "training.html" },
    { route: "/physicalTraining", file: "physicalTraining.html" },
    { route: "/trainingHub", file: "trainingHub.html" },
    { route: "/mission-control", file: "mission-control.html" },
    { route: "/reset-password", file: "reset-password.html" },
    { route: "/change-password", file: "change-password.html" },
    { route: "/congratulations", file: "congratulations.html" }
  ];

staticPages.forEach(({ route, file }) => {
    app.get(route, (req, res) => {
      res.sendFile(path.join(__dirname, "public", file), err => {
        if (err) {
          console.error(`Error sending file ${file}:`, err.message);
          res.status(404).send('File not found');
        }
      });
    });
});

// ✅ New: Serve pages inside "bhavik-designing/html"
// app.get("/bhavik-styling/:page", (req, res) => {
//   const file = req.params.page;
//   res.sendFile(path.join(__dirname, "public", "bhavik-styling", "html", file), (err) => {
//       if (err) {
//           console.error(`Error sending file ${file}:`, err.message);
//           res.status(404).send("File not found");
//       }
//   });
// });

// ============================
// 12. ERROR HANDLING
// ============================
// Error logging endpoint
app.post('/api/errors/log', (req, res) => {
  console.error('Client-side error:', req.body);
  res.status(200).json({ status: 'error logged' });
});

// 404 handler
app.use((req, res, next) => {
  console.log(`⚠️ 404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ error: "Not Found", path: req.originalUrl });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(500).json({ error: "Internal Server Error", message: err.message });
});
// ============================
// 13. SERVER STARTUP
// ============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ STELLA AI integrated with OpenAI GPT-4o`);
});

// Export app and server for testing
module.exports = { app, server };