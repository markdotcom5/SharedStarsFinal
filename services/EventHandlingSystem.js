// services/EventHandlingSystem.js
const EventEmitter = require('events');
const CoreTrainingSystem = require('./CoreTrainingSystem');

class EventHandlingSystem extends EventEmitter {
    constructor() {
        super();
        this.coreSystem = CoreTrainingSystem;
        this.activeHandlers = new Map();
        this.setupSystemEvents();
    }

    setupSystemEvents() {
        // Module events
        this.on('module:progress', this.handleModuleProgress.bind(this));
        this.on('module:assessment', this.handleModuleAssessment.bind(this));
        this.on('module:completion', this.handleModuleCompletion.bind(this));

        // AI events
        this.on('ai:feedback', this.handleAIFeedback.bind(this));
        this.on('ai:recommendation', this.handleAIRecommendation.bind(this));
        this.on('ai:adaptation', this.handleAIAdaptation.bind(this));

        // User events
        this.on('user:achievement', this.handleUserAchievement.bind(this));
        this.on('user:certification', this.handleUserCertification.bind(this));
    }

    registerModuleHandlers(moduleId, handlers) {
        this.activeHandlers.set(moduleId, handlers);
        
        // Set up module-specific events
        Object.entries(handlers).forEach(([event, handler]) => {
            this.on(`${moduleId}:${event}`, async (data) => {
                try {
                    await handler(data);
                    // Propagate to core system
                    await this.coreSystem.handleModuleEvent(moduleId, event, data);
                } catch (error) {
                    console.error(`Error handling ${moduleId} ${event}:`, error);
                }
            });
        });
    }

    // Module event handlers
    async handleModuleProgress(data) {
        const { moduleId, userId, progress } = data;
        try {
            // Update module progress
            await this.coreSystem.handleModuleProgress(moduleId, data);
            
            // Check for achievements
            await this.checkAchievements(userId, moduleId, progress);
            
            // Generate AI feedback
            const feedback = await this.coreSystem.generateFeedback(userId, moduleId, progress);
            
            // Emit feedback
            this.emit('ai:feedback', {
                userId,
                moduleId,
                feedback,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('Error handling module progress:', error);
        }
    }

    async handleModuleAssessment(data) {
        const { moduleId, userId, assessment } = data;
        try {
            // Process assessment
            await this.coreSystem.handleModuleAssessment(moduleId, data);
            
            // Check for certifications
            await this.checkCertifications(userId, moduleId, assessment);
            
            // Update learning path
            await this.coreSystem.updateLearningPath(userId, moduleId);
        } catch (error) {
            console.error('Error handling module assessment:', error);
        }
    }

    async handleModuleCompletion(data) {
        const { moduleId, userId } = data;
        try {
            // Update completion status
            await this.coreSystem.handleModuleCompletion(moduleId, data);
            
            // Check prerequisites for next modules
            await this.checkNextModules(userId, moduleId);
        } catch (error) {
            console.error('Error handling module completion:', error);
        }
    }

    // AI event handlers
    async handleAIFeedback(data) {
        const { userId, moduleId, feedback } = data;
        try {
            // Process AI feedback
            await this.coreSystem.processAIFeedback(moduleId, feedback);
            
            // Update user's learning model
            await this.coreSystem.updateLearningModel(userId, moduleId, feedback);
        } catch (error) {
            console.error('Error handling AI feedback:', error);
        }
    }

    async handleAIRecommendation(data) {
        const { userId, moduleId, recommendations } = data;
        try {
            // Process recommendations
            await this.coreSystem.processAIRecommendations(userId, recommendations);
            
            // Update learning path
            await this.coreSystem.updateLearningPath(userId, moduleId);
        } catch (error) {
            console.error('Error handling AI recommendations:', error);
        }
    }

    async handleAIAdaptation(data) {
        const { userId, moduleId, adaptation } = data;
        try {
            // Apply AI adaptations
            await this.coreSystem.applyAIAdaptation(userId, moduleId, adaptation);
            
            // Update module difficulty
            await this.updateModuleDifficulty(userId, moduleId, adaptation);
        } catch (error) {
            console.error('Error handling AI adaptation:', error);
        }
    }

    // Helper methods
    async checkAchievements(userId, moduleId, progress) {
        const achievements = await this.coreSystem.checkAchievements(userId, moduleId, progress);
        if (achievements.length > 0) {
            this.emit('user:achievement', { userId, moduleId, achievements });
        }
    }

    async checkCertifications(userId, moduleId, assessment) {
        const certifications = await this.coreSystem.checkCertifications(userId, moduleId, assessment);
        if (certifications.length > 0) {
            this.emit('user:certification', { userId, moduleId, certifications });
        }
    }
    async checkNextModules(userId, moduleId) {
        try {
            const nextModules = await this.coreSystem.getNextModules(userId, moduleId);
            for (const nextModule of nextModules) {
                const readiness = await this.coreSystem.checkModuleReadiness(userId, nextModule);
                if (readiness.ready) {
                    this.emit('module:unlock', {
                        userId,
                        moduleId: nextModule,
                        unlockedBy: moduleId
                    });
                }
            }
        } catch (error) {
            console.error('Error checking next modules:', error);
        }
    }

    async updateModuleDifficulty(userId, moduleId, adaptation) {
        try {
            await this.coreSystem.updateModuleDifficulty(userId, moduleId, adaptation);
            this.emit('module:difficulty-updated', {
                userId,
                moduleId,
                newDifficulty: adaptation.difficulty
            });
        } catch (error) {
            console.error('Error updating module difficulty:', error);
        }
    }

    // Utility methods for modules to use
    emitProgress(moduleId, data) {
        this.emit('module:progress', { moduleId, ...data });
    }

    emitAssessment(moduleId, data) {
        this.emit('module:assessment', { moduleId, ...data });
    }

    emitCompletion(moduleId, data) {
        this.emit('module:completion', { moduleId, ...data });
    }

    emitAIFeedback(moduleId, data) {
        this.emit('ai:feedback', { moduleId, ...data });
    }
}

module.exports = new EventHandlingSystem();