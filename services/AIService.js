const mongoose = require("mongoose");
const { EventEmitter } = require("events");
const { OpenAI } = require("openai");

const User = require("../models/User");
const UserProgress = require("../models/UserProgress");
const Subscription = require("../models/Subscription");
const Achievement = require("../models/Achievement");
const Session = require("../models/Session");

// ✅ Initialize OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "MISSING_KEY",
});

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MISSING_KEY") {
  console.error("❌ ERROR: Missing OpenAI API Key!");
  process.exit(1);
}

// ✅ AIService (Merged from all AI services)
class AIService extends EventEmitter {
  constructor(options = {}) {
    super();
    console.log("✅ AIService Initialized!");

    this.options = {
      responseDelay: 500,
      useMockData: process.env.NODE_ENV !== "production",
      ...options,
    };

    this.trainingPhases = {
      1: "Foundation",
      2: "Adaptation",
      3: "Integration",
      4: "Mastery",
      5: "Advanced",
    };

    this.initializeAchievementSystem();
    this.initializeGamificationSystem();
    this.initializeLearningModels();
  }

  // =====================
  // System Initialization
  // =====================
  
  initializeLearningModels() {
    this.reinforcementModel = new ReinforcementLearning();
    this.bayesianTracker = new BayesianKnowledgeTracker();
  }

  initializeAchievementSystem() {
    this.achievementTypes = {
      ASSESSMENT_MASTER: {
        id: "assessment_master",
        threshold: 90,
        description: "Score 90% or higher on assessments",
        icon: "🎯",
      },
      QUICK_LEARNER: {
        id: "quick_learner",
        threshold: 5,
        description: "Complete 5 modules in record time",
        icon: "⚡",
      },
      CONSISTENCY_KING: {
        id: "consistency_king",
        threshold: 7,
        description: "7-day training streak",
        icon: "👑",
      },
    };
  }

  initializeGamificationSystem() {
    this.gamificationSystem = {
      challenges: new Map(),
      leaderboards: new Map(),
      rewards: new Map(),
    };
  }

  // =====================
  // AI-Powered Training & Insights
  // =====================

  async generateTrainingInsights(userId, moduleId) {
    console.log(`📊 AI Generating training insights for user: ${userId}, module: ${moduleId}`);

    const user = await User.findById(userId).select("trainingPhase skills");
    if (!user) return { error: "User not found" };

    return {
      summary: `User ${userId} is in ${this.trainingPhases[user.trainingPhase]} phase.`,
      nextSteps: ["Continue next session", "Adjust workout intensity"],
    };
  }

  async generateRecommendation(userId, context) {
    console.log(`🔍 AI Generating recommendation for user: ${userId}, context: ${context}`);
    return {
      recommendation: `Suggested action for user ${userId}`,
      details: "More advanced recommendation logic will be applied here.",
    };
  }

  async getRealtimeGuidance(userId, activity, metrics) {
    try {
      const user = await User.findById(userId).select("trainingPhase skills");
      if (!user) throw new Error("User not found");

      const guidance = this._generateGuidance(user.trainingPhase, activity, metrics, user.skills || {});
      await this._logInteraction(userId, activity, metrics, guidance);

      return guidance;
    } catch (error) {
      console.error("STELLA guidance error:", error);
      return { message: "STELLA is recalibrating.", actionItems: [] };
    }
  }

  async evaluateTrainingPhase(userId) {
    try {
      const user = await User.findById(userId).select("trainingPhase skills");
      const recentSessions = await Session.find({
        userId: mongoose.Types.ObjectId(userId),
        completedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }).sort({ completedAt: -1 }).limit(10);

      const shouldAdvance = this._evaluatePhaseProgression(user, recentSessions);

      if (shouldAdvance && user.trainingPhase < 5) {
        user.trainingPhase += 1;
        await user.save();

        return {
          advanced: true,
          newPhase: user.trainingPhase,
          phaseName: this.trainingPhases[user.trainingPhase],
          message: `🎉 You've advanced to Phase ${user.trainingPhase}: ${this.trainingPhases[user.trainingPhase]}`,
        };
      }

      return {
        advanced: false,
        currentPhase: user.trainingPhase,
        phaseName: this.trainingPhases[user.trainingPhase],
        progressPercentage: this._calculatePhaseProgress(user, recentSessions),
      };
    } catch (error) {
      console.error("Phase evaluation error:", error);
      return { advanced: false, error: "Unable to evaluate training phase" };
    }
  }

  async analyzeSessionPerformance(userId) {
    console.log(`📊 AI Evaluating Training Session for: ${userId}`);

    const user = await UserProgress.findOne({ userId }).lean();
    if (!user) return { success: false, message: "No training data found." };

    return {
      success: true,
      feedback: `AI analysis for user ${userId}: Strong areas detected.`,
      timestamp: new Date(),
    };
  }

  async generateMissionScenario(userId, difficulty) {
    console.log(`🚀 AI Generating Mission Scenario for: ${userId}`);

    const userProfile = await this.getUserProfile(userId);

    return {
      missionDetails: `AI-generated scenario for ${userProfile.trainingLevel}, Difficulty: ${difficulty}`,
      timestamp: new Date(),
    };
  }

  async generateTrainingPlan(userId) {
    console.log(`🔍 AI Generating Personalized Training for User: ${userId}`);

    return {
      success: true,
      trainingPlan: `AI-generated plan for user ${userId}`,
      timestamp: new Date(),
    };
  }

  // =====================
  // Private AI Processing Methods
  // =====================

  _generateGuidance(phase, activity, metrics, skills) {
    const phaseGuidance = {
      1: { message: "Focus on form.", actionItems: ["Maintain steady breathing", "Keep movements controlled"] },
      2: { message: "Work on endurance.", actionItems: ["Maintain heart rate", "Focus on rhythm"] },
    };

    return phaseGuidance[phase] || phaseGuidance[1];
  }

  async _logInteraction(userId, activity, metrics, guidance) {
    console.log(`📂 Logged interaction for user ${userId}, activity: ${activity}`);
  }

  _evaluatePhaseProgression(user, recentSessions) {
    if (recentSessions.length < 5) return false;

    const completionRate = recentSessions.filter(s => s.completion >= 85).length / recentSessions.length;
    return completionRate >= 0.8;
  }

  _calculatePhaseProgress(user, recentSessions) {
    if (recentSessions.length === 0) return 0;
    return 75; // Example progress value
  }
}

// ✅ Export AI Service as Singleton
module.exports = new AIService();
