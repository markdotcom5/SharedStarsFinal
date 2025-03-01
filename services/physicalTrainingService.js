const { EventEmitter } = require('events');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Subscription = require('../models/Subscription');
const Achievement = require('../models/Achievement');
const TrainingSession = require('../models/TrainingSession');
const TrainingLearningSystem = require('./TrainingLearningSystem');

// Get the components from TrainingLearningSystem
const { 
    BayesianTracker, 
    AILearningSystem, 
    UnifiedEVAAIService 
} = TrainingLearningSystem;

class PhysicalTrainingService extends EventEmitter {
    constructor() {
        super();
        this.aiCoach = TrainingLearningSystem.AILearning || {};       
        this.bayesianTracker = TrainingLearningSystem.BayesianTracker ? 
                               new TrainingLearningSystem.BayesianTracker() : {};
        this.trainingModules = new Map();
        this.moduleAIServices = { 
            eva: TrainingLearningSystem.UnifiedEVAAIService || {} 
        };

        console.log("✅ PhysicalTrainingService Initialized");
    }

    /**
     * ✅ Get user's physical training progress
     */
    async getPhysicalTrainingProgress(userId) {
        try {
            const progress = await UserProgress.findOne({ userId }).lean();
            if (progress) return progress;

            return {
                overallProgress: 20, // percentage
                completedMissions: 2,
                totalMissions: 10,
                currentPhase: 1,
                phaseProgress: 40, // percentage
                nextMission: 'core-balance-foundation',
                skills: {
                    balance: 30,
                    endurance: 15,
                    strength: 10,
                    flexibility: 20,
                    dexterity: 45,
                    proprioception: 5
                }
            };
        } catch (error) {
            console.error("❌ Error fetching physical training progress:", error);
            return { error: "Failed to retrieve progress" };
        }
    }

    /**
     * ✅ Get mission details
     */
    async getMissionDetails(missionId) {
        const missions = {
            'core-balance-foundation': {
                id: 'core-balance-foundation',
                name: 'Core & Balance Foundation',
                description: 'Strengthen core muscles and balance for space movements.',
                phase: 1,
                difficulty: 'Beginner',
                duration: '30 minutes',
                exercises: [
                    { name: 'Planks', description: 'Hold a plank position for 60 sec', reps: 3 },
                    { name: 'Stability Ball Workouts', description: 'Improve coordination', reps: 3 },
                    { name: 'Single-Leg Balance Drills', description: 'Strengthen balance control', reps: 3 }
                ],
                challenge: {
                    name: 'Plank Hold Mastery',
                    criteria: 'Hold a plank for 3 minutes straight',
                    bonusPoints: 50
                },
                aiTracking: 'Core engagement, endurance, posture corrections.'
            }
        };
        return missions[missionId] || null;
    }

    /**
     * ✅ Start a training session
     */
    async startTrainingSession(userId, missionId) {
        const sessionId = `session_${Date.now()}`;
        return {
            sessionId,
            userId,
            missionId,
            startTime: new Date(),
            status: 'in-progress'
        };
    }

    /**
     * ✅ Update training progress
     */
    async updateTrainingProgress(userId, missionId, sessionId, progressData) {
        console.log(`📊 Updating progress for user ${userId}, mission ${missionId}`);
        await TrainingSession.updateOne(
            { userId, sessionId },
            { $set: { progressData, lastUpdated: new Date() } }
        );
        return { success: true, updated: true };
    }

    /**
     * ✅ AI-Adjusted Difficulty for Training
     */
    async calculateAIDifficulty(userId, missionId) {
        return {
            level: 'intermediate',
            exerciseAdjustments: {
                'plank-holds': { duration: '75 seconds', reps: 4 },
                'stability-ball': { duration: '60 seconds', reps: 3 }
            },
            adjustmentReason: 'Based on your endurance, STELLA recommends increasing plank time.'
        };
    }

    /**
     * ✅ Get STELLA AI Training Recommendations
     */
    async getSTELLARecommendations(userId, missionId) {
        return [
            'Increase plank hold duration by 10 seconds.',
            'Try focusing on controlled breathing during endurance drills.',
            'Keep your balance steady during single-leg drills to avoid wobbling.'
        ];
    }

    /**
     * ✅ Update Leaderboard
     */
    async updateLeaderboard(userId, missionId, performanceData) {
        return { rank: 42, totalUsers: 156, percentile: 73, points: 1250 };
    }

    /**
     * ✅ Calculate Training Credits
     */
    async calculateCredits(userId, missionId, performanceData) {
        return { base: 50, bonusChallenge: 25, timeBonus: 10, totalEarned: 85, newBalance: 420 };
    }
}

// ✅ Export a single instance to be used across the app
module.exports = new PhysicalTrainingService();