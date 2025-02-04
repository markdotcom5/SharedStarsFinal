// routes/trial.js
const express = require('express');
const router = express.Router();
const Trial = require('../models/Trial');
const User = require('../models/User');
const { generateAIGuidance } = require('../services/aiGuidance');

router.post('/start-trial', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Create new user
        const user = new User({
            name,
            email,
            password,
            accountType: 'trial'
        });
        await user.save();

        // Create trial period (30 days)
        const trial = new Trial({
            userId: user._id,
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await trial.save();

        res.status(201).json({
            success: true,
            userId: user._id,
            nextStep: 'assessment'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

router.post('/assessment', async (req, res) => {
    try {
        const { userId, motivation, experienceLevel } = req.body;

        const trial = await Trial.findOne({ userId });
        if (!trial) {
            throw new Error('Trial not found');
        }

        trial.initialAssessment = {
            motivation,
            experienceLevel,
            completedAt: new Date()
        };

        // Generate AI-guided learning path
        const aiGuidance = await generateAIGuidance({
            motivation,
            experienceLevel
        });

        trial.initialAssessment.preferredPath = aiGuidance.pathId;
        await trial.save();

        res.json({
            success: true,
            guidance: aiGuidance,
            nextStep: 'training'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;