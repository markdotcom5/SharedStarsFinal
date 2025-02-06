// ============================
// 1. ENV & REQUIRED MODULES
// ============================
require("dotenv").config();

// Core modules
const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth"); 

// Middleware
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

// Database
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

// Load MVP essential models
console.log("\n📚 Loading Core Models...");
try {
    require('./models/Module');
    console.log("✅ Module.js loaded successfully!");
    require('./models/TrainingSession');
    console.log("✅ TrainingSession.js loaded successfully!");
    require('./models/User');
    console.log("✅ User.js loaded successfully!");
    require('./models/Subscription');
    console.log("✅ Subscription.js loaded successfully!");
    require('./models/UserProgress');
    console.log("✅ UserProgress.js loaded successfully!");
} catch (error) {
    console.error("❌ Error loading models:", error.message);
}
// Custom middleware and services
const { authenticateWebSocket } = require("./middleware/authenticate");
const SpaceTimelineManager = require('./services/SpaceTimelineManager');

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// ============================
// 2. WEBSOCKET SETUP
// ============================
const wss = new WebSocket.Server({ noServer: true });

// WebSocket service wrapper
const webSocketService = {
    broadcast: (type, data) => {
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type, data }));
            }
        });
    },
    sendToUser: (userId, type, data) => {
        wss.clients.forEach(client => {
            if (client.userId === userId && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type, data }));
            }
        });
    }
};

// Store active timeline managers
const timelineManagers = new Map();

// WebSocket upgrade handling
server.on("upgrade", (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
        const authData = authenticateWebSocket(request);
        if (!authData) {
            ws.close(4001, "Unauthorized");
            return;
        }
        ws.authData = authData;
        ws.userId = authData.userId;
        
        const timelineManager = new SpaceTimelineManager(ws.userId, webSocketService);
        timelineManagers.set(ws.userId, timelineManager);
        
        wss.emit("connection", ws, request);
    });
});

// WebSocket connection handling
wss.on("connection", (ws) => {
    const { userId } = ws.authData;
    
    const timelineManager = timelineManagers.get(userId);
    timelineManager.initialize().catch(error => {
        console.error(`Failed to initialize timeline for user ${userId}:`, error);
    });

    ws.on("message", async (message) => {
        try {
            const data = JSON.parse(message);
            const timelineManager = timelineManagers.get(userId);
            
            switch (data.type) {
                case 'requestTimelineUpdate':
                    await timelineManager.updatePersonalTimeline();
                    break;
                case 'updateTrainingProgress':
                    await timelineManager.updateTrainingProgress(data.sessionId, data.progress);
                    break;
                case 'awardAchievement':
                    await timelineManager.awardAchievement(data.achievementId);
                    break;
                default:
                    console.log(`📩 WebSocket message from ${userId}:`, data);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
            ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
        }
    });

    ws.on("close", () => {
        timelineManagers.delete(userId);
    });
});

// ============================
// 3. DATABASE CONNECTION
// ============================
mongoose.set("strictQuery", true);
mongoose.set("debug", process.env.NODE_ENV === "development");

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
            autoIndex: process.env.MONGO_AUTO_INDEX === "true",
            maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
            socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
            retryWrites: true,
        });
        console.log("✅ MongoDB Connected");

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
            setTimeout(connectDB, 5000);
        });
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error);
        process.exit(1);
    }
};
// ============================
// 4. MIDDLEWARE SETUP
// ============================
// Security middleware first
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());

// Body parsing middleware
app.use(compression());
app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRoutes); // ✅ Registers the authentication routes

// Session handling
app.use(session({
    secret: process.env.JWT_SECRET || "your_secret_key",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: "native",
    }),
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 14 * 24 * 60 * 60 * 1000,
    },
}));

// ============================
// 5. STATIC FILES & ROUTES
// ============================
// Static file middleware
app.use("/js", express.static(path.join(__dirname, "public/js"), {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Import and use routes
const routes = {
    missionControl: require('./routes/mission-control')(wss),
    modules: require('./routes/modules'),
    chat: require('./routes/chat'),
    stripe: require('./routes/stripe'),
    stripeWebhook: require('./webhooks/stripe'),
    subscription: require('./routes/subscription'),
    ai: require('./routes/aiRoutes').router,
    leaderboard: require('./routes/leaderboard'),
    training: require('./routes/training')
};

// Mount API routes
app.use('/api/mission-control', routes.missionControl);
app.use('/api/modules', routes.modules);
app.use('/api/chat', routes.chat);
app.use('/api/stripe', routes.stripe);
app.use('/webhook/stripe', routes.stripeWebhook);
app.use('/api/subscription', routes.subscription);
app.use('/api/ai', rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: "AI service rate limit exceeded" }
}), routes.ai);
app.use('/api/leaderboard', routes.leaderboard);
app.use('/api/training', routes.training);
app.use("/api/users", userRoutes); // Make sure this line exists!

// Static page routes
const staticPages = [
    { route: "/", file: "index.html" },
    { route: "/welcome", file: "Welcome.html" },
    { route: "/about", file: "about.html" },
    { route: "/academy", file: "academy.html" },
    { route: "/mission-control", file: "mission-control.html" },
    { route: "/leaderboard", file: "leaderboard.html" },
    { route: "/login", file: "login.html" },
    { route: "/profile", file: "profile.html" },
    { route: "/signup", file: "signup.html" },
    { route: "/subscribe", file: "subscribe.html" },
    { route: "/training", file: "training.html" },
    { route: "/why-sharedstars", file: "why-sharedstars.html" }
];

staticPages.forEach(({ route, file }) => {
    app.get(route, (req, res) => {
        res.sendFile(path.join(__dirname, "public", file));
    });
});

// ============================
// 6. ERROR HANDLING
// ============================
app.use((req, res) => {
    res.status(404).json({
        error: "Not Found",
        path: req.path,
    });
});

app.use((err, req, res, next) => {
    console.error("Global Error:", {
        message: err.message,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
        path: req.path,
        method: req.method,
    });
    
    res.status(err.status || 500).json({
        error: "Server Error",
        message: process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred",
    });
});

// ============================
// 7. SERVER STARTUP
// ============================
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        await connectDB();
        server.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
            console.log(`✅ WebSocket server initialized`);
        });
    } catch (error) {
        console.error("❌ Server startup error:", error);
        process.exit(1);
    }
};

startServer();

module.exports = app;