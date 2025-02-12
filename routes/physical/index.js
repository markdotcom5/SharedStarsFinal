const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const UserProgress = require('../../models/UserProgress');
const TrainingSession = require('../../models/TrainingSession');
const Module = require('../../models/Module');
const { authenticate } = require('../../middleware/authenticate');

const { 
    generateAIRecommendations, 
    milestoneTypes, 
    phaseBasedChallenges 
} = require('./recommendations');
const aiAssistant = require('../../services/aiAssistant'); // ✅ Import AI Assistant

// ✅ Debugging: Ensure analyzeAchievementProgress exists
console.log("aiAssistant Object:", aiAssistant);
console.log("aiAssistant.analyzeAchievementProgress Type:", typeof aiAssistant.analyzeAchievementProgress);

// 📌 Test route
router.get('/test', (req, res) => {
    console.log("Test route hit!");
    res.json({ message: "Test route working" });
});

// 📌 Debugging route
router.get('/debug/:userId', async (req, res) => {
    console.log("Debug route starting");
    try {
        const result = await UserProgress.findOne({
            userId: new mongoose.Types.ObjectId(req.params.userId)
        });
        console.log("Query result:", result);
        res.json({ result });
    } catch (error) {
        console.error('Debug error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 📌 Get user progress
// Enhanced progress route with training sessions
router.get('/progress/:userId', authenticate, async (req, res) => {
    try {
        const [userProgress, trainingSessions] = await Promise.all([
            UserProgress.findOne({
                userId: new mongoose.Types.ObjectId(req.params.userId)
            }),
            TrainingSession.find({
                userId: new mongoose.Types.ObjectId(req.params.userId),
                moduleType: "physical"
            }).sort({ dateTime: -1 }).limit(5)
        ]);

        if (!userProgress) {
            return res.status(404).json({ 
                success: false, 
                message: "No training progress found" 
            });
        }

        const physicalModule = userProgress.moduleProgress.find(m => 
            m.moduleId === 'core-phys-001'
        );

        if (!physicalModule) {
            return res.status(404).json({ 
                success: false, 
                message: "Physical training module not found" 
            });
        }

        res.json({
            success: true,
            progress: physicalModule,
            recentSessions: trainingSessions,
            metrics: {
                completionRate: trainingSessions[0]?.metrics?.completionRate || 0,
                effectivenessScore: trainingSessions[0]?.metrics?.effectivenessScore || 0,
                overallRank: trainingSessions[0]?.metrics?.overallRank || 999999
            }
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/milestone', authenticate, async (req, res) => {  
    try {
        const userId = new mongoose.Types.ObjectId(req.user._id);
        const { milestoneId } = req.body;

        console.log("🔍 Checking Milestone ID:", milestoneId);

        let userProgress = await UserProgress.findOne({ userId });

        if (!userProgress) {
            console.error("❌ User progress not found");
            return res.status(404).json({ success: false, message: "User progress not found" });
        }

        const physicalModule = userProgress.moduleProgress.find(m => m.moduleId === 'core-phys-001');

        if (!physicalModule) {
            console.error("❌ Physical module not found");
            return res.status(404).json({ success: false, message: "Physical module not found" });
        }

        // Log all available milestones
        console.log("🔍 Available Milestones:", milestoneTypes);

        // Find the milestone definition
        const milestone = [...milestoneTypes.SESSION_MILESTONES, 
            ...milestoneTypes.PERFORMANCE_MILESTONES,
            ...milestoneTypes.STREAK_MILESTONES,
            ...milestoneTypes.PHASE_MILESTONES
        ].find(m => m.id === milestoneId);

        if (!milestone) {
            console.error("❌ Milestone not found");
            return res.status(404).json({ success: false, message: "Milestone not found" });
        }

        // Check if the milestone is already completed
        if (physicalModule.milestones.some(m => m.id === milestoneId)) {
            return res.status(400).json({ success: false, message: "Milestone already completed" });
        }

        // Add the new milestone
        physicalModule.milestones.push({
            ...milestone,
            dateAchieved: new Date()
        });

        // Update credits
        userProgress.credits.breakdown.milestones += milestone.credits;
        userProgress.credits.total += milestone.credits;

        await userProgress.save();

        res.json({ success: true, milestone: milestone, totalCredits: userProgress.credits.total });

    } catch (error) {
        console.error("❌ Milestone Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 📌 Session route with AI Integration, milestone tracking, and streak system
router.post('/session', authenticate, async (req, res) => {
    try {
        const { exercises, duration, intensity } = req.body;
        
        // Create training session
        const trainingSession = new TrainingSession({
            userId: req.user._id,
            moduleType: "physical",
            moduleId: "core-phys-001",
            adaptiveAI: {
                enabled: true,
                skillFactors: {
                    physical: intensity || 1,
                    technical: 1,
                    mental: 1
                }
            },
            metrics: {
                completionRate: 100,
                effectivenessScore: intensity * 20
            }
        });

        await trainingSession.save();

        // Update user progress
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        if (!userProgress) {
            return res.status(404).json({ success: false, message: "User progress not found" });
        }

        const physicalModule = userProgress.moduleProgress.find(m => m.moduleId === 'core-phys-001');
        if (physicalModule) {
            physicalModule.completedSessions += 1;
            physicalModule.trainingLogs.push({
                date: new Date(),
                exercisesCompleted: exercises,
                duration,
                caloriesBurned: duration * intensity * 5
            });
        }

        await userProgress.save();

        res.json({
            success: true,
            session: trainingSession,
            progress: physicalModule
        });

    } catch (error) {
        console.error('Error creating session:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});
// 📌 Helper function to calculate phase
function calculatePhase(completedSessions) {
    if (completedSessions > 48) return 'Performance Integration';
    if (completedSessions > 24) return 'Advanced Development';
    return 'Foundation';
}

module.exports = router;