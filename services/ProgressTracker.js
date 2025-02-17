// services/ProgressTracker.js
const EventEmitter = require('events');

class ProgressTracker extends EventEmitter {
    constructor(achievementService) {
        super();
        this.achievementService = achievementService;
        this.progressCache = new Map();
        this.moduleProgress = new Map();  // For module-specific tracking
        this.vrProgress = new Map();      // For VR session tracking
    }

    // Existing methods
    async initializeProgress(userId) {
        try {
            if (!this.progressCache.has(userId)) {
                this.progressCache.set(userId, {
                    currentProgress: 0,
                    lastUpdated: new Date(),
                    achievements: []
                });
            }
            return this.progressCache.get(userId);
        } catch (error) {
            console.error('Error initializing progress:', error);
            throw error;
        }
    }

    async updateProgress(userId, progress) {
        try {
            await this.initializeProgress(userId);
            const currentData = this.progressCache.get(userId);
            const updatedProgress = {
                ...currentData,
                currentProgress: progress,
                lastUpdated: new Date()
            };

            this.emit('progress-update', { userId, progress: updatedProgress });

            const newAchievements = await this.achievementService.checkAchievements(userId, progress);
            if (newAchievements.length > 0) {
                updatedProgress.achievements = [
                    ...currentData.achievements,
                    ...newAchievements
                ];
            }

            this.progressCache.set(userId, updatedProgress);
            return {
                progress: updatedProgress,
                newAchievements
            };
        } catch (error) {
            console.error('Error updating progress:', error);
            throw error;
        }
    }

    // New VR tracking methods
    async trackVRSession(userId, sessionId, data) {
        try {
            let userVRProgress = this.vrProgress.get(userId) || new Map();
            let sessionData = userVRProgress.get(sessionId) || {
                startTime: new Date(),
                metrics: {},
                events: []
            };

            // Update session data
            sessionData.events.push({
                timestamp: new Date(),
                ...data
            });

            // Update metrics
            sessionData.metrics = {
                ...sessionData.metrics,
                ...this.calculateVRMetrics(sessionData.events)
            };

            userVRProgress.set(sessionId, sessionData);
            this.vrProgress.set(userId, userVRProgress);

            this.emit('vr-progress-update', {
                userId,
                sessionId,
                data: sessionData
            });

            return sessionData;
        } catch (error) {
            console.error('Error tracking VR session:', error);
            throw error;
        }
    }

    // New module tracking methods
    async trackModuleProgress(userId, moduleId, data) {
        try {
            let userModuleProgress = this.moduleProgress.get(userId) || new Map();
            let moduleData = userModuleProgress.get(moduleId) || {
                history: [],
                metrics: {},
                achievements: []
            };

            // Update history
            moduleData.history.push({
                timestamp: new Date(),
                ...data
            });

            // Update metrics
            moduleData.metrics = {
                ...moduleData.metrics,
                ...this.calculateModuleMetrics(moduleData.history)
            };

            userModuleProgress.set(moduleId, moduleData);
            this.moduleProgress.set(userId, userModuleProgress);

            // Emit module progress event
            this.emit('module-progress-update', {
                userId,
                moduleId,
                data: moduleData
            });

            return moduleData;
        } catch (error) {
            console.error('Error tracking module progress:', error);
            throw error;
        }
    }

    // Existing methods
    async getProgress(userId) {
        try {
            const progress = this.progressCache.get(userId);
            if (!progress) {
                return await this.initializeProgress(userId);
            }
            return progress;
        } catch (error) {
            console.error('Error getting progress:', error);
            throw error;
        }
    }

    async resetProgress(userId) {
        try {
            const initialProgress = {
                currentProgress: 0,
                lastUpdated: new Date(),
                achievements: []
            };
            this.progressCache.set(userId, initialProgress);
            return initialProgress;
        } catch (error) {
            console.error('Error resetting progress:', error);
            throw error;
        }
    }

    async checkAchievementProgress(userId) {
        try {
            const progress = await this.getProgress(userId);
            return this.achievementService.calculateProgress(progress);
        } catch (error) {
            console.error('Error checking achievement progress:', error);
            throw error;
        }
    }

    // New metric calculation methods
    calculateVRMetrics(events) {
        return {
            performance: this.calculateVRPerformance(events),
            engagement: this.calculateEngagement(events),
            technicalMetrics: this.calculateTechnicalMetrics(events)
        };
    }

    calculateModuleMetrics(history) {
        return {
            completionRate: this.calculateCompletionRate(history),
            accuracy: this.calculateAccuracy(history),
            timeSpent: this.calculateTimeSpent(history)
        };
    }

    // Helper methods
    calculateVRPerformance(events) {
        const performanceEvents = events.filter(e => e.type === 'performance');
        return performanceEvents.length > 0
            ? performanceEvents.reduce((sum, e) => sum + e.score, 0) / performanceEvents.length
            : 0;
    }

    calculateEngagement(events) {
        const interactionEvents = events.filter(e => e.type === 'interaction');
        return {
            frequency: interactionEvents.length,
            intensity: this.calculateInteractionIntensity(interactionEvents)
        };
    }

    calculateInteractionIntensity(events) {
        return events.length > 0
            ? events.reduce((sum, e) => sum + (e.intensity || 0), 0) / events.length
            : 0;
    }

    clearInactiveUsers(inactivityThreshold = 24 * 60 * 60 * 1000) {
        const now = new Date();
        for (const [userId, data] of this.progressCache.entries()) {
            if (now - data.lastUpdated > inactivityThreshold) {
                this.progressCache.delete(userId);
            }
        }
    }
}

// Export as a ready-to-use instance
module.exports = new ProgressTracker();