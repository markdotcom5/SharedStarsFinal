console.log("✅ aiServices.js loaded successfully!");

class AIAssistant {
    constructor() {
        console.log("AIAssistant instance created!");
        // OpenAI setup (if needed)
    }

    async generateTrainingInsights(userId, moduleId) {
        console.log(`Generating training insights for userId: ${userId}, moduleId: ${moduleId}`);
        // Add implementation logic here
    }

    async generateRecommendation(userId, context) {
        console.log(`Generating recommendation for userId: ${userId}, context: ${context}`);
        return `Recommendation for userId: ${userId}`; // Replace with actual logic
    }
}

// ✅ Ensure you export the class
module.exports = AIAssistant;
