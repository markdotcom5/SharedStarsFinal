const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AIAssistant = require("../services/aiAssistant");
const AIController = require("../controllers/AIController");

const leaderboardSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { 
        type: String, 
        enum: ["global", "weekly", "monthly", "technical", "physical", "missions"], 
        default: "global" 
    },
    score: { type: Number, required: true, default: 0 },
    rank: { type: Number, required: true },
    skillFactors: {
        physical: { type: Number, default: 0 },
        technical: { type: Number, default: 0 },
        mental: { type: Number, default: 0 }
    },
    liveEngagementScore: { type: Number, default: 0 },
    lastUpdated: { type: Date, default: Date.now }
}, { timestamps: true });

leaderboardSchema.methods.updateRank = async function() {
    const leaderboard = await this.constructor.find({ category: this.category }).sort({ score: -1 });
    this.rank = leaderboard.findIndex(entry => entry.userId.equals(this.userId)) + 1;
    await this.save();
};

leaderboardSchema.methods.updateRank = async function() {
    const strategy = await AIController.generateLeaderboardStrategy({ user: this.userId, leaderboardData: await this.constructor.find({ category: this.category }) });

    this.rank = strategy.rankAnalysis.currentRank;
    await this.save();

    return strategy;
};

module.exports = mongoose.model("Leaderboard", leaderboardSchema);
