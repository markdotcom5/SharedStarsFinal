const EventEmitter = require('events');

class AIOrchestrator extends EventEmitter {
    constructor() {
        super(); // ✅ Enables event handling

        this.aiGuidance = require('./AIGuidanceSystem');
        this.aiCoach = require('./AISpaceCoach');
        this.aiAssistant = require('./AIAssistant');
        this.leaderboard = require('./rankingService');
    }

    async processUserAction(userId, action, data) {
        try {
            console.log(`🔄 Processing user action: ${action} for User ID: ${userId}`);

            // ✅ Execute all async tasks in parallel to improve performance
            const [leaderboardUpdate, guidance, coaching, achievements] = await Promise.all([
                this.leaderboard.handleScoreUpdate(userId, data),
                this.aiGuidance.processRealTimeAction(userId, action),
                this.aiCoach.generateCoachingSuggestions({ userId, actionData: data }),
                this.aiAssistant.analyzeAchievementProgress(data.achievements),
            ]);

            console.log(`✅ User ${userId} action processed successfully:`, {
                leaderboard: leaderboardUpdate,
                guidance,
                coaching,
                achievements,
            });

            // ✅ Emit event to notify listeners (e.g., AIServiceIntegrator)
            this.emit('user-action-processed', {
                userId,
                action,
                leaderboardUpdate,
                guidance,
                coaching,
                achievements,
            });

            return { leaderboard: leaderboardUpdate, guidance, coaching, achievements };
        } catch (error) {
            console.error(`❌ AI Orchestration Error for User ${userId}:`, error);
            throw error;
        }
    }
}

module.exports = new AIOrchestrator();
