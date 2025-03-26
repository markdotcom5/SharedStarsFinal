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

// ============================
// CORE DEPENDENCIES
// ============================
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
const stellaAnalyticsRoutes = require('./routes/admin/stellaAnalytics');
const { v4: uuidv4 } = require('uuid');
const signupRouter = require('./routes/signup');
const translationsRoutes = require('./routes/translations');

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
mongoose.set('autoIndex', false);

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
app.use(cors({
  origin: ['http://localhost', 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "data:", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:"],
      frameSrc: ["'self'", "https://www.sora.com"],
      childSrc: ["'self'", "https://www.sora.com"]
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
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net"
  );
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
// 5. SCHEDULED TASKS
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
// 6. ROUTE IMPORTS & SETUP
// ============================
console.log("🔄 Starting route setup...");

// Import admin routes with error handling
let applicationAdminRoutes, adminAuthRoutes, applicationRoutes;

// Helper function for safer route imports
const safeRequire = (path, routeName) => {
  try {
    const route = require(path);
    console.log(`✅ ${routeName} loaded`);
    return route;
  } catch (e) {
    console.error(`❌ ${routeName}: ${e.message}`);
    return null;
  }
};

// Admin routes
applicationRoutes = safeRequire('./routes/api/applications', 'Application routes');
applicationAdminRoutes = safeRequire('./routes/admin/applications', 'Admin application routes');
adminAuthRoutes = safeRequire('./routes/admin/auth', 'Admin auth routes');

// Define empty objects for all routes
let authRoutes, userRoutes, creditRoutes, paymentRoutes, trainingRoutes, 
    leaderboardRoutes, countdownRoutes, progressRoutes, academyRoutes,
    socialPlatformRoutes, chatRoutes, stripeRoutes, stripeWebhookRoutes,
    subscriptionRoutes, aiRoutes, aiSocialRoutes, briefingRoutes,
    userRoutesAlt, assessmentRoutes, balanceRoutes, enduranceRoutes,
    flexibilityRoutes, stellaRoutes, strengthRoutes, applicationsRoutes;

// Import routes with individual try-catch blocks
userRoutes = safeRequire("./routes/userRoutes", "userRoutes");
authRoutes = safeRequire("./routes/auth", "authRoutes");
creditRoutes = safeRequire("./routes/credits", "creditRoutes");
paymentRoutes = safeRequire("./routes/payment", "paymentRoutes");
trainingRoutes = safeRequire('./routes/training', "trainingRoutes");
leaderboardRoutes = safeRequire("./routes/leaderboard", "leaderboardRoutes");
countdownRoutes = safeRequire("./routes/countdown", "countdownRoutes");
progressRoutes = safeRequire("./routes/progress", "progressRoutes");
academyRoutes = safeRequire("./routes/academy", "academyRoutes");
socialPlatformRoutes = safeRequire("./routes/socialPlatform", "socialPlatformRoutes");
chatRoutes = safeRequire("./routes/chat", "chatRoutes");
stripeRoutes = safeRequire("./routes/stripe/index", "stripeRoutes");
stripeWebhookRoutes = safeRequire("./webhooks/stripe", "stripeWebhookRoutes");
subscriptionRoutes = safeRequire("./routes/subscription", "subscriptionRoutes");
aiRoutes = safeRequire("./routes/aiRoutes", "aiRoutes");
aiSocialRoutes = safeRequire("./routes/aiSocial", "aiSocialRoutes");
briefingRoutes = safeRequire('./routes/api/briefings', "briefingRoutes");
userRoutesAlt = safeRequire('./routes/user', "userRoutesAlt");
assessmentRoutes = safeRequire('./routes/assessments', "assessmentRoutes");
balanceRoutes = safeRequire('./routes/training/missions/balance.js', "balanceRoutes");
enduranceRoutes = safeRequire('./routes/training/missions/endurance.js', "enduranceRoutes");
flexibilityRoutes = safeRequire('./routes/training/missions/flexibility.js', "flexibilityRoutes");
strengthRoutes = safeRequire('./routes/training/missions/strength.js', "strengthRoutes");
stellaRoutes = safeRequire("./routes/api/stella-minimal", "stellaRoutes");
applicationsRoutes = safeRequire("./routes/api/applications", "applicationsRoutes");
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
if (applicationsRoutes) app.use("/api/applications", applicationsRoutes);
// Mount STELLA routes
if (stellaRoutes) {
  app.use("/api/stella", stellaRoutes);
  console.log("✅ STELLA routes mounted at /api/stella");
} else {
  console.error("❌ STELLA routes failed to load - please check routes/api/stella-minimal.js");
}

if (applicationsRoutes) {
  app.use("/api/applications", applicationsRoutes);
  console.log("✅ Application routes mounted at /api/applications");
}

// Mount admin routes if they exist
if (typeof applicationAdminRoutes === 'function') {
  app.use('/api/admin/applications', applicationAdminRoutes);
  console.log("✅ Admin applications routes mounted");
}

if (typeof adminAuthRoutes === 'function') {
  app.use('/api/admin/auth', adminAuthRoutes);
  console.log("✅ Admin auth routes mounted");
}
app.use('/api/admin/stella-analytics', stellaAnalyticsRoutes)

app.use('/api/translations', translationsRoutes);

// Add this to your app.js to test email functionality
// Add this to your app.js to test email functionality
app.get('/api/test-email', async (req, res) => {
  try {
    const emailService = require('./services/emailService');
    const config = require('./config');  // Add this line to import config
    
    console.log('Testing email service with config:', {
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure,
      auth: {
        user: config.email.auth.user,
        // Don't log the password
      }
    });
    
    const result = await emailService.sendVerificationEmail(
      'test@example.com', 
      '123456', 
      'Test User'
    );
    
    res.json({ 
      success: true, 
      message: 'Email test initiated', 
      result: result 
    });
  } catch (error) {
    console.error('Email test failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});
// ============================
// BLOG FUNCTIONALITY
// ============================
console.log("🔄 Setting up blog functionality...");

// Ensure the data directory exists
const blogDataDir = path.join(__dirname, 'data');
if (!fs.existsSync(blogDataDir)) {
  fs.mkdirSync(blogDataDir, { recursive: true });
}

// Blog posts data file
const BLOG_DB_FILE = path.join(__dirname, 'data/blog-posts.json');

// Create the blog posts file if it doesn't exist
if (!fs.existsSync(BLOG_DB_FILE)) {
  fs.writeFileSync(BLOG_DB_FILE, JSON.stringify([]));
  console.log("✅ Blog data file created");
}

// Helper functions to read and write blog posts
function getBlogPosts() {
  try {
    const data = fs.readFileSync(BLOG_DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading blog posts:', error.message);
    return [];
  }
}

function saveBlogPosts(posts) {
  try {
    fs.writeFileSync(BLOG_DB_FILE, JSON.stringify(posts, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving blog posts:', error.message);
    return false;
  }
}

// Generate a slug from title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, '-');
}

// Blog API endpoints
app.post('/api/blog/posts', (req, res) => {
  try {
    const { title, category, content } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const posts = getBlogPosts();
    const slug = generateSlug(title);
    
    const newPost = {
      id: uuidv4(),
      title,
      slug,
      category: category || 'Featured',
      content,
      published: true,
      publishedDate: new Date().toISOString(),
      author: {
        name: 'Mark Sendo',
        title: 'SharedStars Founder',
        imageUrl: '/images/mark-sendo.png'
      }
    };
    
    posts.push(newPost);
    saveBlogPosts(posts);
    
    res.status(201).json(newPost);
    console.log(`✅ New blog post created: "${title}"`);
  } catch (error) {
    console.error('Error creating post:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blog/latest', (req, res) => {
  try {
    // Add a small delay to prevent rapid requests
    setTimeout(() => {
      const posts = getBlogPosts();
      // Sort by date descending and take the 3 most recent
      const latestPosts = posts
        .sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate))
        .slice(0, 3);
      
      res.json(latestPosts); // Changed from blogPosts to latestPosts
    }, 100);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

app.get('/api/blog/posts', (req, res) => {
  try {
    const posts = getBlogPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching all posts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/blog/posts/:id', (req, res) => {
  try {
    const posts = getBlogPosts();
    const post = posts.find(p => p.id === req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    res.json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.delete('/api/blog/posts/:id', (req, res) => {
  try {
    const posts = getBlogPosts();
    const postIndex = posts.findIndex(p => p.id === req.params.id);
    
    if (postIndex === -1) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    posts.splice(postIndex, 1);
    saveBlogPosts(posts);
    
    res.json({ message: 'Post deleted' });
    console.log(`✅ Blog post deleted: ID ${req.params.id}`);
  } catch (error) {
    console.error('Error deleting post:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

console.log("✅ Blog functionality setup complete");
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

// Auth status endpoint - fixed Copyapp typo
app.get('/api/auth/status', (req, res) => {
  res.json({ status: req.session.user ? 'authenticated' : 'unauthenticated' });
});

app.get('/api/auth/test', (req, res) => {
  res.json({ message: 'Auth routes are available' });
});
// Get all blog posts
app.get('/api/blog/posts', (req, res) => {
  try {
    const posts = getBlogPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error fetching all posts:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
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
const staticPages = [
 { route: "/", file: "index.html" },
 { route: "/about", file: "about.html" },
 { route: "/aboutus", file: "aboutus.html" },
 { route: "/academy", file: "academy.html" },
 { route: "/leaderboard", file: "leaderboard.html" },
 { route: "/login", file: "login.html" },
 { route: "/signup", file: "signup.html" },
 { route: "/subscribe", file: "subscribe.html" },
 { route: "/training", file: "training.html" },
 { route: "/physicalTraining", file: "physicalTraining.html" },
 { route: "/trainingHub", file: "trainingHub.html" },
 { route: "/mission-control", file: "mission-control.html" }
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

// ============================
// 12. ERROR HANDLING
// ============================
// Error logging endpoint
app.post('/api/errors/log', (req, res) => {
  console.error('Client-side error:', req.body);
  res.status(200).json({ status: 'error logged' });
});

// Direct application submission endpoint
app.post('/api/applications/submit', (req, res) => {
  try {
    console.log('Application submission received:', req.body);
    // Basic validation
    const { name, email, background, motivation } = req.body;
    if (!name || !email || !background || !motivation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    // Generate a temporary ID
    const applicationId = 'temp-' + Date.now();
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: applicationId
    });
  } catch (error) {
    console.error('Error in direct application endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing application'
    });
  }
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
// Replace the server startup section with this more flexible version
// ============================
// 13. SERVER STARTUP
// ============================
const PORT = process.env.PORT || 3000;

// Add graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Start server on port 3000 with fallback options
const startServer = () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ STELLA AI integrated with OpenAI GPT-4o`);
    }).on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️ Port ${PORT} is already in use.`);
        console.log(`ℹ️ Try using a different port with PORT=3001 npm start`);
        
        // In development with nodemon, we don't want to exit
        if (process.env.NODE_ENV !== 'production') {
          console.log(`⏳ Waiting for file changes before retrying...`);
          // Don't exit - let nodemon handle it
        } else {
          // In production, exit with error
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
      }
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    // Don't exit in development
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Start the server
startServer();

// Export app and server for testing
module.exports = { app, server };