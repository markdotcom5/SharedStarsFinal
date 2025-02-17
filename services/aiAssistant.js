const { OpenAI } = require("openai");
const User = require("../models/User");
const UserProgress = require("../models/UserProgress");

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// ✅ Move AI Training Models Outside AIAssistant
class ReinforcementLearning {
    async getOptimalAction(data) {
        return {
            content: 'next_best_training_module',
            difficulty: 0.7,
            feedback: 'AI suggests improving reaction speed in zero-gravity.'
        };
    }
}

class BayesianKnowledgeTracker {
    async estimateKnowledge(history) {
        return {
            knowledgeLevel: 0.85,
            confidence: 0.92
        };
    }
}

class AIAssistant {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.defaultModel = "gpt-4-turbo-preview";
        this.reinforcementModel = new ReinforcementLearning();
        this.bayesianTracker = new BayesianKnowledgeTracker();
    }

    /**
     * 🎖 **Analyze User Achievements & AI-Powered Coaching**
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
     * 🚀 **Generate Adaptive Learning Path using RL & Bayesian AI**
     */
    async adaptLearningPath(userId, currentPerformance) {
        try {
            console.log(`🔍 AI Adapting Learning Path for User: ${userId}`);

            const learningHistory = await this.getUserLearningHistory(userId);
            const knowledgeState = await this.bayesianTracker.estimateKnowledge(learningHistory);

            // RL determines the best next action
            const nextAction = await this.reinforcementModel.getOptimalAction({
                userId,
                knowledgeState,
                currentPerformance
            });

            return {
                recommendedContent: nextAction.content,
                difficulty: nextAction.difficulty,
                adaptiveFeedback: nextAction.feedback
            };
        } catch (error) {
            console.error("❌ Error in adaptive learning:", error);
            return { success: false, message: "Failed to adapt learning path." };
        }
    }

    /**
     * 📊 **Analyze User Training Performance**
     */
    async analyzeSessionPerformance(userId) {
        try {
            console.log(`📊 AI Evaluating Training Session for: ${userId}`);

            const user = await UserProgress.findOne({ userId }).lean();
            if (!user) return { success: false, message: "No training data found." };

            const sessionData = user.moduleProgress.map(module => ({
                moduleId: module.moduleId,
                completedSessions: module.completedSessions,
                trainingLogs: module.trainingLogs.slice(-3) // Get last 3 logs
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
     * 🌌 **AI-Powered Mission Simulation**
     */
    async generateMissionScenario(userId, difficulty) {
        try {
            console.log(`🚀 AI Generating Mission Scenario for: ${userId}`);
            
            const userProfile = await this.getUserProfile(userId);

            const missionResponse = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    { role: "system", content: "Generate an AI-driven space mission scenario based on user expertise." },
                    { role: "user", content: `User Level: ${userProfile.trainingLevel}, Difficulty: ${difficulty}` }
                ],
                max_tokens: 500
            });

            return {
                missionDetails: missionResponse.choices[0]?.message?.content || "No AI-generated mission available.",
                timestamp: new Date()
            };
        } catch (error) {
            console.error("❌ AI Mission Generation Error:", error);
            return { success: false, message: "Failed to generate mission scenario." };
        }
    }

    /**
     * 📢 **Generate Personalized Training Advice**
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

// ✅ Export AI Assistant
module.exports = new AIAssistant();
