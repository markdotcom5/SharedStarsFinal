const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

// Import all models with consistent PascalCase naming
const Certification = require("./models/Certification");
const CommunityModels = require("./models/CommunityModels");
const Insight = require("./models/Insight");
const Intervention = require("./models/Intervention");
const Module = require("./models/Module");
const Session = require("./models/Session");
const Subscription = require("./models/Subscription");
const TrainingSession = require("./models/TrainingSession");
const Trial = require("./models/Trial");
const User = require("./models/User");
const UserProgress = require("./models/UserProgress");
const Video = require("./models/Video");
const Achievement = require("./models/Achievement");
const Challenge = require("./models/Challenge");
const Dashboard = require("./models/Dashboard");
const Discussion = require("./models/Discussion");
const GroupSession = require("./models/GroupSession");
const Leaderboard = require("./models/Leaderboard");
const PeerMatch = require("./models/PeerMatch");
const StudyGroup = require("./models/StudyGroup");

// Import module configurations
const { modules } = require('./modules/moduleLoader');

// Database connection with retry mechanism
const connectDB = async (retries = 5) => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log("✅ MongoDB Connected Successfully");
    } catch (err) {
        if (retries > 0) {
            console.warn(`⚠️ Retrying connection... (${retries} attempts remaining)`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            return connectDB(retries - 1);
        }
        console.error("🚨 MongoDB Connection Error:", err);
        process.exit(1);
    }
};

// Clear existing data
const clearDatabase = async () => {
    if (process.env.NODE_ENV !== 'production') {
        try {
            const collections = Object.values(mongoose.connection.collections);
            for (const collection of collections) {
                await collection.deleteMany({});
            }
            console.log("🗑️ Database cleared successfully");
        } catch (err) {
            console.error("🚨 Error clearing database:", err);
            throw err;
        }
    }
};

const createTestUser = async () => {
    try {
        const existingUser = await User.findOne({ email: "test@example.com" });
        if (existingUser) {
            return existingUser;
        }

        return await User.create({
            name: "Test User",
            email: "test@example.com",
            password: await bcrypt.hash("testpassword", 10),
            role: "user",
            status: "active",
            preferences: {
                notifications: true,
                language: "en",
                timezone: "UTC"
            }
        });
    } catch (err) {
        console.error("🚨 Error creating test user:", err);
        throw err;
    }
};

const createModules = async () => {
    try {
        const moduleEntries = Object.entries(modules);
        const createdModules = {};

        for (const [key, moduleConfig] of moduleEntries) {
            const moduleData = {
                moduleId: moduleConfig.id,
                title: moduleConfig.name,
                type: 'training',
                category: moduleConfig.category || key,
                difficulty: moduleConfig.difficulty || 'beginner',
                description: moduleConfig.description,
                prerequisites: moduleConfig.prerequisites || [],
                objectives: moduleConfig.objectives || [],
                content: {
                    theory: moduleConfig.theory || [],
                    practice: moduleConfig.practice || [],
                    assessment: {
                        criteria: moduleConfig.assessmentCriteria || [],
                        passingScore: moduleConfig.passingScore || 70
                    }
                },
                trainingStructure: {
                    duration: {
                        weeks: moduleConfig.duration?.weeks || 4,
                        minimumCompletionTime: moduleConfig.duration?.minimumTime || 20,
                        maximumCompletionTime: moduleConfig.duration?.maximumTime || 40
                    }
                },
                creditSystem: {
                    totalCredits: moduleConfig.creditValue || 100
                }
            };

            createdModules[key] = await Module.create(moduleData);
        }

        console.log("✅ Training Modules Created");
        return createdModules;
    } catch (err) {
        console.error("🚨 Error creating modules:", err);
        throw err;
    }
};

const createTrainingSessions = async (user, modules) => {
    try {
        const sessions = Object.entries(modules).map(([type, module]) => ({
            sessionType: type,
            userId: user._id,
            moduleId: module._id,
            dateTime: new Date(),
            status: "scheduled",
            metrics: {
                completionRate: 0,
                effectivenessScore: 0,
                overallRank: 0
            }
        }));

        await TrainingSession.insertMany(sessions);
        console.log("✅ Training Sessions Created");
    } catch (err) {
        console.error("🚨 Error creating training sessions:", err);
        throw err;
    }
};

const createCertifications = async (user, modules) => {
    try {
        await Certification.create({
            userId: user._id,
            name: "Space Mission Certified",
            description: "Completed space training program",
            dateEarned: new Date(),
            level: "beginner",
            modules: Object.values(modules).map(m => m._id),
            status: "active",
            validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        });
        console.log("✅ Certifications Created");
    } catch (err) {
        console.error("🚨 Error creating certifications:", err);
        throw err;
    }
};

const createUserProgress = async (user, modules) => {
    try {
        const firstModule = Object.values(modules)[0];
        
        await UserProgress.create({
            userId: user._id,
            moduleProgress: {
                currentModule: firstModule._id,
                completedModules: [],
                activeModules: Object.values(modules).map(module => ({
                    moduleId: module._id,
                    progress: 0,
                    lastAccessed: new Date()
                }))
            },
            metrics: {
                totalTimeSpent: 0,
                averagePerformance: 0,
                consistencyScore: 0,
                engagementLevel: 0
            },
            achievements: [],
            skillLevels: {
                technical: 1,
                theoretical: 1,
                practical: 1,
                problemSolving: 1
            }
        });
        console.log("✅ User Progress Created");
    } catch (err) {
        console.error("🚨 Error creating user progress:", err);
        throw err;
    }
};

const populateDatabase = async () => {
    try {
        console.log("🚀 Starting Database Population...");
        
        // Clear existing data in development
        await clearDatabase();

        // Create core data
        const user = await createTestUser();
        const createdModules = await createModules();
        await createTrainingSessions(user, createdModules);
        await createCertifications(user, createdModules);
        await createUserProgress(user, createdModules);

        console.log("✅ Database Population Completed Successfully!");
    } catch (err) {
        console.error("🚨 Database Population Error:", err);
        throw err;
    }
};

// Execute population script with proper cleanup
(async () => {
    try {
        await connectDB();
        await populateDatabase();
    } catch (err) {
        console.error("🚨 Fatal Error:", err);
    } finally {
        await mongoose.connection.close();
        console.log("📡 Database Connection Closed");
        process.exit(0);
    }
})();