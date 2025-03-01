// routes/progress.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const AIAssistant = require('../services/AIAssistant');

// Logging middleware for all progress routes
router.use((req, res, next) => {
    console.log(`🔍 Progress Route Hit: ${req.method} ${req.path}`);
    next();
});
router.get('/', authenticate, async (req, res) => {
    res.json({ message: "User progress retrieved successfully!" });
});

// 📌 🏆 GET User Training Progress
router.get('/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        console.log(`🔍 Fetching progress for userId: ${userId}`);

        const userProgress = await UserProgress.findOne({ userId }).lean();
        if (!userProgress) {
            return res.status(404).json({ success: false, message: "No training progress found." });
        }

        res.json({
            success: true,
            progress: userProgress.moduleProgress,
            credits: userProgress.credits
        });
    } catch (error) {
        console.error('❌ Error fetching training progress:', error);
        res.status(500).json({ success: false, message: "Failed to fetch training progress." });
    }
});

// 📌 📝 POST Update Training Progress (Completing a Session)
router.post('/session', authenticate, async (req, res) => {
    try {
        const { moduleId, sessionId, exercisesCompleted, duration, caloriesBurned } = req.body;
        const userId = req.user._id;

        if (!userId || !moduleId || !sessionId || !exercisesCompleted || !duration || !caloriesBurned) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        let userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            userProgress = new UserProgress({
                userId,
                moduleProgress: []
            });
        }

        let moduleProgress = userProgress.moduleProgress.find(p => p.moduleId === moduleId);
        if (!moduleProgress) {
            moduleProgress = {
                moduleId,
                completedSessions: 0,
                totalCreditsEarned: 0,
                streak: 0,
                lastSessionDate: null,
                trainingLogs: []
            };
            userProgress.moduleProgress.push(moduleProgress);
        }

        // Update progress
        moduleProgress.completedSessions += 1;
        moduleProgress.lastSessionDate = new Date();
        moduleProgress.trainingLogs.push({
            date: new Date(),
            exercisesCompleted,
            duration,
            caloriesBurned
        });

        await userProgress.save();

        // Calculate leaderboard score
        const totalScore = calculateLeaderboardScore(moduleProgress);
        
        // Update user's leaderboard score
        await User.findByIdAndUpdate(userId, { 
            $set: { leaderboardScore: totalScore } 
        });

        res.json({ 
            success: true, 
            message: "Training session recorded successfully.",
            leaderboardScore: totalScore,
            scoreBreakdown: getScoreBreakdown(moduleProgress)
        });
    } catch (error) {
        console.error('❌ Error updating training progress:', error);
        res.status(500).json({ success: false, message: "Failed to update training progress." });
    }
});

// 📌 🏅 POST Unlock a Milestone
router.post('/milestone', authenticate, async (req, res) => {
    try {
        const { moduleId, milestoneName } = req.body;
        const userId = req.user._id;

        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) {
            return res.status(404).json({ success: false, message: "User progress not found." });
        }

        let moduleProgress = userProgress.moduleProgress.find(p => p.moduleId === moduleId);
        if (!moduleProgress) {
            return res.status(404).json({ success: false, message: "Module progress not found." });
        }

        if (moduleProgress.milestones?.find(m => m.name === milestoneName)) {
            return res.json({ success: false, message: "Milestone already unlocked." });
        }

        moduleProgress.milestones = moduleProgress.milestones || [];
        moduleProgress.milestones.push({
            name: milestoneName,
            completed: true,
            dateAchieved: new Date()
        });

        await userProgress.save();
        res.json({ success: true, message: "Milestone unlocked successfully." });
    } catch (error) {
        console.error('❌ Error unlocking milestone:', error);
        res.status(500).json({ success: false, message: "Failed to unlock milestone." });
    }
});

// 📌 🤖 GET AI Feedback
router.get('/ai-feedback/:userId', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const userProgress = await UserProgress.findOne({ userId });

        if (!userProgress) {
            return res.status(404).json({ success: false, message: "No progress found." });
        }

        const aiAssistant = new AIAssistant();
        const feedback = await aiAssistant.analyzeSessionPerformance(userId, userProgress);

        res.json({ success: true, feedback });
    } catch (error) {
        console.error('❌ Error fetching AI feedback:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve AI recommendations." });
    }
});

// 📌 🎖 GET Earned Certifications
router.get('/:userId/certifications', authenticate, async (req, res) => {
    try {
        const { userId } = req.params;
        const userProgress = await UserProgress.findOne({ userId }).select('certifications').lean();
        
        if (!userProgress) {
            return res.status(404).json({ success: false, message: "No certifications found." });
        }

        res.json({
            success: true,
            certifications: userProgress.certifications
        });
    } catch (error) {
        console.error('❌ Error fetching certifications:', error);
        res.status(500).json({ success: false, message: "Failed to fetch certifications." });
    }
});

// Helper Functions
function calculateLeaderboardScore(moduleProgress) {
    let totalScore = 0;
    
    // Points for completed sessions
    totalScore += moduleProgress.completedSessions * 100;
    
    // Points for streak
    totalScore += moduleProgress.streak * 50;
    
    // Points for exercise variety
    const uniqueExercises = new Set(moduleProgress.trainingLogs.flatMap(log => log.exercisesCompleted)).size;
    totalScore += uniqueExercises * 25;
    
    // Points for duration improvements
    const durations = moduleProgress.trainingLogs.map(log => log.duration);
    if (durations.length >= 2) {
        const improvement = durations[durations.length - 1] - durations[durations.length - 2];
        if (improvement > 0) {
            totalScore += improvement * 10;
        }
    }
    
    return totalScore;
}

function getScoreBreakdown(moduleProgress) {
    const durations = moduleProgress.trainingLogs.map(log => log.duration);
    const uniqueExercises = new Set(moduleProgress.trainingLogs.flatMap(log => log.exercisesCompleted)).size;
    
    return {
        sessionsScore: moduleProgress.completedSessions * 100,
        streakScore: moduleProgress.streak * 50,
        exerciseVarietyScore: uniqueExercises * 25,
        durationImprovementScore: durations.length >= 2 ? 
            Math.max(0, (durations[durations.length - 1] - durations[durations.length - 2]) * 10) : 0
    };
}

module.exports = router;