// File: routes/physical/recommendations.js

const aiCoach = require('../../services/AISpaceCoach');

// Phase-specific challenges
const phaseBasedChallenges = {
    Foundation: [
        {
            id: 'foundation_endurance',
            name: 'Endurance Builder',
            description: 'Complete 3 cardio sessions in a week',
            requirement: 3,
            creditsReward: 300
        },
        {
            id: 'foundation_strength',
            name: 'Core Strength',
            description: 'Achieve perfect form in basic exercises',
            requirement: 'FORM_CHECK',
            creditsReward: 250
        }
    ],
    'Advanced Development': [
        {
            id: 'advanced_intensity',
            name: 'Intensity Master',
            description: 'Maintain 0.8+ intensity for 5 sessions',
            requirement: 5,
            creditsReward: 500
        },
        {
            id: 'advanced_complex',
            name: 'Complex Movement',
            description: 'Complete advanced exercise combinations',
            requirement: 'MOVEMENT_CHECK',
            creditsReward: 450
        }
    ],
    'Performance Integration': [
        {
            id: 'performance_elite',
            name: 'Elite Performance',
            description: 'Achieve all performance metrics in one session',
            requirement: 'ALL_METRICS',
            creditsReward: 1000
        },
        {
            id: 'performance_mission',
            name: 'Mission Ready',
            description: 'Complete a simulated mission workout',
            requirement: 'MISSION_SIM',
            creditsReward: 800
        }
    ]
};

// Enhanced milestone types
const milestoneTypes = {
    // Session-based milestones
    SESSION_MILESTONES: [
        { id: 'first_session', name: 'First Step', sessions: 1, credits: 100 },
        { id: 'tenth_session', name: 'Dedicated Trainee', sessions: 10, credits: 300 },
        { id: 'fifty_sessions', name: 'Elite Trainee', sessions: 50, credits: 1000 }
    ],
    // Performance milestones
    PERFORMANCE_MILESTONES: [
        { id: 'high_intensity', name: 'Intensity Master', requirement: { intensity: 0.9 }, credits: 200 },
        { id: 'long_duration', name: 'Endurance Expert', requirement: { duration: 60 }, credits: 200 },
        { id: 'calorie_burner', name: 'Calorie Crusher', requirement: { caloriesBurned: 500 }, credits: 300 }
    ],
    // Streak milestones
    STREAK_MILESTONES: [
        { id: 'week_warrior', name: 'Week Warrior', days: 7, credits: 500 },
        { id: 'monthly_master', name: 'Monthly Master', days: 30, credits: 2000 }
    ],
    // Phase completion milestones
    PHASE_MILESTONES: [
        { id: 'foundation_complete', name: 'Foundation Master', phase: 'Foundation', credits: 1000 },
        { id: 'advanced_complete', name: 'Advanced Achiever', phase: 'Advanced Development', credits: 2000 },
        { id: 'performance_complete', name: 'Performance Elite', phase: 'Performance Integration', credits: 3000 }
    ]
};

// Generate AI recommendations based on user's performance and phase
async function generateAIRecommendations(sessionData, userProgress, phase) {
    try {
        const context = {
            phase,
            currentSession: {
                intensity: sessionData.intensity,
                duration: sessionData.duration,
                exercises: sessionData.exercises,
                caloriesBurned: sessionData.caloriesBurned
            },
            historicalData: {
                completedSessions: userProgress.completedSessions,
                averageIntensity: calculateAverageIntensity(userProgress),
                streak: userProgress.streak
            },
            achievements: userProgress.achievements || []
        };

        const suggestions = await aiCoach.generateCoachingSuggestions({
            userId: userProgress.userId,
            context
        });

        return {
            performance: analyzePerformance(sessionData, phase),
            nextSteps: generateNextSteps(phase, context),
            suggestedExercises: suggestNextExercises(phase, context),
            phaseChallenges: getActiveChallenges(phase),
            aiSuggestions: suggestions
        };
    } catch (error) {
        console.error('Error generating AI recommendations:', error);
        return null;
    }
}

// Helper functions
function analyzePerformance(sessionData, phase) {
    const phaseRequirements = {
        beginner: { minTime: 20, maxTime: 40 },
        intermediate: { minTime: 40, maxTime: 60 },
        advanced: { minTime: 60, maxTime: 90 }
    };

    let performanceScore = 0;

    if (sessionData.duration >= phaseRequirements[phase].minTime &&
        sessionData.duration <= phaseRequirements[phase].maxTime) {
        performanceScore = 100;
    } else if (sessionData.duration < phaseRequirements[phase].minTime) {
        performanceScore = 50;
    }

    return { score: performanceScore };
}

function generateNextSteps(phase, context) {
    const steps = [];
    const { completedSessions, averageIntensity, streak } = context.historicalData;

    switch (phase) {
        case 'Foundation':
            if (averageIntensity < 0.6) steps.push('Focus on maintaining consistent form');
            if (completedSessions < 5) steps.push('Build up session frequency');
            break;
        case 'Advanced Development':
            if (averageIntensity < 0.7) steps.push('Increase workout intensity');
            if (streak < 7) steps.push('Work on training consistency');
            break;
        case 'Performance Integration':
            steps.push('Focus on mission-specific exercises');
            steps.push('Integrate complex movement patterns');
            break;
    }

    return steps;
}

function suggestNextExercises(phase, context) {
    const exerciseSuggestions = {
        Foundation: [
            'Basic push-ups',
            'Air squats',
            'Plank holds',
            'Basic cardio'
        ],
        'Advanced Development': [
            'Diamond push-ups',
            'Jump squats',
            'Dynamic planks',
            'HIIT cardio'
        ],
        'Performance Integration': [
            'One-arm push-ups',
            'Pistol squats',
            'Weighted exercises',
            'Mission simulations'
        ]
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

module.exports = {
    generateAIRecommendations,
    milestoneTypes,
    phaseBasedChallenges
};