// services/moduleService.js
const Module = require('../models/Module');
const UserProgress = require('../models/UserProgress');

class ModuleService {
    async initializeModules(moduleConfigs) {
        try {
            for (const config of moduleConfigs) {
                await Module.findOneAndUpdate(
                    { title: config.name },
                    {
                        title: config.name,
                        type: 'training',
                        category: config.type,
                        difficulty: config.difficulty,
                        content: {
                            theory: config.objectives?.map(obj => ({
                                title: obj,
                                description: obj
                            })) || [],
                            practice: config.tasks?.map(task => ({
                                type: 'individual',
                                description: task.description || 'No description provided',
                                duration: parseInt(task.duration) || 0,
                                requirements: task.requirements || []
                            })) || [],
                            assessment: {
                                criteria: config.certification?.requirements || [],
                                passingScore: 80
                            }
                        }
                    },
                    { upsert: true, new: true }
                );
            }
        } catch (error) {
            console.error('❌ Error initializing modules:', error);
            throw error;
        }
    }

    // ✅ Fix: Ensure `updateModuleProgress` is inside the class
    async updateModuleProgress(moduleId, userId, progress) {
        try {
            const progressRecord = await UserProgress.findOneAndUpdate(
                { userId, moduleId },
                { $set: { progress } },
                { new: true, upsert: true }
            );

            return { success: true, progress: progressRecord?.progress || 0 };
        } catch (error) {
            console.error('❌ Error updating module progress:', error);
            return { success: false, error: 'Failed to update progress' };
        }
    }
}

// ✅ Ensure Proper Export
module.exports = new ModuleService();  // Export single instance

