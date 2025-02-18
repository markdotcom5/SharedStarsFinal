const TrainingSession = require('../models/TrainingSession');
const UserProgress = require('../models/UserProgress');
const SpaceTimelineManager = require('./SpaceTimelineManager');
const websocketService = require('./websocketService');
const notificationService = require('./notificationService'); // ✅ Ensure this is imported

class ModuleCreditSystem {
    static BASE_CREDITS = {
        physical: 100,
        technical: 150,
        simulation: 200,
        assessment: 100,
        mental: 125,
        certification: 300,
        default: 100, // ✅ Added default case
    };

    static STREAK_MULTIPLIERS = {
        3: 1.2,
        5: 1.5,
        7: 2.0,
    };

    async calculateModuleCredits(sessionId) {
        try {
            console.log(`🔍 Calculating credits for session: ${sessionId}`);

            const session = await TrainingSession.findById(sessionId);
            if (!session) throw new Error('❌ Session not found');

            const moduleType = session.moduleType || 'default';
            let credits = ModuleCreditSystem.BASE_CREDITS[moduleType] || 100;

            const performanceMultiplier = this.calculatePerformanceMultiplier(session.metrics);
            credits *= performanceMultiplier;

            const streak = await this.calculateCurrentStreak(session.userId);
            const streakMultiplier = this.getStreakMultiplier(streak);
            credits *= streakMultiplier;

            credits = Math.round(credits);

            return {
                baseCredits: ModuleCreditSystem.BASE_CREDITS[moduleType],
                earnedCredits: credits,
                performanceMultiplier,
                streakMultiplier,
                streak,
            };
        } catch (error) {
            console.error('❌ Error calculating module credits:', error);
            throw error;
        }
    }

    calculatePerformanceMultiplier(metrics = {}) {
        let multiplier = 1;

        if (metrics.completionRate && metrics.completionRate > 0) {
            multiplier += (metrics.completionRate / 100) * 0.5;
        }

        if (metrics.effectivenessScore && metrics.effectivenessScore > 0) {
            multiplier += (metrics.effectivenessScore / 100) * 0.3;
        }

        return multiplier;
    }

    async calculateCurrentStreak(userId) {
        try {
            console.log(`🔍 Calculating streak for user: ${userId}`);
            const sessions = await TrainingSession.find({
                userId,
                status: 'completed',
                dateTime: { $exists: true },
            })
                .sort({ dateTime: -1 })
                .limit(30);

            if (!sessions.length) return 0;
            if (!sessions[0].dateTime) return 0;

            let lastDate = new Date(sessions[0].dateTime);
            if (isNaN(lastDate)) return 0;

            lastDate = lastDate.toDateString();
            let streak = 1;

            for (let i = 1; i < sessions.length; i++) {
                const currentDate = new Date(sessions[i].dateTime);
                if (!currentDate || isNaN(currentDate)) continue;

                const dayDiff = Math.floor(
                    (new Date(lastDate) - currentDate) / (1000 * 60 * 60 * 24)
                );

                if (dayDiff === 1) {
                    streak++;
                    lastDate = currentDate.toDateString();
                } else {
                    break;
                }
            }

            return streak;
        } catch (error) {
            console.error('❌ Error calculating streak:', error);
            return 0;
        }
    }

    async awardCredits(sessionId) {
        try {
            console.log(`🏆 Awarding credits for session: ${sessionId}`);

            const creditInfo = await this.calculateModuleCredits(sessionId);
            const session = await TrainingSession.findById(sessionId);

            if (!session) throw new Error('❌ Session not found');

            await UserProgress.findOneAndUpdate(
                { userId: session.userId },
                {
                    $inc: { credits: creditInfo.earnedCredits },
                    $set: { lastCreditAward: new Date() },
                },
                { upsert: true }
            );

            if (notificationService && typeof notificationService.sendNotification === 'function') {
                notificationService.sendNotification(session.userId, {
                    title: '🎉 Credits Earned!',
                    message: `You earned ${creditInfo.earnedCredits} credits from ${session.moduleType}! Keep training!`,
                    type: 'creditReward',
                });
            } else {
                console.warn('⚠️ Warning: notificationService is unavailable.');
            }

            return creditInfo;
        } catch (error) {
            console.error('❌ Error awarding credits:', error);
            throw error;
        }
    }
}

module.exports = new ModuleCreditSystem();
