const express = require('express');
const { authenticate } = require('../middleware/authenticate'); // Correctly imported middleware
const User = require('../models/User'); // User model
const Achievement = require('../models/Achievement'); // Achievement model
const mongoose = require('mongoose');
const router = express.Router();

// Debugging Log: Ensure the `authenticate` middleware is correctly imported
console.log('Authenticate Middleware Type:', typeof authenticate); // Should log "function"

// Middleware: Validate `userId` Parameter
router.param('userId', (req, res, next, id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error(`Invalid userId format: ${id}`);
        return res.status(400).json({ error: 'Invalid userId format' });
    }
    next();
});

// Route: Get All Achievements for Authenticated User
router.get('/user-achievements', authenticate, async (req, res) => {
    try {
        const achievements = await Achievement.find({ userId: req.user._id });
        if (!achievements.length) {
            return res.status(404).json({ error: 'No achievements found for the authenticated user.' });
        }

        res.status(200).json({
            message: 'Achievements retrieved successfully.',
            achievements,
        });
    } catch (error) {
        console.error('Error fetching achievements for authenticated user:', error.message);
        res.status(500).json({ error: 'Failed to fetch achievements.', details: error.message });
    }
});

// Route: Get Achievements and Stats by userId
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;

        // Fetch achievements for the given userId
        const achievements = await Achievement.find({ userId });
        if (!achievements.length) {
            return res.status(404).json({ error: 'No achievements found for this user.' });
        }

        res.status(200).json({
            message: `Achievements for user ${userId} retrieved successfully.`,
            achievements,
        });
    } catch (error) {
        console.error('Error fetching achievements by userId:', error.message);
        res.status(500).json({ error: 'Failed to fetch achievements by userId.', details: error.message });
    }
});

// Route: Create a New Achievement
router.post('/add', authenticate, async (req, res) => {
    try {
        const { title, description, points } = req.body;

        if (!title || !description || isNaN(points)) {
            return res.status(400).json({
                error: 'Missing required fields: title, description, or points must be provided.',
            });
        }

        const newAchievement = new Achievement({
            userId: req.user._id,
            title,
            description,
            points: Number(points), // Ensure `points` is saved as a number
        });

        const savedAchievement = await newAchievement.save();

        res.status(201).json({
            message: 'Achievement added successfully.',
            achievement: savedAchievement,
        });
    } catch (error) {
        console.error('Error adding achievement:', error.message);
        res.status(500).json({ error: 'Failed to add achievement.', details: error.message });
    }
});

// Route: Delete an Achievement by ID
router.delete('/:achievementId', authenticate, async (req, res) => {
    try {
        const { achievementId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(achievementId)) {
            return res.status(400).json({ error: 'Invalid achievementId format.' });
        }

        const deletedAchievement = await Achievement.findOneAndDelete({
            _id: achievementId,
            userId: req.user._id,
        });

        if (!deletedAchievement) {
            return res.status(404).json({ error: 'Achievement not found or not authorized.' });
        }

        res.status(200).json({
            message: 'Achievement deleted successfully.',
            achievement: deletedAchievement,
        });
    } catch (error) {
        console.error('Error deleting achievement:', error.message);
        res.status(500).json({ error: 'Failed to delete achievement.', details: error.message });
    }
});

module.exports = router;
