// ============================
// 1. ENV & REQUIRED MODULES
// ============================
require("dotenv").config();

// Core modules
const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");
const net = require("net");

const app = express();
const server = http.createServer(app);

// ============================
// 2. ROUTE IMPORTS
// ============================

// Core Routes
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth");
const creditRoutes = require("./routes/credits");
const paymentRoutes = require("./routes/payment");
const vrRoutes = require("./routes/vr");

// Training & Progress Routes
const trainingRoutes = require("./routes/training");
const leaderboardRoutes = require("./routes/leaderboard");
const countdownRoutes = require("./routes/countdown");
const progressRoutes = require("./routes/progress");
const advancedRoutes = require("./routes/advancedTrainingRoutes");

// Simulation & Missions Routes
const simulationRoutes = require("./routes/simulation/simulation");
const missionRoutes = require("./routes/simulation/missions");
const scenarioRoutes = require("./routes/simulation/scenarios");
const teamRoleRoutes = require("./routes/simulation/teamRoles");

// Additional Imports
const { Simulation } = require("./models/simulation");
const physicalRoutes = require("./routes/physical");

// ============================
// 3. MODULE IMPORTS
// ============================

const physicalModule = require("./modules/core/physical");
const technicalModule = require("./modules/core/technical");
const simulationModule = require("./modules/core/simulation");
const evaModule = require("./modules/core/eva");
const evaRoutes = require("./routes/eva");
const vrModule = require("./modules/vr/QuestModule");

// Service Routes
const missionControlRoutes = require("./routes/mission-control");
const chatRoutes = require("./routes/chat");
const stripeRoutes = require("./routes/stripe");
const stripeWebhookRoutes = require("./webhooks/stripe");
const subscriptionRoutes = require("./routes/subscription");
const aiRoutes = require("./routes/aiRoutes");

// ============================
// 4. MIDDLEWARE IMPORTS
// ============================
const vrMiddleware = require("./middleware/vr");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");

// ============================
// 5. AI SERVICES & INTEGRATORS
// ============================
const AILearningSystem = require("./services/AILearningSystem");
const TrainingModuleIntegrator = require("./services/TrainingModuleIntegrator");
const ProgressTracking = require("./services/ProgressTracker");
const EVAAIService = require("./services/EVAAIService");
const ModuleSystemIntegrator = require("./services/ModuleSystemIntegrator");
const ServiceIntegrator = require("./services/ServiceIntegrator");
const aiSocialRoutes = require('./routes/aiSocial');
const socialPlatformRoutes = require("./routes/socialPlatform");

// ============================
// 6. VR SERVICES
// ============================
const ImmersiveScenarios = require("./modules/vr/scenarios/ImmersiveScenarios");
const PhysicalPropsIntegration = require("./modules/vr/props/PhysicalPropsIntegration");

// ============================
// 7. DATABASE CONNECTION
// ============================
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

// Custom middleware & services
const { authenticateWebSocket } = require("./middleware/authenticate");
const SpaceTimelineManager = require("./services/SpaceTimelineManager");
const { authenticate } = require("./middleware/authenticate");

// ============================
// 8. DATABASE CONNECTION SETUP
// ============================

mongoose.set("strictQuery", true);
mongoose.set("debug", process.env.NODE_ENV === "development");

const connectDB = async () => {
    try {
        console.log("🔄 Connecting to MongoDB...");

        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: process.env.MONGO_TIMEOUT ? parseInt(process.env.MONGO_TIMEOUT, 10) : 5000,
            autoIndex: process.env.MONGO_AUTO_INDEX === "true",
            maxPoolSize: process.env.MONGO_POOL_SIZE ? parseInt(process.env.MONGO_POOL_SIZE, 10) : 10,
            socketTimeoutMS: process.env.MONGO_SOCKET_TIMEOUT ? parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) : 45000,
            retryWrites: true,
        });

        console.log("✅ MongoDB Connected Successfully!");

        // Load essential models
        console.log("\n📚 Loading Core Models...");
        const models = ["Module", "TrainingSession", "User", "Subscription", "UserProgress", "Simulation"];

        models.forEach((model) => {
            try {
                require(`./models/${model}`);
                console.log(`✅ ${model}.js loaded successfully!`);
            } catch (err) {
                console.error(`❌ Error loading ${model}.js:`, err.message);
            }
        });

        console.log(`\n🔢 Total Models Connected: ${models.length}\n`);

        mongoose.connection.on("disconnected", () => {
            console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
            setTimeout(connectDB, 5000);
        });

        mongoose.connection.on("reconnected", () => {
            console.log("🔄 MongoDB Reconnected Successfully!");
        });

        mongoose.connection.on("error", (err) => {
            console.error("❌ MongoDB Connection Error:", err);
        });

        process.on("SIGINT", async () => {
            console.log("🛑 Closing MongoDB Connection...");
            await mongoose.connection.close();
            process.exit(0);
        });

    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;

