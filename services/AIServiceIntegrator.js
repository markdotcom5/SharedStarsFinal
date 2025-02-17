const EventEmitter = require('events');
const AILearningSystem = require('./AILearningSystem');  // ✅ Import the correct module
const AIGuidanceSystem = require('./AIGuidanceSystem');
const AIOrchestrator = require('./AIOrchestrator');
const AISpaceCoach = require('./AISpaceCoach');
const AIWebController = require('./AIWebController');
const SocialPlatformIntegrator = require('../services/SocialPlatformIntegrator');

class AIServiceIntegrator extends EventEmitter {
    constructor() {
        super(); // ✅ Enables event handling for better system coordination

        this.learningSystem = AILearningSystem; 
        this.guidanceSystem = AIGuidanceSystem;
        this.orchestrator = AIOrchestrator;
        this.spaceCoach = AISpaceCoach;
        this.webController = AIWebController;

        this.setupIntegrations();
    }

    setupIntegrations() {
        // ✅ Ensure all services support event listeners before binding
        this.validateServices();

        // ✅ Connect Learning System with Guidance System
        this.learningSystem.on('learning-update', async (data) => {
            try {
                console.log(`🔄 Learning update received for user ${data.userId}`);
                const guidance = await this.guidanceSystem.generateGuidance(data);
                await this.orchestrator.processGuidance(guidance);
            } catch (error) {
                console.error(`❌ Error processing learning update:`, error);
            }
        });

        // ✅ Connect Space Coach with Learning System
        this.spaceCoach.on('coaching-request', async (data) => {
            try {
                console.log(`📢 Coaching request received for user ${data.userId}`);
                const adaptivePath = await this.learningSystem.adaptLearningPath(
                    data.userId,
                    data.performance
                );
                await this.spaceCoach.provideCoaching(data.userId, adaptivePath);
            } catch (error) {
                console.error(`❌ Error handling coaching request:`, error);
            }
        });

        // ✅ Connect Orchestrator with Web Controller
        this.orchestrator.on('state-change', async (state) => {
            try {
                console.log(`🔄 Orchestrator state changed: ${state}`);
                await this.webController.updateUIState(state);
            } catch (error) {
                console.error(`❌ Error updating UI state:`, error);
            }
        });
    }

    // ✅ Performance Analysis Integration
    async handlePerformanceAnalysis(userId, performanceData) {
        try {
            console.log(`📊 Analyzing performance for user ${userId}`);

            const analysis = await this.learningSystem.analyzeBiometricData(userId, performanceData);
            const [guidance, nextSteps] = await Promise.all([
                this.guidanceSystem.generatePerformanceGuidance(analysis),
                this.spaceCoach.getNextSteps(userId),
            ]);

            await Promise.all([
                this.spaceCoach.updateCoachingStrategy(userId, analysis),
                this.orchestrator.handlePerformanceUpdate({ userId, analysis, guidance }),
            ]);

            return { analysis, guidance, nextSteps };
        } catch (error) {
            console.error('❌ Error in performance analysis integration:', error);
            throw error;
        }
    }

    // ✅ Engagement Optimization Integration
    async handleEngagementOptimization(userId) {
        try {
            console.log(`🔄 Optimizing engagement for user ${userId}`);

            const engagement = await this.learningSystem.optimizeEngagement(userId);

            if (engagement.risk === 'high') {
                console.log(`⚠️ High disengagement risk detected for user ${userId}`);

                const [intervention, recommendations] = await Promise.all([
                    this.guidanceSystem.generateIntervention(userId),
                    this.spaceCoach.getEngagementRecommendations(userId),
                ]);

                await Promise.all([
                    this.orchestrator.executeIntervention(intervention),
                    this.spaceCoach.provideMotivationalCoaching(userId),
                ]);

                await this.webController.updateEngagementUI({ userId, engagement, recommendations });
            }

            return engagement;
        } catch (error) {
            console.error('❌ Error in engagement optimization:', error);
            throw error;
        }
    }

    // ✅ Social Sharing Triggers
    async handleAchievement(userId, achievement) {
        console.log(`🏆 User ${userId} earned achievement: ${achievement.name}`);
        await SocialPlatformIntegrator.shareEvent("achievement", { userId, achievement });
    }

    async handleCertification(userId, certification) {
        console.log(`🎓 User ${userId} earned certification: ${certification.name}`);
        await SocialPlatformIntegrator.shareEvent("certification", { userId, certification });
    }

    async handleMissionCompletion(userId, mission) {
        console.log(`🚀 User ${userId} completed mission: ${mission.name}`);
        await SocialPlatformIntegrator.shareEvent("missionComplete", { userId, mission });
    }

    async handleSquadTraining(userId, squad) {
        console.log(`👨‍🚀 User ${userId} joined Squad: ${squad.name}`);
        await SocialPlatformIntegrator.shareEvent("teamFormation", { userId, squad });
    }

    async handleLeaderboardUpdate(userId, leaderboard) {
        console.log(`🏅 User ${userId} moved up in Leaderboard Rank: ${leaderboard.rank}`);
        await SocialPlatformIntegrator.shareEvent("leaderboardUpdate", { userId, leaderboard });
    }

    async handleMilestone(userId, milestone) {
        console.log(`🎯 User ${userId} reached milestone: ${milestone.name}`);
        await SocialPlatformIntegrator.shareEvent("milestone", { userId, milestone });
    }

    async handleVRTrainingCompletion(userId, session) {
        console.log(`🕶️ User ${userId} completed VR Training: ${session.name}`);
        await SocialPlatformIntegrator.shareEvent("moduleComplete", { userId, session });
    }

    // ✅ Service Validation
    validateServices() {
        const services = {
            learningSystem: this.learningSystem,
            guidanceSystem: this.guidanceSystem,
            orchestrator: this.orchestrator,
            spaceCoach: this.spaceCoach,
            webController: this.webController
        };

        for (const [name, service] of Object.entries(services)) {
            if (!(service instanceof EventEmitter)) {
                console.error(`❌ Warning: ${name} is not an EventEmitter!`);
            }
        }
    }
}

module.exports = AIServiceIntegrator;

