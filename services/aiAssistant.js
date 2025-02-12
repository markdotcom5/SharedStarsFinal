const { OpenAI } = require("openai");
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

class AIAssistant {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.defaultModel = "gpt-4-turbo-preview";
    }

    /**
     * 🎖 **Analyze User Achievements**
     * - Evaluates achievement progress.
     * - Identifies patterns and improvement areas.
     */
    async analyzeAchievementProgress(userId) {
        try {
            console.log(`🔍 AI Analyzing Achievements for User: ${userId}`);
            
            const user = await UserProgress.findOne({ userId }).lean();
            if (!user || !user.achievements.length) {
                return { success: false, message: "No achievements found." };
            }

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Analyze user achievements and suggest improvements." },
                    { role: "user", content: `Achievements: ${JSON.stringify(user.achievements)}` }
                ],
                max_tokens: 500
            });

            return {
                success: true,
                analysis: completion.choices[0]?.message?.content || "No AI insights available.",
                insights: this.analyzePerformanceTrends(user.achievements),
                nextMilestones: this.identifyNextMilestones(user.achievements),
                timestamp: new Date()
            };
        } catch (error) {
            console.error("❌ AI Achievement Analysis Error:", error);
            return { success: false, message: "Failed to analyze achievement progress." };
        }
    }

    /**
     * 🏆 **AI Performance Trends**
     * - Identifies patterns in training progress.
     */
    analyzePerformanceTrends(achievements) {
        const totalAchievements = achievements.length;
        const completed = achievements.filter(a => a.completed).length;
        const completionRate = totalAchievements ? (completed / totalAchievements) * 100 : 0;

        return {
            trend: completionRate > 80 ? "Excellent" : completionRate > 50 ? "Improving" : "Needs Improvement",
            insights: completionRate > 80 ? "You're mastering your training!" : "Focus on completing more tasks to level up!"
        };
    }

    /**
     * 🚀 **Identify Next Milestones**
     * - Predicts next certification or training step.
     */
    identifyNextMilestones(achievements) {
        if (!achievements.length) return ["Start Training"];
        return achievements.length > 5 ? ["Advanced Simulation", "Elite Certification"] : ["Complete Next Training"];
    }

    /**
     * 🏋️‍♂️ **Session Analysis & AI Feedback**
     * - Evaluates user training sessions.
     * - Recommends personalized regimens.
     */
    async analyzeSessionPerformance(userId) {
        try {
            console.log(`📊 AI Evaluating Training Session for: ${userId}`);

            const user = await UserProgress.findOne({ userId }).lean();
            if (!user) return { success: false, message: "No training data found." };

            const sessionData = user.moduleProgress.map(module => ({
                moduleId: module.moduleId,
                completedSessions: module.completedSessions,
                trainingLogs: module.trainingLogs.slice(-3) // Get last 3 logs for recent analysis
            }));

            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Analyze user training sessions and suggest personalized improvements." },
                    { role: "user", content: `Training Data: ${JSON.stringify(sessionData)}` }
                ],
                max_tokens: 500
            });

            return {
                success: true,
                feedback: completion.choices[0]?.message?.content || "No AI insights available.",
                timestamp: new Date()
            };
        } catch (error) {
            console.error("❌ AI Session Analysis Failed:", error);
            return { success: false, message: "Failed to analyze session performance." };
        }
    }

    /**
     * 🎯 **AI-Driven Recommendations**
     * - Provides smart training suggestions.
     */
    generateRecommendations(analysis) {
        return analysis
            .split("\n")
            .filter(line => line.includes("recommend") || line.includes("should"))
            .map(line => line.trim()) || ["No specific recommendations found"];
    }

    /**
     * 📢 **Personalized Training Advice**
     * - AI suggests the best learning path for the user.
     */
    async generateTrainingPlan(userId) {
        try {
            console.log(`🔍 AI Generating Personalized Training for User: ${userId}`);

            const user = await UserProgress.findOne({ userId }).lean();
            if (!user) return { success: false, message: "User progress not found." };

            const plan = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Generate an AI-personalized space training plan based on user progress." },
                    { role: "user", content: `User Data: ${JSON.stringify(user)}` }
                ],
                max_tokens: 500
            });

            return {
                success: true,
                trainingPlan: plan.choices[0]?.message?.content || "AI training plan unavailable.",
                timestamp: new Date()
            };
        } catch (error) {
            console.error("❌ AI Training Plan Generation Error:", error);
            return { success: false, message: "Failed to generate training plan." };
        }
    }
}

// ✅ Export AI Assistant as a Singleton
module.exports = new AIAssistant();
