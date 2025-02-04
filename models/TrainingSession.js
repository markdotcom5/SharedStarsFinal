const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AIAssistant = require("../services/aiAssistant");
const AIController = require("../controllers/AIController");

const trainingSessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionType: { 
    type: String, 
    required: true,
    enum: ["training", "assessment", "physical", "mental", "technical", "simulation", "certification"]
  },
  moduleId: {
    type: Schema.Types.ObjectId,
    ref: "Module",
    required: function() { 
      return ["training", "technical"].includes(this.sessionType);
    }
  },
  dateTime: { type: Date, required: true, default: Date.now },
  status: { 
    type: String, 
    enum: ["scheduled", "in-progress", "completed", "cancelled"],
    default: "in-progress" 
  },
  adaptiveAI: {
    enabled: { type: Boolean, default: true },
    skillFactors: { physical: Number, technical: Number, mental: Number },
    lastAdjustment: { type: Date, default: Date.now }
  },
  metrics: {
    completionRate: { type: Number, min: 0, max: 100, default: 0 },
    effectivenessScore: { type: Number, min: 0, max: 100, default: 0 },
    overallRank: { type: Number, default: 999999 }
  },
  aiGuidance: {
    recommendations: [String],
    liveAdaptations: [String]
  },
  assessment: {
    score: { type: Number },
    aiRecommendations: [String],
    completedAt: { type: Date }
  },
  achievements: [{
    name: String,
    description: String,
    earnedAt: { type: Date, default: Date.now }
  }],
  lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

trainingSessionSchema.pre("save", function(next) {
  this.lastUpdated = new Date();
  next();
});

// 🏆 Training Session Schema Method
trainingSessionSchema.methods.completeAssessment = async function(score) {
  if (!this.assessment) {
    throw new Error("No active assessment found");
  }

  const aiAnalysis = await AIController.generateTrainingContent({ module: this.moduleId });

  this.assessment.score = score;
  this.assessment.aiRecommendations = aiAnalysis.content;
  this.assessment.completedAt = new Date();
  await this.save();

  return {
    score,
    recommendations: aiAnalysis.content
  };
};

// Prevent OverwriteModelError by checking if the model already exists
module.exports = mongoose.models.TrainingSession 
  ? mongoose.models.TrainingSession 
  : mongoose.model("TrainingSession", trainingSessionSchema);
