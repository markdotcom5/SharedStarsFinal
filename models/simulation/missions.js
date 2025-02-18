const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema(
    {
        missionName: { type: String, required: true, unique: true },
        missionBrief: { type: String, required: true },
        scenario: { type: mongoose.Schema.Types.ObjectId, ref: 'Scenario' }, // Links to Scenario
        requiredTeamRoles: [{ type: String }], // Example: ["Commander", "Engineer"]
        completionCriteria: { type: String, required: true },
        rewardPoints: { type: Number, default: 100 },
        difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true }, // ✅ AI-driven difficulty
        progressTracking: {
            stepsCompleted: { type: Number, default: 0 },
            totalSteps: { type: Number, default: 5 }, // ✅ Ensuring progressive mission tracking
        },
    },
    { timestamps: true }
);

const Mission = mongoose.model('Mission', missionSchema);
module.exports = Mission;
