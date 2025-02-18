// services/LeaderboardService.js
const SocialPlatformIntegrator = require('../services/SocialPlatformIntegrator');
const User = require('../models/User'); // ✅ Assuming a User model exists
const mongoose = require('mongoose');

class LeaderboardService {
    constructor() {
        console.log('✅ Leaderboard Service Initialized');
    }

    // ✅ Get current leaderboard rankings
    async getLeaderboard(top = 10) {
        try {
            const leaderboard = await User.find()
                .sort({ leaderboardScore: -1 })
                .limit(top)
                .select('name leaderboardScore email');

            return leaderboard;
        } catch (error) {
            console.error('❌ Error fetching leaderboard:', error);
            throw error;
        }
    }

    // ✅ Update user leaderboard ranking
    async updateLeaderboard(userId, newScore) {
        try {
            const user = await User.findById(userId);
            if (!user) throw new Error('User not found');

            const oldRank = await this.getUserRank(userId);
            user.leaderboardScore = newScore;
            await user.save();

            const newRank = await this.getUserRank(userId);

            console.log(`🏆 Leaderboard Updated: ${user.name} is now ranked #${newRank}`);

            // ✅ If user moves up in ranking, announce update
            if (newRank < oldRank) {
                await SocialPlatformIntegrator.shareEvent('leaderboardUpdate', {
                    user,
                    details: { position: newRank, score: newScore },
                });
            }

            return { success: true, newRank, score: newScore };
        } catch (error) {
            console.error('❌ Error updating leaderboard:', error);
            throw error;
        }
    }

    // ✅ Get user’s rank
    async getUserRank(userId) {
        try {
            const leaderboard = await User.find().sort({ leaderboardScore: -1 }).select('_id');

            return leaderboard.findIndex((u) => u._id.toString() === userId.toString()) + 1;
        } catch (error) {
            console.error('❌ Error fetching user rank:', error);
            return -1;
        }
    }
}

module.exports = new LeaderboardService();
