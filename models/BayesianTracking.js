class BayesianTracker {
    constructor() {
      this.knowledgeData = {}; // Store user knowledge data
    }
  
    async updateKnowledgeState(userId, moduleId, success) {
      if (!this.knowledgeData[userId]) {
        this.knowledgeData[userId] = {};
      }
      this.knowledgeData[userId][moduleId] = success ? "Mastered" : "Needs Improvement";
    }
  
    async getSkillMastery(userId, moduleId) {
      return this.knowledgeData[userId]?.[moduleId] || "Unknown";
    }
  
    async identifyKnowledgeGaps(userId) {
      return Object.keys(this.knowledgeData[userId] || {}).filter(
        (moduleId) => this.knowledgeData[userId][moduleId] === "Needs Improvement"
      );
    }
  }
  
  // ✅ Ensure correct export
  module.exports = BayesianTracker;
  