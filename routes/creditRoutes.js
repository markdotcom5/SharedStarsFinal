const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');
const SpaceTimelineManager = require('../services/SpaceTimelineManager');
const UserProgress = require('../models/UserProgress');

// ✅ WebSocket Service (for real-time credit updates)
const webSocketService = {
    sendToUser: (userId, type, data) => {
        console.log('WebSocket message:', { userId, type, data });
    },
    broadcast: (type, data) => {
        console.log('WebSocket broadcast:', { type, data });
    }
};

// ✅ Prevent Memory Leaks: Limit timeline managers
const timelineManagers = new Map();
const MAX_TIMELINE_MANAGERS = 1000; 

const getTimelineManager = (userId) => {
    if (!timelineManagers.has(userId)) {
        if (timelineManagers.size >= MAX_TIMELINE_MANAGERS) {
            console.warn('⚠️ Timeline manager limit reached. Clearing old entries.');
            timelineManagers.clear();
        }
        timelineManagers.set(userId, new SpaceTimelineManager(userId, webSocketService));
    }
    return timelineManagers.get(userId);
};

// ✅ Get User's Credit Balance
router.get('/balance', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('credits');
        if (!user) return res.status(404).json({ error: 'User not found' });

        const timelineManager = getTimelineManager(req.user._id);
        await timelineManager.initialize();
        const yearsToLaunch = await timelineManager.calculateTimeToLaunch();

        res.json({
            success: true,
            credits: user.credits,
            yearsToLaunch,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('❌ Error fetching credit balance:', error);
        res.status(500).json({ error: 'Failed to fetch credit balance', message: error.message });
    }
});

// ✅ Award Credits for Training Completion
router.post('/training/complete', authenticate, async (req, res) => {
    try {
        const completionScore = req.body.completionScore || 0;  // ✅ Prevents `undefined` error

        const trainingSession = new TrainingSession({
            userId: req.user._id,
            moduleType: 'assessment',
            status: 'completed',
            dateTime: new Date(),
            metrics: {
                completionRate: completionScore,
                effectivenessScore: completionScore,
                overallRank: 1
            },
            assessment: {
                score: completionScore,
                completedAt: new Date(),
                aiRecommendations: ['Great progress!']
            }
        });

        await trainingSession.save();

        const timelineManager = getTimelineManager(req.user._id);
        await timelineManager.initialize();
        await timelineManager.recalculateCredits();
        const yearsToLaunch = await timelineManager.calculateTimeToLaunch();

        webSocketService.sendToUser(req.user._id, 'credits_updated', {
            sessionId: trainingSession._id,
            earnedCredits: trainingSession.metrics.completionRate,
            newTotalCredits: await timelineManager.getTrainingCredits()
        });

        res.json({
            success: true,
            sessionId: trainingSession._id,
            metrics: trainingSession.metrics,
            yearsToLaunch,
            totalCredits: await timelineManager.getTrainingCredits()
        });
    } catch (error) {
        console.error('❌ Error awarding training credits:', error);
        res.status(500).json({ error: 'Failed to award training credits', message: error.message });
    }
});

// ✅ Get User Credit History
router.get('/history', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .select('moduleProgress certifications');

        const timelineManager = getTimelineManager(req.user._id);
        await timelineManager.initialize();

        const creditHistory = {
            modules: Array.isArray(user.moduleProgress) ? user.moduleProgress.map(m => ({
                moduleId: m.moduleId,
                credits: m.creditsEarned,
                date: m.completionDate,
                timelineImpact: m.creditsEarned ? (m.creditsEarned / 1000) : 0
            })) : [],
            certifications: Array.isArray(user.certifications) ? user.certifications.map(c => ({
                name: c.name,
                credits: c.creditsEarned,
                date: c.issuedDate,
                timelineImpact: c.creditsEarned ? (c.creditsEarned / 1000) : 0
            })) : []
        };

        res.json({
            success: true,
            history: creditHistory,
            totalCredits: await timelineManager.getTrainingCredits(),
            yearsToLaunch: await timelineManager.calculateTimeToLaunch()
        });
    } catch (error) {
        console.error('❌ Error fetching credit history:', error);
        res.status(500).json({ error: 'Failed to fetch credit history', message: error.message });
    }
});
// Award credits to user
router.post('/award', authenticate, async (req, res) => {
    try {
        const { amount, reason } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { credits: amount } },
            { new: true }
        );
        
        res.json({
            success: true,
            newBalance: user.credits,
            awarded: amount,
            reason
        });
    } catch (error) {
        console.error('Error awarding credits:', error);
        res.status(500).json({
            error: 'Failed to award credits',
            message: error.message
        });
    }
}); 

module.exports = router;
