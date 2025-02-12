// ============================
// 1. ENV & REQUIRED MODULES
// ============================
require("dotenv").config();

// Core modules
const express = require("express");
const http = require("http");
const path = require("path");
const WebSocket = require("ws");

// Route imports - Core
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/auth"); 
const creditRoutes = require('./routes/credits');
const paymentRoutes = require('./routes/payment');

// Route imports - Training & Progress
const trainingRoutes = require('./routes/training');
const leaderboardRoutes = require('./routes/leaderboard');
const countdownRoutes = require("./routes/countdown");
const progressRoutes = require("./routes/progress");
const advancedRoutes = require('./routes/advancedTrainingRoutes');

// Route imports - Simulation & Missions
const simulationRoutes = require('./routes/simulation/simulation');
const missionRoutes = require('./routes/simulation/missions');
const scenarioRoutes = require('./routes/simulation/scenarios');
const teamRoleRoutes = require('./routes/simulation/teamRoles');
const { Simulation } = require('./models/simulation');
const physicalRoutes = require('./routes/physical');

// Module imports
const physicalModule = require('./modules/core/physical');
const technicalModule = require('./modules/core/technical');
const simulationModule = require('./modules/core/simulation');

// Service routes
const missionControlRoutes = require('./routes/mission-control');
const chatRoutes = require('./routes/chat');
const stripeRoutes = require('./routes/stripe');
const stripeWebhookRoutes = require('./webhooks/stripe');
const subscriptionRoutes = require('./routes/subscription');
const aiRoutes = require('./routes/aiRoutes');

// Middleware imports
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const rateLimit = require("express-rate-limit");
// Database
const mongoose = require("mongoose");
const MongoStore = require("connect-mongo");

// Custom middleware and services
const { authenticateWebSocket } = require("./middleware/authenticate");
const SpaceTimelineManager = require('./services/SpaceTimelineManager');
const { authenticate } = require('./middleware/authenticate');
// Initialize Express and create HTTP server
const app = express();
const server = http.createServer(app);

// ============================
// 2. DATABASE CONNECTION
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

        // Load essential models
        console.log("\n📚 Loading Core Models...");
        const models = ['Module', 'TrainingSession', 'User', 'Subscription', 'UserProgress', 'Simulation'];
        for (const model of models) {
            require(`./models/${model}`);
            console.log(`✅ ${model}.js loaded successfully!`);
        }

        console.log(`\n🔢 Total Models Connected: ${models.length}\n`);

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
// 3. WEBSOCKET SETUP
// ============================
let wss;
try {
    wss = new WebSocket.Server({ 
        noServer: true,
        // Remove direct port binding to avoid conflicts
        // Will attach to HTTP server instead
    });
} catch (error) {
    console.error('Error creating WebSocket server:', error);
    process.exit(1);
}

const timelineManagers = new Map();

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

// WebSocket error handling
wss.on('error', (error) => {
    console.error('WebSocket Server Error:', error);
});

// ============================
// 4. MIDDLEWARE SETUP
// ============================
// Security middleware
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors());
app.use(compression());

// Body parsing middleware
const jsonParser = express.json();
app.use((req, res, next) => {
    if (req.method === 'GET') {
        next();
    } else {
        jsonParser(req, res, next);
    }
});
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
    app.use((req, res, next) => {
        console.log('Debug:', {
            method: req.method,
            path: req.url,
            contentType: req.headers['content-type']
        });
        next();
    });
}

// ============================
// 5. ROUTES SETUP
// ============================
// Static file serving
app.use("/js", express.static(path.join(__dirname, "public/js"), {
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript');
        }
    }
}));
app.use(express.static(path.join(__dirname, 'public')));

// Core API Routes
app.use("/api/auth", authRoutes);
app.use('/api/credits', creditRoutes);
app.use("/api/users", userRoutes);
app.use('/api/payment', paymentRoutes);

// Training & Progress Routes
app.use('/api/training', trainingRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/countdown', countdownRoutes);
app.use('/api/progress', progressRoutes);

// Simulation & Mission Routes
app.use('/api/simulation', simulationRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/teamRoles', teamRoleRoutes);

// Module Routes
const modules = {
    physical: physicalModule,
    technical: technicalModule,
    simulation: simulationModule
};

Object.entries(modules).forEach(([name, module]) => {
    if (module) {
        if (module.router) {
            app.use(`/api/modules/${name}`, module.router);
        } else if (typeof module === 'function') {
            app.use(`/api/modules/${name}`, module);
        } else {
            console.warn(`⚠️ Warning: ${name} module is not a valid router or middleware`);
        }
    }
});

// Advanced Training Routes
if (typeof advancedRoutes.upgradeConnection === 'function') {
    advancedRoutes.upgradeConnection(server);
}
app.use('/api/advanced', advancedRoutes.router || advancedRoutes);

// Service Routes with Rate Limiting
app.use('/api/ai', 
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: { error: "AI service rate limit exceeded" }
    }),
    aiRoutes.router || aiRoutes
);

