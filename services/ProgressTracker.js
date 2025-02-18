// services/ProgressTracker.js
const EventEmitter = require('events');
const AISpaceCoach = require('./AISpaceCoach');
const RealTimeMonitoring = require('./RealTimeMonitoring');


class ProgressTracker extends EventEmitter {
    constructor(achievementService) {
        super();
        this.achievementService = achievementService;
        this.aiCoach = AISpaceCoach;
        this.monitoring = RealTimeMonitoring;
        this.progressCache = new Map();
<<<<<<< HEAD
        this.moduleProgress = new Map();
        this.vrProgress = new Map();
        this.monitoring.on('metricsUpdated', ({ sessionId, metrics }) => {
            console.log(`📊 Metrics Updated for ${sessionId}:`, metrics);
        });
    }          
=======
        this.moduleProgress = new Map(); // For module-specific tracking
        this.vrProgress = new Map(); // For VR session tracking
    }
>>>>>>> 309f5a5 (settled up local tailwind css, configured according to our brand guidelines and served ejs engine to express server and configured and devloped header and home section.)

    async initializeProgress(userId) {
<<<<<<< HEAD
        if (!this.progressCache.has(userId)) {
            this.progressCache.set(userId, {
                currentProgress: 0,
                lastUpdated: new Date(),
                achievements: []
            });
=======
        try {
            if (!this.progressCache.has(userId)) {
                this.progressCache.set(userId, {
                    currentProgress: 0,
                    lastUpdated: new Date(),
                    achievements: [],
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
                lastUpdated: new Date(),
            };

            this.emit('progress-update', { userId, progress: updatedProgress });

            const newAchievements = await this.achievementService.checkAchievements(
                userId,
                progress
            );
            if (newAchievements.length > 0) {
                updatedProgress.achievements = [...currentData.achievements, ...newAchievements];
            }

            this.progressCache.set(userId, updatedProgress);
            return {
                progress: updatedProgress,
                newAchievements,
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
                events: [],
            };

            // Update session data
            sessionData.events.push({
                timestamp: new Date(),
                ...data,
            });

            // Update metrics
            sessionData.metrics = {
                ...sessionData.metrics,
                ...this.calculateVRMetrics(sessionData.events),
            };

            userVRProgress.set(sessionId, sessionData);
            this.vrProgress.set(userId, userVRProgress);

            this.emit('vr-progress-update', {
                userId,
                sessionId,
                data: sessionData,
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
                achievements: [],
            };

            // Update history
            moduleData.history.push({
                timestamp: new Date(),
                ...data,
            });

            // Update metrics
            moduleData.metrics = {
                ...moduleData.metrics,
                ...this.calculateModuleMetrics(moduleData.history),
            };

            userModuleProgress.set(moduleId, moduleData);
            this.moduleProgress.set(userId, userModuleProgress);

            // Emit module progress event
            this.emit('module-progress-update', {
                userId,
                moduleId,
                data: moduleData,
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
                achievements: [],
            };
            this.progressCache.set(userId, initialProgress);
            return initialProgress;
        } catch (error) {
            console.error('Error resetting progress:', error);
            throw error;
>>>>>>> 309f5a5 (settled up local tailwind css, configured according to our brand guidelines and served ejs engine to express server and configured and devloped header and home section.)
        }
        return this.progressCache.get(userId);
    }

    async trackProgress(userId, sessionData) {
        try {
            const currentProgress = await this.getProgress(userId);
            const aiAnalysis = await this.aiCoach.analyzeProgress(userId, {
                ...sessionData,
                currentProgress
            });

            const metrics = await this.monitoring.gatherMetrics(sessionData.sessionId);
            const combinedAnalysis = this.combineInsights(aiAnalysis, metrics);

            const updatedProgress = await this.updateProgress(userId, combinedAnalysis);
            const nextSteps = await this.aiCoach.generateNextSteps(userId, updatedProgress);

            this.emit('progress-updated', {
                userId,
                progress: updatedProgress,
                analysis: combinedAnalysis,
                nextSteps
            });

            return {
                progress: updatedProgress,
                recommendations: nextSteps,
                metrics: combinedAnalysis.metrics
            };
        } catch (error) {
            console.error('Progress Tracking Error:', error);
            throw error;
        }
    }

    async updateProgress(userId, analysis) {
        const updatedProgress = {
            ...await this.getProgress(userId),
            ...this.calculateProgressUpdates(analysis)
        };

        this.progressCache.set(userId, updatedProgress);
        await this.aiCoach.updateProgress(userId, updatedProgress);

        return updatedProgress;
    }

    async trackVRSession(userId, sessionId, data) {
        let userVRProgress = this.vrProgress.get(userId) || new Map();
        let sessionData = userVRProgress.get(sessionId) || { startTime: new Date(), metrics: {}, events: [] };

        sessionData.events.push({ timestamp: new Date(), ...data });
        sessionData.metrics = { ...sessionData.metrics, ...this.calculateVRMetrics(sessionData.events) };

        userVRProgress.set(sessionId, sessionData);
        this.vrProgress.set(userId, userVRProgress);

        this.emit('vr-progress-update', { userId, sessionId, data: sessionData });

        return sessionData;
    }

    async trackModuleProgress(userId, moduleId, data) {
        let userModuleProgress = this.moduleProgress.get(userId) || new Map();
        let moduleData = userModuleProgress.get(moduleId) || { history: [], metrics: {}, achievements: [] };

        moduleData.history.push({ timestamp: new Date(), ...data });
        moduleData.metrics = { ...moduleData.metrics, ...this.calculateModuleMetrics(moduleData.history) };

        userModuleProgress.set(moduleId, moduleData);
        this.moduleProgress.set(userId, userModuleProgress);

        this.emit('module-progress-update', { userId, moduleId, data: moduleData });

        return moduleData;
    }

    async getProgress(userId) {
        return this.progressCache.get(userId) || await this.initializeProgress(userId);
    }

    async resetProgress(userId) {
        const initialProgress = { currentProgress: 0, lastUpdated: new Date(), achievements: [] };
        this.progressCache.set(userId, initialProgress);
        return initialProgress;
    }

    calculateProgressUpdates(analysis) {
        return {
            overallProgress: this.calculateOverallProgress(analysis),
            skillLevels: this.calculateSkillLevels(analysis),
            achievements: this.identifyAchievements(analysis),
            readiness: this.calculateReadiness(analysis)
        };
    }

    calculateOverallProgress(analysis) {
        const weights = { performance: 0.4, knowledge: 0.3, skills: 0.3 };
        return Object.entries(weights).reduce((total, [key, weight]) => total + (analysis[key].current || 0) * weight, 0);
    }

    calculateSkillLevels(analysis) {
        return {
            mastered: analysis.skills.mastered.length,
            developing: analysis.skills.developing.length,
            total: analysis.skills.mastered.length + analysis.skills.developing.length
        };
    }

    identifyAchievements(analysis) {
        const achievements = [];
        if (analysis.performance.current > 90) achievements.push('performance_excellence');
        if (analysis.knowledge.level > 80) achievements.push('knowledge_master');
        if (analysis.skills.mastered.length > 5) achievements.push('skill_expert');
        return achievements;
    }

    calculateReadiness(analysis) {
        const readinessFactors = {
            performance: analysis.metrics.efficiency > 85,
            safety: analysis.metrics.safety > 90,
            knowledge: analysis.knowledge.level > 75,
            skills: analysis.skills.mastered.length >= 3
        };

        return Object.values(readinessFactors).filter(Boolean).length /
               Object.values(readinessFactors).length * 100;
    }

    calculateVRMetrics(events) {
        return {
            performance: this.calculateVRPerformance(events),
            engagement: this.calculateEngagement(events),
            technicalMetrics: this.calculateTechnicalMetrics(events),
        };
    }

    calculateModuleMetrics(history) {
        return {
            completionRate: this.calculateCompletionRate(history),
            accuracy: this.calculateAccuracy(history),
            timeSpent: this.calculateTimeSpent(history),
        };
    }

    calculateVRPerformance(events) {
        const performanceEvents = events.filter((e) => e.type === 'performance');
        return performanceEvents.length > 0
            ? performanceEvents.reduce((sum, e) => sum + e.score, 0) / performanceEvents.length
            : 0;
    }

    calculateEngagement(events) {
        const interactionEvents = events.filter((e) => e.type === 'interaction');
        return {
            frequency: interactionEvents.length,
            intensity: this.calculateInteractionIntensity(interactionEvents),
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

    cleanup() {
        this.progressCache.clear();
        this.moduleProgress.clear();
        this.vrProgress.clear();
        this.removeAllListeners();
    }
}

<<<<<<< HEAD
=======
// Export as a ready-to-use instance
>>>>>>> 309f5a5 (settled up local tailwind css, configured according to our brand guidelines and served ejs engine to express server and configured and devloped header and home section.)
module.exports = new ProgressTracker();
