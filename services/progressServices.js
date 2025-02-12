// services/progressService.js
const UserProgress = require('../models/UserProgress');

class ProgressService {
    static async initializeModuleProgress(userId, module) {
        try {
            // Find existing user progress
            let userProgress = await UserProgress.findOne({ userId });
            
            // If no user progress exists, create it
            if (!userProgress) {
                userProgress = new UserProgress({
                    userId,
                    credits: {
                        breakdown: {
                            attendance: 0,
                            performance: 0,
                            milestones: 0,
                            assessments: 0
                        },
                        total: 0
                    },
                    moduleProgress: [],
                    achievements: [],
                    aiGuidance: {
                        confidenceHistory: []
                    },
                    assessments: [],
                    certifications: []
                });
            }

            // Check if module progress already exists
            const existingModuleProgress = userProgress.moduleProgress.find(
                progress => progress.moduleId === module.moduleId
            );

            if (!existingModuleProgress) {
                // Initialize new module progress
                const newModuleProgress = {
                    moduleId: module.moduleId,
                    activeModules: [{
                        moduleId: module.moduleId,
                        progress: 0,
                        startDate: new Date(),
                        lastAccessed: new Date()
                    }],
                    completedModules: [],
                    sessions: module.trainingStructure.sessions.map(session => ({
                        sessionId: session.id,
                        completed: false,
                        progress: 0,
                        attempts: 0,
                        bestScore: 0
                    })),
                    milestones: module.trainingStructure.progression?.milestones?.map(milestone => ({
                        name: milestone.name,
                        completed: false,
                        dateAchieved: null
                    })) || []
                };

                userProgress.moduleProgress.push(newModuleProgress);
                await userProgress.save();
                
                console.log(`✅ Module progress initialized for user ${userId} and module ${module.moduleId}`);
                return newModuleProgress;
            }

            console.log(`ℹ️ Module progress already exists for user ${userId} and module ${module.moduleId}`);
            return existingModuleProgress;
        } catch (error) {
            console.error('❌ Error initializing module progress:', error);
            throw error;
        }
    }

    static async updateProgress(userId, moduleId, progress) {
        const userProgress = await UserProgress.findOne({ userId });
        if (!userProgress) return null;

        return userProgress.updateModuleProgress(moduleId, progress);
    }
}

module.exports = ProgressService;