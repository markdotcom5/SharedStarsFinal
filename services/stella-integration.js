const AISpaceCoach = require('../services/AISpaceCoach');
const SpaceTimelineManager = require('../services/SpaceTimelineManager');
const { EventEmitter } = require('events');

class STELLAIntegration extends EventEmitter {
    constructor(aiHandler = AISpaceCoach) {
        super();

        if (typeof aiHandler.initialize !== "function") {
            throw new Error("❌ Critical Failure: AI Handler missing initialize method!");
        }

        this.aiHandler = aiHandler;
        this.timelineManager = new SpaceTimelineManager();
        this.trainingModules = new Map();
        this.userEngagementCache = new Map();
        this.predictedPathways = new Map();

        console.log("✅ STELLA AI Integration Fully Enhanced");
    }

    async initialize() {
        console.log("🚀 Initializing STELLA AI...");
        try {
            await this.aiHandler.initialize();
            console.log("✅ STELLA AI Fully Initialized");
        } catch (error) {
            console.error("❌ STELLA AI Initialization Failed:", error);
        }
    }

    async loadTrainingModules() {
        try {
            console.log("📂 Loading Training Modules...");
            const modules = ["physical", "technical", "eva", "ai-simulations", "ar-training"];
            modules.forEach(moduleName => {
                this.trainingModules.set(moduleName, { progress: 0 });
            });
        } catch (error) {
            console.error("❌ Error Loading Training Modules:", error);
        }
    }

    async processGuidance(userProfile) {
        try {
            console.log(`🔹 STELLA Guidance for User: ${userProfile.id}`);
            const guidance = await this.aiHandler.generateAdvancedCoachingSuggestions(userProfile);

            if (this.userEngagementCache.get(userProfile.id)?.inactive) {
                guidance.message += " 🚀 Let's get back on track! You're closer to space readiness!";
            }

            return guidance;
        } catch (error) {
            console.error("❌ Error in STELLA Guidance Processing:", error);
            return { error: "Guidance processing failed." };
        }
    }

    async analyzePerformance(userId, requestData) {
        try {
            console.log(`🔹 Analyzing Performance for User: ${userId}`);
            const performanceData = await this.aiHandler.analyzeRealTimePerformance(userId, requestData);

            if (performanceData.score < 50) {
                performanceData.message = "STELLA has adjusted your training to a more personalized difficulty level.";
            }

            return performanceData;
        } catch (error) {
            console.error("❌ Error in STELLA Performance Analysis:", error);
            return { error: "Performance analysis failed." };
        }
    }

    async suggestNextTrainingModule(userId) {
        try {
            console.log(`🔹 Predicting Next Training Module for User: ${userId}`);

            const recommendedModule = Array.from(this.trainingModules.entries())
                .find(([_, moduleData]) => moduleData.progress < 100)?.[0];

            const predictedNextModule = this.predictedPathways.get(userId) || recommendedModule;

            return predictedNextModule
                ? { module: predictedNextModule, status: "recommended" }
                : { message: "All training modules completed", status: "complete" };
        } catch (error) {
            console.error("❌ Error Suggesting Training Module:", error);
            return { error: "Training suggestion failed." };
        }
    }

    async trackUserEngagement(userId) {
        try {
            const lastActivity = this.userEngagementCache.get(userId) || { lastLogin: Date.now(), inactive: false };
            const timeElapsed = Date.now() - lastActivity.lastLogin;

            lastActivity.inactive = timeElapsed > 604800000; // 7 days

            if (lastActivity.inactive) {
                console.warn(`⚠️ User ${userId} has been inactive for over a week!`);
            }

            this.userEngagementCache.set(userId, lastActivity);
        } catch (error) {
            console.error("❌ Error Tracking User Engagement:", error);
        }
    }

    async generateMissionReport(userId) {
        try {
            console.log(`📜 Generating Mission Report for User: ${userId}`);

            const completedModules = Array.from(this.trainingModules.entries())
                .filter(([_, data]) => data.progress === 100)
                .map(([moduleName]) => moduleName);

            const recommendations = await this.suggestNextTrainingModule(userId);

            return {
                userId,
                completedModules,
                recommendations
            };
        } catch (error) {
            console.error("❌ Error Generating Mission Report:", error);
            return { error: "Mission report generation failed." };
        }
    }
}

module.exports = STELLAIntegration;