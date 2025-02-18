// routes/countdown.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const UserProgress = require('../models/UserProgress');

// Helper function to calculate time remaining
function calculateTimeRemaining(targetDate) {
    if (!targetDate) return null;

    const now = new Date();
    const target = new Date(targetDate);
    const diff = target - now;

    if (diff <= 0) return null;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / 30.44); // Average month length
    const years = Math.floor(days / 365.25); // Account for leap years

    return {
        years: years,
        months: months % 12,
        weeks: weeks % 4,
        days: days % 7,
        hours: hours % 24,
        minutes: minutes % 60,
        seconds: seconds % 60,
        totalSeconds: seconds,
        formatted: `${years ? years + 'y ' : ''}${months % 12 ? (months % 12) + 'm ' : ''}${weeks % 4 ? (weeks % 4) + 'w ' : ''}${days % 7 ? (days % 7) + 'd ' : ''}${hours % 24}h ${minutes % 60}m ${seconds % 60}s`,
    };
}

// Get user's countdown status
router.get('/user', authenticate, async (req, res) => {
    try {
        const [userProgress, user] = await Promise.all([
            UserProgress.findOne({ userId: req.user._id }),
            User.findById(req.user._id).select('leaderboard subscription'),
        ]);

        if (!userProgress) {
            return res.status(404).json({
                success: false,
                error: 'No progress found for this user',
            });
        }

        // Calculate countdowns for active modules
        const countdowns = userProgress.moduleProgress.map((progress) => {
            const nextSessionDate = progress.lastSessionDate
                ? new Date(progress.lastSessionDate.getTime() + 24 * 60 * 60 * 1000)
                : new Date();

            const streakExpiryDate = progress.lastSessionDate
                ? new Date(progress.lastSessionDate.getTime() + 48 * 60 * 60 * 1000)
                : null;

            // Adjust moduleExpiryDate based on leaderboard score
            let moduleExpiryDays = 90;
            if (user.leaderboard.score > 1000) moduleExpiryDays *= 0.9;
            if (user.leaderboard.score > 2000) moduleExpiryDays *= 0.8;

            const moduleExpiryDate = progress.startDate
                ? new Date(progress.startDate.getTime() + moduleExpiryDays * 24 * 60 * 60 * 1000)
                : null;

            return {
                moduleId: progress.moduleId,
                deadlines: {
                    nextSession: {
                        date: nextSessionDate,
                        remaining: calculateTimeRemaining(nextSessionDate),
                    },
                    streakExpiry: {
                        date: streakExpiryDate,
                        remaining: calculateTimeRemaining(streakExpiryDate),
                    },
                    moduleExpiry: {
                        date: moduleExpiryDate,
                        remaining: calculateTimeRemaining(moduleExpiryDate),
                    },
                },
                streak: progress.streak || 0,
                nextMilestone: progress.nextMilestone,
                streakAt: progress.streak || 0,
                leaderboardImpact: {
                    scoreModifier:
                        user.leaderboard.score > 2000
                            ? 0.8
                            : user.leaderboard.score > 1000
                              ? 0.9
                              : 1,
                    currentScore: user.leaderboard.score,
                },
            };
        });

        res.json({
            success: true,
            countdowns,
            leaderboard: {
                currentScore: user.leaderboard.score,
                rank: user.leaderboard.rank,
                recentHistory: user.leaderboard.history.slice(-5),
            },
            serverTime: new Date(),
        });
    } catch (error) {
        console.error('❌ Error fetching countdown:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch countdown information',
        });
    }
});
// Get specific module countdown
router.get('/module/:moduleId', authenticate, async (req, res) => {
    try {
        const { moduleId } = req.params;
        const userProgress = await UserProgress.findOne({
            userId: req.user._id,
            'moduleProgress.moduleId': moduleId,
        });

        if (!userProgress) {
            return res.status(404).json({
                success: false,
                error: 'No progress found for this module',
            });
        }

        const moduleProgress = userProgress.moduleProgress.find((p) => p.moduleId === moduleId);

        if (!moduleProgress) {
            return res.status(404).json({
                success: false,
                error: 'Module progress not found',
            });
        }

        const nextSessionDate = moduleProgress.lastSessionDate
            ? new Date(moduleProgress.lastSessionDate.getTime() + 24 * 60 * 60 * 1000)
            : new Date();

        const streakExpiryDate = moduleProgress.lastSessionDate
            ? new Date(moduleProgress.lastSessionDate.getTime() + 48 * 60 * 60 * 1000)
            : null;

        const moduleExpiryDate = moduleProgress.startDate
            ? new Date(moduleProgress.startDate.getTime() + 90 * 24 * 60 * 60 * 1000)
            : null;

        const countdown = {
            moduleId,
            deadlines: {
                nextSession: {
                    date: nextSessionDate,
                    remaining: calculateTimeRemaining(nextSessionDate),
                },
                streakExpiry: {
                    date: streakExpiryDate,
                    remaining: calculateTimeRemaining(streakExpiryDate),
                },
                moduleExpiry: {
                    date: moduleExpiryDate,
                    remaining: calculateTimeRemaining(moduleExpiryDate),
                },
            },
            streak: moduleProgress.streak || 0,
            nextMilestone: moduleProgress.nextMilestone,
            streakAt: moduleProgress.streak || 0,
        };

        res.json({
            success: true,
            countdown,
            serverTime: new Date(),
        });
    } catch (error) {
        console.error('❌ Error fetching module countdown:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch module countdown information',
        });
    }
});

module.exports = router;
