// ============================
// 1. ENV & REQUIRED MODULES
// ============================
require("dotenv").config();
console.log("✅ JWT_SECRET:", process.env.JWT_SECRET);

const express = require("express");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const http = require("http");
const compression = require("compression");
const MongoStore = require("connect-mongo");
const modulesRouter = require('./routes/modules');
const WebSocket = require("ws");
const { authenticateWebSocket } = require("./middleware/authenticate");
const chatRoutes = require("./routes/chat");

// ============================
// 2. EXPRESS APP & HTTP SERVER
// ============================
const app = express();
const server = http.createServer(app);

// ============================
// 3. WEBSOCKET SETUP
// ============================
const wss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        // ✅ Move authentication inside the connection
        const authData = authenticateWebSocket(request);

        if (!authData) {
            console.warn("❌ Unauthorized WebSocket attempt.");
            ws.close(4001, "Unauthorized");
            return;
        }

        ws.authData = authData; // Attach authenticated user data
        wss.emit("connection", ws, request);
    });
});

// ✅ Handle WebSocket connections AFTER authentication
wss.on("connection", (ws) => {
    const { userId, role } = ws.authData;

    if (!userId) {
        console.warn("❌ Unauthorized WebSocket attempt.");
        ws.close(4001, "Unauthorized");
        return;
    }

    console.log(`✅ WebSocket connection authenticated for user ${userId}`);

    ws.on("message", (message) => {
        console.log(`📩 WebSocket message from ${userId}:`, message);
    });

    ws.on("close", () => {
        console.log(`❌ WebSocket connection closed for user ${userId}`);
    });
});

// ============================
// 4. DATABASE CONNECTION SETUP
// ============================
mongoose.set("strictQuery", true);
if (process.env.NODE_ENV === "development") {
  mongoose.set("debug", true);
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
      autoIndex: process.env.MONGO_AUTO_INDEX === "true",
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
      socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
      retryWrites: true,
    });
    console.log("✅ MongoDB Connection Established");

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
      setTimeout(connectDB, 5000);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("🔄 MongoDB Reconnected Successfully");
    });
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// ============================
// 5. GLOBAL MIDDLEWARE
// ============================
app.use(compression());
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

// Session Setup with MongoStore
app.use(
  session({
    secret: process.env.JWT_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      ttl: 14 * 24 * 60 * 60, // 14 days
      autoRemove: "native",
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    },
  })
);

// Security with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// ============================
// 6. STATIC FILES (No EJS View Engine)
// ============================
app.use(express.static(path.join(__dirname, "public")));

// ============================
// 7. API ROUTES MOUNTING
// ============================
const stripeRouter = require("./routes/stripe");
const stripeWebhook = require("./webhooks/stripe");
const subscriptionRouter = require("./routes/subscription");
const aiRoutes = require("./routes/aiRoutes").router;
const leaderboardRoutes = require("./routes/leaderboard");
const trainingRoutes = require("./routes/training");
const dashboardRouter = require("./routes/dashboard");

app.use("/api/stripe", stripeRouter);
app.use("/webhook/stripe", stripeWebhook);
app.use("/api/subscription", subscriptionRouter);
app.use(
  "/api/ai",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "AI service rate limit exceeded. Please try again later." },
  }),
  aiRoutes
);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/training", trainingRoutes);
app.use("/api/dashboard", dashboardRouter);
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api/modules', modulesRouter);
app.use("/js", express.static(path.join(__dirname, "public/js")));
  setHeaders: (res, path) => { 
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
;

// Define routes (for example, /academy, /about, etc.)
app.get('/academy', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'academy.html'));
});
app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Additional Routers via safeRequire (if any)
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (error) {
    console.error(`❌ Failed to load module: ${modulePath}`, error.message);
    return null;
  }
};

