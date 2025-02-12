// services/AIOrchestrator.js
class AIOrchestrator {
    constructor() {
        this.aiGuidance = require('./AIGuidanceSystem');
        this.aiCoach = require('./AISpaceCoach');
        this.aiAssistant = require('./AIAssistant');
        this.leaderboard = require('./rankingService');
    }

    async processUserAction(userId, action, data) {
        try {
            // Update leaderboard
            const leaderboardUpdate = await this.leaderboard.handleScoreUpdate(userId, data);
            
            // Get AI guidance
            const guidance = await this.aiGuidance.processRealTimeAction(userId, action);
            
            // Get coaching insights
            const coaching = await this.aiCoach.generateCoachingSuggestions({
                userId,
                actionData: data
            });

            // Analyze achievements
            const achievements = await this.aiAssistant.analyzeAchievementProgress(data.achievements);

            return {
                leaderboard: leaderboardUpdate,
                guidance,
                coaching,
                achievements
            };
        } catch (error) {
            console.error('AI Orchestration Error:', error);
            throw error;
        }
    }
}