app.use('/api/chat', chatRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/webhook/stripe', stripeWebhookRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/mission-control', missionControlRoutes(wss));

// ============================
// MODULE INITIALIZATION
// ============================
const initializeAllModules = async () => {
    let modules = {};
    let trainingModules = {};
    let sharedModules = {};

    try {
        // First, load the ModuleLoader
        const { ModuleLoader, moduleLoader } = require('./modules/moduleLoader');

        // Define core modules that actually exist
        modules = {
            physical: {
                main: require('./modules/core/physical/index.js'),
                assessments: require('./modules/core/physical/assessments/index.js'),
                tasks: require('./modules/core/physical/tasks/index.js'),
                requirements: require('./modules/core/physical/requirements/index.js')
            },
            technical: {
                main: require('./modules/core/technical/index.js'),
                tasks: require('./modules/core/technical/tasks/index.js'),
                systems: require('./modules/core/technical/systems/index.js'),
                protocols: require('./modules/core/technical/protocols/index.js')
            },
            simulation: {
                main: require('./modules/core/simulation/index.js'),
                missions: require('./modules/core/simulation/missions/index.js'),
                scenarios: require('./modules/core/simulation/scenarios/index.js'),
                teamRoles: require('./modules/core/simulation/teamRoles/index.js')
            }
        };

        // Training module types
        trainingModules = {
            physical: require('./models/PhysicalTraining'),
            technical: require('./models/TechnicalTraining'),
            simulation: require('./models/SimulationTraining')
        };

        // Load shared modules
        sharedModules = {
            types: {
                moduleTypes: require('./modules/shared/types/ModuleTypes.js'),
                baseModules: require('./modules/shared/types/baseModules.js'),
                baseSession: require('./modules/shared/types/baseSession.js')
            },
            achievements: {
                badges: require('./modules/shared/achievements/badges.js'),
                certifications: require('./modules/shared/achievements/certifications.js')
            },
            progression: {
                requirements: require('./modules/shared/progression/requirements.js'),
                unlocks: require('./modules/shared/progression/unlocks.js')
            },
            credits: {
                calculation: require('./modules/shared/credits/calculation.js'),
                thresholds: require('./modules/shared/credits/thresholds.js')
            }
        };

        console.log('\n🚀 Initializing Core Modules...');

        // Validate module structures
        Object.entries(modules).forEach(([name, moduleGroup]) => {
            if (!moduleGroup.main) {
                console.warn(`⚠️ Warning: ${name} module is missing main index.js`);
                return;
            }
            console.log(`✅ ${name} module structure validated`);
        });

        // Initialize ModuleLoader with validated modules
        if (moduleLoader && typeof moduleLoader.initializeModules === 'function') {
            await moduleLoader.initializeModules();
            console.log('✅ All modules initialized successfully');
        }

        // Mount module routes
        Object.entries(modules).forEach(([name, moduleGroup]) => {
            if (moduleGroup.main && moduleGroup.main.router) {
                app.use(`/api/modules/${name}`, authenticate, moduleGroup.main.router);
                console.log(`✅ Mounted ${name} module routes`);
            }
        });

        // Initialize training modules
        console.log('\n📚 Initializing Training Modules...');
        for (const [type, TrainingModule] of Object.entries(trainingModules)) {
            if (TrainingModule) {
                try {
                    if (typeof TrainingModule.initialize === 'function') {
                        await TrainingModule.initialize();
                    }
                    console.log(`✅ ${type} training module initialized`);
                } catch (error) {
                    console.error(`❌ Error initializing ${type} training module:`, error);
                }
            }
        }

        // Setup module relationships
        console.log('\n🔄 Setting up module relationships...');
        await Promise.all(Object.values(modules).map(async (module) => {
            if (module && typeof module.setupRelationships === 'function') {
                try {
                    await module.setupRelationships(modules);
                    console.log(`✅ Relationships setup for ${module.moduleData.name}`);
                } catch (error) {
                    console.error(`❌ Error setting up relationships for ${module.moduleData.name}:`, error);
                }
            }
        }));

        console.log('\n✅ Core and shared modules loaded');

    } catch (error) {
        console.error('❌ Error during module initialization:', error);
        if (process.env.NODE_ENV === 'development') {
            console.error('Detailed error:', error.stack);
        }
    } finally {
        console.log('\n📊 Module Initialization Summary:');
        console.log(`Total Core Modules: ${Object.keys(modules || {}).length}`);
        console.log(`Total Shared Modules: ${Object.keys(sharedModules || {}).length}`);
        console.log(`Total Training Modules: ${Object.keys(trainingModules || {}).length}`);
    }
};

// Export for testing purposes
module.exports = {
    initializeAllModules
};
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
        server.listen(process.env.PORT || 3000, () => {
            console.log(`🚀 Server running on port ${process.env.PORT || 3000}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
            console.log(`📡 WebSocket server initialized`);
        });
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

module.exports = app;