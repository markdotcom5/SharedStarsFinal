// routes/training/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');

// Import training module routers
const physicalRoutes = require('./physical');
const evaRoutes = require('./eva');
const recommendationsRoutes = require('./recommendations');
// const lifeSupport = require('./life-support');
// const navigation = require('./navigation');
// etc.

// General training dashboard route
router.get('/', authenticate, async (req, res) => {
    try {
        res.render('training/dashboard', {
            title: "Astronaut Training Center",
            modules: [
                {
                    id: "physical",
                    name: "Physical Training",
                    description: "Zero-G movement, endurance training, and astronaut fitness.",
                    icon: "fitness_center",
                    progress: 30
                },
                {
                    id: "eva",
                    name: "EVA Training",
                    description: "Extravehicular Activity procedures and emergency protocols.",
                    icon: "stars",
                    progress: 15
                },
                // Add more modules as needed
            ]
        });
    } catch (error) {
        console.error("❌ Error loading Training Dashboard:", error);
        res.status(500).render('error', { message: "Failed to load training dashboard" });
    }
});

// Overall training progress endpoint
router.get('/progress', authenticate, async (req, res) => {
    try {
        const UserProgress = require('../../models/UserProgress');
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        
        if (!userProgress) {
            return res.status(404).json({ error: 'Progress not found' });
        }
        
        res.json({
            success: true,
            progress: userProgress,
            phase: calculatePhase(userProgress.completedSessions)
        });
    } catch (error) {
        console.error('Error fetching training progress:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get global leaderboard
router.get('/leaderboard', authenticate, async (req, res) => {
    try {
        const UserProgress = require('../../models/UserProgress');
        const User = require('../../models/User');
        
        const leaderboard = await UserProgress.aggregate([
            {
                $lookup: {
                    from: User.collection.name,
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    username: '$user.username',
                    avatar: '$user.avatar',
                    completedSessions: 1,
                    points: 1,
                    phase: { $function: {
                        body: function(completedSessions) {
                            if (completedSessions >= 48) return 5;
                            if (completedSessions >= 36) return 4;
                            if (completedSessions >= 24) return 3;
                            if (completedSessions >= 12) return 2;
                            return 1;
                        },
                        args: ['$completedSessions'],
                        lang: 'js'
                    }}
                }
            },
            { $sort: { points: -1 } },
            { $limit: 20 }
        ]);
        
        res.json({ success: true, leaderboard });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ error: error.message });
    }
});

// Register module-specific routes
router.use('/physical', physicalRoutes);
router.use('/eva', evaRoutes);
router.use('/recommendations', recommendationsRoutes);
// router.use('/life-support', lifeSupportRoutes);
// Register module routes

// Helper functions
function calculatePhase(completedSessions) {
    if (completedSessions >= 48) return 5;
    if (completedSessions >= 36) return 4;
    if (completedSessions >= 24) return 3;
    if (completedSessions >= 12) return 2;
    return 1;
}

module.exports = router;