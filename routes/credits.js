// routes/credits.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');

// Get user's credit balance
router.get('/balance', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('credits');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            success: true,
            credits: user.credits,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching credit balance:', error);
        res.status(500).json({ 
            error: 'Failed to fetch credit balance',
            message: error.message 
        });
    }
});

// Get credit history
router.get('/history', authenticate, async (req, res) => {
    try {
        const trainingSessions = await TrainingSession.find({
            userId: req.user._id,
            status: 'completed'
        }).sort({ completedAt: -1 });

        const creditHistory = trainingSessions.map(session => ({
            date: session.completedAt || session.dateTime,
            type: session.sessionType,
            credits: session.earnedCredits || 0,
            moduleId: session.moduleId
        }));

        res.json({
            success: true,
            history: creditHistory
        });
    } catch (error) {
        console.error('Error fetching credit history:', error);
        res.status(500).json({ 
            error: 'Failed to fetch credit history',
            message: error.message 
        });
    }
});

// Award credits for completed training
router.post('/award', authenticate, async (req, res) => {
    try {
        const { amount, reason, sessionId } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { $inc: { credits: amount } },
            { new: true }
        );

        if (sessionId) {
            await TrainingSession.findByIdAndUpdate(sessionId, {
                $set: { earnedCredits: amount }
            });
        }

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