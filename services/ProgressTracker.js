// services/ProgressTracker.js

class ProgressTracker {
    constructor(achievementService) {
        this.achievementService = achievementService;
        this.progressCache = new Map();
    }

    async initializeProgress(userId) {
        try {
            // Initialize user's progress if not exists
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
            // Initialize if needed
            await this.initializeProgress(userId);

            // Update progress
            const currentData = this.progressCache.get(userId);
            const updatedProgress = {
                ...currentData,
                currentProgress: progress,
                lastUpdated: new Date()
            };

            // Check for new achievements
            const newAchievements = await this.achievementService.checkAchievements(userId, progress);
            
            if (newAchievements.length > 0) {
                updatedProgress.achievements = [
                    ...currentData.achievements,
                    ...newAchievements
                ];
            }

            // Save updated progress
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

    // Cleanup method to prevent memory leaks
    clearInactiveUsers(inactivityThreshold = 24 * 60 * 60 * 1000) { // 24 hours by default
        const now = new Date();
        for (const [userId, data] of this.progressCache.entries()) {
            if (now - data.lastUpdated > inactivityThreshold) {
                this.progressCache.delete(userId);
            }
        }
    }
}

module.exports = ProgressTracker;