// ============================
// ============================
// 3. WEBSOCKET SETUP
// ============================
let wss; // ✅ Declare `wss` at the top so it’s globally available

// ✅ Check if port 8081 is free before initializing WebSocket
const checkPort = (port) => {
    return new Promise((resolve) => {
        const tester = net.createServer()
            .once("error", (err) => {
                if (err.code === "EADDRINUSE") {
                    console.warn(`⚠️ Port ${port} is already in use. Skipping WebSocket initialization.`);
                    resolve(false);
                }
            })
            .once("listening", () => {
                tester.close();
                resolve(true);
            })
            .listen(port);
    });
};

const initWebSocket = async () => {
    const portFree = await checkPort(8081);
    if (!portFree) {
        console.warn("⚠️ WebSocket not initialized: Port 8081 is already in use.");
        return null;
    }

    const wss = new WebSocket.Server({ noServer: true });
    console.log("✅ WebSocket Server Created on Port 8081");

    wss.on("connection", (ws) => {
        console.log("🔗 New WebSocket Connection Established");
    });

    wss.on("error", (error) => {
        console.error("❌ WebSocket Server Error:", error);
    });

    return wss;
};

// ✅ Ensure WebSocket is available before using it
(async () => {
    const wss = await initWebSocket();
    
    if (wss) {
        app.use('/api/mission-control', authenticate, missionControlRoutes(wss));
    } else {
        console.warn("⚠️ Skipping /api/mission-control setup: WebSocket server is unavailable.");
    }
})();

// ============================
// 4. MIDDLEWARE SETUP
// ============================

// ✅ Security Middleware (Only Declared Once)
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(compression());

// ✅ Body Parsing Middleware (Only Declared Once)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Check if `vrModule` has an `initialize` function before calling it
if (typeof vrModule.initialize === "function") {
    vrModule.initialize();
} else {
    console.warn("⚠️ vrModule does not have an initialize() function.");
}

// ✅ Session Handling (Only Declared Once)
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

// ✅ Initialize AI Systems (Only Runs Once)
(async () => {
    try {
        if (!app.locals.aiSystemsInitialized) {
            console.log("🔄 Initializing AI systems...");

            await ServiceIntegrator.initialize();
            await TrainingModuleIntegrator.initialize();
            await ProgressTracking.getProgress("example-user-id");

            console.log("✅ AI systems initialized");
            app.locals.aiSystemsInitialized = true;
        }
    } catch (error) {
        console.error("❌ Error initializing AI systems:", error);
        process.exit(1);  // Exit if initialization fails
    }
})();

// ============================
// ✅ Start the Express Server (Only Declared Once)
// ============================

server.listen(3000, () => {
    console.log("🚀 Server running on port 3000");
});
// ============================
// ============================
// 5. ROUTES SETUP
// ============================

// ✅ Static File Serving
app.use("/js", express.static(path.join(__dirname, "public/js"), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Core API Routes
app.use("/api/auth", authRoutes);
app.use('/api/credits', creditRoutes);
app.use("/api/users", userRoutes);
app.use('/api/payment', paymentRoutes);

// ✅ VR Routes (Only if `vrRoutes` is defined)
if (vrRoutes) {
    app.use('/api/vr', vrRoutes);
} else {
    console.warn("⚠️ Warning: `vrRoutes` is undefined.");
}

// ✅ Training & Progress Routes
app.use('/api/training', authenticate, trainingRoutes);
app.use('/api/leaderboard', authenticate, leaderboardRoutes);
app.use('/api/countdown', authenticate, countdownRoutes);
app.use('/api/progress', authenticate, progressRoutes);

// ✅ Module Configuration
const modules = {
    physical: physicalModule,
    technical: technicalModule,
    simulation: simulationModule,
    eva: evaModule,
};

if (vrRoutes && typeof vrRoutes === "function") {
    app.use("/vr", vrRoutes);
} else {
    console.warn("⚠️ Warning: `vrRoutes` is not a valid Express router.");
}


// ✅ Initialize and Mount Module Routes with Authentication
Object.entries(modules).forEach(([name, module]) => {
    if (module?.router) {
        app.use(`/api/modules/${name}`, authenticate, module.router);
    } else if (typeof module === 'function') {
        app.use(`/api/modules/${name}`, authenticate, module);
    } else {
        console.warn(`⚠️ Warning: ${name} module is not a valid router or middleware`);
    }
});

// ✅ Advanced Training & Simulation Routes
if (typeof advancedRoutes?.upgradeConnection === 'function') {
    advancedRoutes.upgradeConnection(server);
}
app.use('/api/advanced', authenticate, advancedRoutes.router || advancedRoutes);
app.use('/api/missions', authenticate, missionRoutes);
app.use('/api/scenarios', authenticate, scenarioRoutes);
app.use('/api/teamRoles', authenticate, teamRoleRoutes);
app.use('/api/ai-social', aiSocialRoutes);
app.use("/vr", vrRoutes);

// ✅ AI Service Routes with Rate Limiting
app.use('/api/ai',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: "AI service rate limit exceeded" }
    }),
    authenticate,
    aiRoutes.router || aiRoutes
);

