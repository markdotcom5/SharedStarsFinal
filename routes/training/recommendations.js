// routes/training/recommendations.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const { CoreAIServices } = require('../../services/CoreAIServices'); // STELLA integration

// Fix the imports to use consistent paths
const { generateAIRecommendations } = require('../../services/AISystem');
const aiCoach = require('../../services/AISpaceCoach');

// Phase-specific challenges
const phaseBasedChallenges = {
    Foundation: [
        { id: 'foundation_endurance', name: 'Endurance Builder', description: 'Complete 3 cardio sessions in a week', requirement: 3, creditsReward: 300 },
        { id: 'foundation_strength', name: 'Core Strength', description: 'Achieve perfect form in basic exercises', requirement: 'FORM_CHECK', creditsReward: 250 }
    ],
    'Advanced Development': [
        { id: 'advanced_intensity', name: 'Intensity Master', description: 'Maintain 0.8+ intensity for 5 sessions', requirement: 5, creditsReward: 500 },
        { id: 'advanced_complex', name: 'Complex Movement', description: 'Complete advanced exercise combinations', requirement: 'MOVEMENT_CHECK', creditsReward: 450 }
    ],
    'Performance Integration': [
        { id: 'performance_elite', name: 'Elite Performance', description: 'Achieve all performance metrics in one session', requirement: 'ALL_METRICS', creditsReward: 1000 },
        { id: 'performance_mission', name: 'Mission Ready', description: 'Complete a simulated mission workout', requirement: 'MISSION_SIM', creditsReward: 800 }
    ]
};

// Enhanced milestone types
const milestoneTypes = {
    SESSION_MILESTONES: [
        { id: 'first_session', name: 'First Step', sessions: 1, credits: 100 },
        { id: 'tenth_session', name: 'Dedicated Trainee', sessions: 10, credits: 300 },
        { id: 'fifty_sessions', name: 'Elite Trainee', sessions: 50, credits: 1000 }
    ],
    PERFORMANCE_MILESTONES: [
        { id: 'high_intensity', name: 'Intensity Master', requirement: { intensity: 0.9 }, credits: 200 },
        { id: 'long_duration', name: 'Endurance Expert', requirement: { duration: 60 }, credits: 200 },
        { id: 'calorie_burner', name: 'Calorie Crusher', requirement: { caloriesBurned: 500 }, credits: 300 }
    ],
    STREAK_MILESTONES: [
        { id: 'week_warrior', name: 'Week Warrior', days: 7, credits: 500 },
        { id: 'monthly_master', name: 'Monthly Master', days: 30, credits: 2000 }
    ],
    PHASE_MILESTONES: [
        { id: 'foundation_complete', name: 'Foundation Master', phase: 'Foundation', credits: 1000 },
        { id: 'advanced_complete', name: 'Advanced Achiever', phase: 'Advanced Development', credits: 2000 },
        { id: 'performance_complete', name: 'Performance Elite', phase: 'Performance Integration', credits: 3000 }
    ]
};
/**
 * POST /api/training/recommendations
 * Get personalized AI recommendations across all training modules
 */
router.post('/', authenticate, async (req, res) => {
    try {
      const { trainingType, metrics } = req.body;
      const userId = req.user._id || req.session.user.id;
      
      // Get recommendations from STELLA
      const recommendations = await CoreAIServices.generateRecommendations(
        userId, trainingType, metrics
      );
      
      res.json({ success: true, recommendations });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  });
// API Route to Get AI Recommendations (add authentication)
router.post('/', authenticate, async (req, res) => {
    try {
        const { sessionData, userProgress, phase } = req.body;
        const recommendations = await generateAIRecommendations(sessionData, userProgress, phase);
        res.json({ success: true, recommendations });
    } catch (error) {
        console.error("❌ Error in AI Recommendations:", error);
        res.status(500).json({ error: "Failed to generate AI recommendations." });
    }
});

// Get active challenges for the user's phase
router.get('/challenges', authenticate, async (req, res) => {
    try {
        const UserProgress = require('../../models/UserProgress');
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        const phase = calculatePhase(userProgress?.completedSessions || 0);
        const phaseName = getPhaseNameFromNumber(phase);
        
        const challenges = getActiveChallenges(phaseName);
        res.json({ success: true, challenges });
    } catch (error) {
        console.error("❌ Error fetching challenges:", error);
        res.status(500).json({ error: "Failed to fetch challenges." });
    }
});

// Get milestones for user
router.get('/milestones', authenticate, async (req, res) => {
    try {
        res.json({ 
            success: true, 
            milestones: milestoneTypes 
        });
    } catch (error) {
        console.error("❌ Error fetching milestones:", error);
        res.status(500).json({ error: "Failed to fetch milestones." });
    }
});

// Get AI coach feedback
router.post('/coaching', authenticate, async (req, res) => {
    try {
        const { sessionData } = req.body;
        const feedback = await aiCoach.generateFeedback(req.user._id, sessionData);
        res.json({ success: true, feedback });
    } catch (error) {
        console.error("❌ Error getting AI coaching:", error);
        res.status(500).json({ error: "Failed to generate AI coaching feedback." });
    }
});

// Helper Functions
function analyzePerformance(sessionData, phase) {
    const phaseRequirements = {
        beginner: { minTime: 20, maxTime: 40 },
        intermediate: { minTime: 40, maxTime: 60 },
        advanced: { minTime: 60, maxTime: 90 }
    };

    let performanceScore = sessionData.duration >= phaseRequirements[phase]?.minTime &&
        sessionData.duration <= phaseRequirements[phase]?.maxTime ? 100 : 50;

    return { score: performanceScore };
}

function suggestNextExercises(phase) {
    const exerciseSuggestions = {
        Foundation: ['Basic push-ups', 'Air squats', 'Plank holds', 'Basic cardio'],
        'Advanced Development': ['Diamond push-ups', 'Jump squats', 'Dynamic planks', 'HIIT cardio'],
        'Performance Integration': ['One-arm push-ups', 'Pistol squats', 'Weighted exercises', 'Mission simulations']
    };

    return exerciseSuggestions[phase] || exerciseSuggestions.Foundation;
}

function getActiveChallenges(phase) {
    return phaseBasedChallenges[phase] || [];
}

function calculateAverageIntensity(userProgress) {
    if (!userProgress.trainingLogs || userProgress.trainingLogs.length === 0) {
        return 0;
    }
    const intensities = userProgress.trainingLogs.map(log => log.intensity || 0);
    return intensities.reduce((a, b) => a + b, 0) / intensities.length;
}

function calculatePhase(completedSessions) {
    if (completedSessions >= 48) return 5;
    if (completedSessions >= 36) return 4;
    if (completedSessions >= 24) return 3;
    if (completedSessions >= 12) return 2;
    return 1;
}

function getPhaseNameFromNumber(phaseNumber) {
    const phaseMap = {
        1: 'Foundation',
        2: 'Advanced Development',
        3: 'Performance Integration',
        4: 'Mission Readiness',
        5: 'Flight Qualification'
    };
    return phaseMap[phaseNumber] || 'Foundation';
}

// Export only the router
module.exports = router;