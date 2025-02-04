const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AIAssistant = require("../services/aiAssistant");
const AIController = require("../controllers/AIController");

// ✅ Define the Schema FIRST
const subscriptionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    plan: {
        type: String,
        enum: ["individual", "family", "galactic"],
        required: true
    },
    aiEngagementLevel: { 
        type: String, 
        enum: ["low", "medium", "high", "ultra"], 
        default: "medium"
    },
    status: { 
        type: String, 
        enum: ["active", "cancelled", "expired", "pending"],
        default: "active"
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    aiPoweredAdjustments: [{
        date: { type: Date, default: Date.now },
        adjustmentType: String,
        reason: String
    }]
}, { timestamps: true });

// ✅ Now Define Methods After Schema Declaration
subscriptionSchema.methods.adjustAIEngagement = async function() {
    const aiAssistant = new AIAssistant();
    const engagementAnalysis = await aiAssistant.analyzeAchievementProgress(this);

    this.aiEngagementLevel = engagementAnalysis.metrics.completionRate > 80 ? "high" : "medium";
    await this.save();

    return {
        engagementLevel: this.aiEngagementLevel,
        recommendations: engagementAnalysis.recommendations
    };
};

module.exports = mongoose.model("Subscription", subscriptionSchema);