const additionalRouters = {
  about: safeRequire("./routes/about"),
  achievements: safeRequire("./routes/achievements"),
  aiWebController: safeRequire("./routes/aiWebController"),
  auth: safeRequire("./routes/auth"),
  community: safeRequire("./routes/communityRoutes"),
  insights: safeRequire("./routes/insights"),
  main: safeRequire("./routes/main"),
  modules: safeRequire("./routes/modules"),
  payment: safeRequire("./routes/payment"),
  signup: safeRequire("./routes/signup"),
  testOpenAI: safeRequire("./routes/testOpenAI"),
  user: safeRequire("./routes/user"),
  video: safeRequire("./routes/video"),
};

for (const [name, router] of Object.entries(additionalRouters)) {
  if (router && typeof router === "function") {
    app.use(`/api/${name}`, router);
    console.log(`✅ Registered route: /api/${name}`);
  } else if (router) {
    console.error(`❌ Error: Router for /api/${name} is invalid.`);
  }
}

// ============================
// 8. STATIC HTML ROUTES (Clean URLs)
// ============================

const staticPages = [
  { route: "/welcome", file: "Welcome.html" },
  { route: "/about", file: "about.html" },
  { route: "/academy", file: "academy.html" },
  { route: "/dashboard", file: "dashboard.html" },
  { route: "/", file: "index.html" },
  { route: "/leaderboard", file: "leaderboard.html" },
  { route: "/login", file: "login.html" },
  { route: "/merchandise", file: "merchandise.html" },
  { route: "/password", file: "password.html" },
  { route: "/profile", file: "profile.html" },
  { route: "/signup", file: "signup.html" },
  { route: "/signupold", file: "signupold.html" },
  { route: "/subscribe", file: "subscribe.html" },
  { route: "/test", file: "test.html" },
  { route: "/training", file: "training.html" },
  { route: "/why-sharedstars", file: "why-sharedstars.html" }
];

staticPages.forEach(page => {
  app.get(page.route, (req, res) => {
    res.sendFile(path.join(__dirname, "public", page.file));
  });
});

// ============================
// 9. TEST ROUTES
// ============================
const testRoutes = express.Router();

testRoutes.post("/progress", (req, res) => {
  try {
    const { progress } = req.body;
    if (!progress) {
      return res.status(400).json({ error: "Missing 'progress' field in request body" });
    }
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "progress_update", progress }));
        }
      });
    } else {
      console.warn("⚠️ WebSocket Server (`wss`) is not initialized.");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error in /progress:", error);
    res.status(500).json({ error: error.message });
  }
});

testRoutes.post("/achievement", (req, res) => {
  try {
    const { achievement } = req.body;
    if (!achievement) {
      return res.status(400).json({ error: "Missing 'achievement' field in request body" });
    }
    if (wss && wss.clients) {
      wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({ type: "achievement_unlocked", achievement }));
        }
      });
    } else {
      console.warn("⚠️ WebSocket Server (`wss`) is not initialized.");
    }
    res.json({ success: true });
  } catch (error) {
    console.error("❌ Error in /achievement:", error);
    res.status(500).json({ error: error.message });
  }
});

app.use("/api/test", testRoutes);
app.use("/api/chat", chatRoutes);

// ============================
// 10. ERROR HANDLING
// ============================
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource could not be found.",
    path: req.path,
  });
});

app.use((err, req, res, next) => {
  if (err.code === "ENOENT") {
    console.warn(`File not found: ${req.path}`);
    return res.status(404).send("File not found");
  }
  if (err.message && err.message.includes("Range Not Satisfiable")) {
    console.warn(`Range error for file: ${req.path}`);
    return res.status(416).send("Range Not Satisfiable");
  }
  console.error("Global Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  res.status(err.status || 500).json({
    error: "Server Error",
    message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
  });
});

// ============================
// 11. RATE LIMITING (Additional)
// Set proxy trust (if behind a proxy)
app.set('trust proxy', 1);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  keyGenerator: (req, res) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  },
  message: { error: "AI service rate limit exceeded. Please try again later." }
});
app.use("/api/ai", aiLimiter);

// 12. SERVER STARTUP
// ============================
const startServer = async () => {
  await connectDB(); // Connect to MongoDB first

  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
