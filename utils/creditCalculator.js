// utils/creditCalculator.js
class CreditCalculator {
    static BASE_CREDITS = {
        ASSESSMENT: 100,
        TRAINING: 150,
        CERTIFICATION: 500,
    };

    static STREAK_MULTIPLIERS = {
        3: 1.2, // 3 day streak = 20% bonus
        5: 1.5, // 5 day streak = 50% bonus
        7: 2.0, // 7 day streak = 100% bonus
    };

    static calculateSessionCredits(session, userStreak = 1) {
        let baseCredits = this.BASE_CREDITS[session.sessionType.toUpperCase()] || 100;
        let earnedCredits = baseCredits * (session.metrics.completionRate / 100);

        // Apply streak multiplier
        const streakMultiplier = this.getStreakMultiplier(userStreak);
        earnedCredits *= streakMultiplier;

        // Achievement bonus (if any achievements were earned)
        if (session.achievements && session.achievements.length > 0) {
            earnedCredits *= 1.25; // 25% bonus for earning achievements
        }

        return Math.round(earnedCredits);
    }

    static getStreakMultiplier(streakDays) {
        for (const [days, multiplier] of Object.entries(this.STREAK_MULTIPLIERS).reverse()) {
            if (streakDays >= parseInt(days)) {
                return multiplier;
            }
        }
        return 1;
    }
}

module.exports = CreditCalculator;

// routes/creditRoutes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const TrainingSession = require('../models/TrainingSession');
const CreditCalculator = require('../utils/creditCalculator');
const UserProgress = require('../models/UserProgress');

router.post('/training/complete', authenticate, async (req, res) => {
    try {
        const { completionScore } = req.body;

        // Get user's current streak
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        const currentStreak = userProgress?.trainingStreak || 1;

        const trainingSession = new TrainingSession({
            userId: req.user._id,
            moduleType: 'assessment', // ✅ Correct
            status: 'completed',
            dateTime: new Date(),
            metrics: {
                completionRate: completionScore,
                effectivenessScore: completionScore,
                overallRank: 1,
            },
            assessment: {
                score: completionScore,
                completedAt: new Date(),
                aiRecommendations: ['Keep up the great work!'],
            },
        });

        // Calculate credits with enhancements
        const earnedCredits = CreditCalculator.calculateSessionCredits(
            trainingSession,
            currentStreak
        );

        // Update user progress
        await UserProgress.findOneAndUpdate(
            { userId: req.user._id },
            {
                $inc: {
                    totalCredits: earnedCredits,
                    todayCredits: earnedCredits,
                },
                $set: {
                    lastTrainingDate: new Date(),
                    trainingStreak: currentStreak,
                },
            },
            { upsert: true, new: true }
        );

        // Save the session
        await trainingSession.save();

        // Get timeline manager and recalculate
        const timelineManager = getTimelineManager(req.user._id, req.app.locals.webSocketService);
        await timelineManager.recalculateCredits();
        const yearsToLaunch = await timelineManager.calculateTimeToLaunch();

        res.json({
            success: true,
            sessionId: trainingSession._id,
            earnedCredits,
            streakMultiplier: CreditCalculator.getStreakMultiplier(currentStreak),
            currentStreak,
            metrics: trainingSession.metrics,
            yearsToLaunch,
            totalCredits: await timelineManager.getTrainingCredits(),
        });
    } catch (error) {
        console.error('Error awarding training credits:', error);
        res.status(500).json({
            error: 'Failed to award training credits',
            message: error.message,
            details: error.errors,
        });
    }
});