// ✅ Communication Routes
app.use('/api/chat', authenticate, chatRoutes);
app.use('/api/social', authenticate, socialPlatformRoutes);

// ✅ Payment & Subscription Routes
app.use('/api/stripe', authenticate, stripeRoutes);
app.use('/webhook/stripe', stripeWebhookRoutes);  // No auth for webhooks
app.use('/api/subscription', authenticate, subscriptionRoutes);

// ============================
// MODULE INITIALIZATION
// ============================

const initializeAllModules = async () => {
    const modules = {};
    const sharedModules = {};
    
    try {
        const { ModuleLoader, moduleLoader } = require('./modules/moduleLoader');

        console.log('\n🚀 Loading Core Modules...');

        const coreModules = {
            physical: './modules/core/physical/index.js',
            technical: './modules/core/technical/index.js',
            simulation: './modules/core/simulation/index.js',
            eva: './modules/core/eva/index.js'
        };

        // ✅ Load Core Modules Dynamically
        for (const [moduleName, path] of Object.entries(coreModules)) {
            try {
                modules[moduleName] = require(path);
                console.log(`✅ Loaded ${moduleName}`);
            } catch (error) {
                console.warn(`⚠️ Warning: Could not load ${moduleName}:`, error.message);
            }
        }

        console.log('\n📚 Loading Shared Modules...');
        const sharedModulePaths = {
            types: './modules/shared/types/ModuleTypes.js',
            achievements: './modules/shared/achievements/badges.js',
            progression: './modules/shared/progression/requirements.js',
            credits: './modules/shared/credits/calculation.js'
        };

        // ✅ Load Shared Modules Dynamically
        for (const [category, path] of Object.entries(sharedModulePaths)) {
            try {
                sharedModules[category] = require(path);
                console.log(`✅ Loaded shared/${category}`);
            } catch (error) {
                console.warn(`⚠️ Warning: Could not load shared/${category}:`, error.message);
            }
        }

        console.log('\n🔍 Validating Module Structures...');
        Object.entries(modules).forEach(([name, module]) => {
            if (!module) {
                console.warn(`⚠️ Warning: ${name} module is missing main index.js`);
            } else {
                console.log(`✅ ${name} module structure validated`);
            }
        });

        if (moduleLoader?.initializeModules) {
            console.log('\n🚀 Initializing ModuleLoader...');
            await moduleLoader.initializeModules();
            console.log('✅ ModuleLoader initialized successfully');
        }

        console.log('\n✅ All modules loaded and initialized successfully');

    } catch (error) {
        console.error('\n❌ Critical Error during module initialization:', error);
        throw error;
    } finally {
        console.log('\n📊 Module Initialization Summary:');
        console.log(`Core Modules: ${Object.keys(modules).length}`);
        console.log(`Shared Module Categories: ${Object.keys(sharedModules).length}`);
    }

    return { modules, sharedModules };
};

module.exports = { initializeAllModules };

// Static Pages
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
// 404 Handler
app.use((req, res, next) => {
    console.log(`⚠️ 404 Not Found: ${req.originalUrl}`);
    res.status(404).json({
        error: "Not Found",
        path: req.originalUrl,
    });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error("❌ Server Error:", err);
    res.status(500).json({
        error: "Internal Server Error",
        message: process.env.NODE_ENV === 'development' ? err.message : 'An error occurred',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// ============================
// 7. START SERVER & CONNECT DB
// ============================
connectDB()
    .then(initializeAllModules)
    .then(() => {
        if (!server.listening) {  // ✅ Prevent multiple calls to `server.listen`
            const PORT = process.env.PORT || 3000;
            server.listen(PORT, () => {
                console.log(`🚀 Server running on port ${PORT}`);
                console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
                console.log(`📡 WebSocket server initialized`);
            });
        } else {
            console.warn("⚠️ Server is already running. Skipping redundant `server.listen()` call.");
        }
    })
    .catch(error => {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    });

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        mongoose.connection.close(false, () => {
            console.log('💤 Server and MongoDB connection closed.');
            process.exit(0);
        });
    });
});
const listEndpoints = require("express-list-endpoints");

console.log("🚀 Available API Endpoints:");
console.log(listEndpoints(app));

module.exports = app;