const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Subscription = require('../models/Subscription');
const Achievement = require('../models/Achievement');
const TrainingSession = require('../models/TrainingSession');

class CreditSystem {
    constructor() {
        console.log("✅ Credit System Initialized");
    }

    async calculateUserCredits(userId) {
        try {
            const [progress, subscription] = await Promise.all([
                UserProgress.findOne({ userId }),
                Subscription.findOne({ userId, status: 'active' })
            ]);

            let totalCredits = progress?.credits || 0;

            // Subscription-based bonus
            if (subscription) {
                const creditMap = {
                    'individual': 100,
                    'family': 250,
                    'elite': 1000,
                    'custom': (amount) => Math.floor(amount * 2)
                };
                totalCredits += creditMap[subscription.type] || 0;
            }

            return totalCredits;
        } catch (error) {
            console.error("❌ Error calculating credits:", error);
            return 0;
        }
    }

    async updateCreditsForProgress(userId, progressData) {
        try {
            const progress = await UserProgress.findOneAndUpdate(
                { userId },
                { $inc: { credits: progressData.earnedCredits || 0 } },
                { new: true, upsert: true }
            );

            return progress.credits;
        } catch (error) {
            console.error("❌ Error updating credits:", error);
            return 0;
        }
    }
}

module.exports = CreditSystem;
