// services/ProgressTracker.js
class ProgressTracker {
    constructor() {
        this.userProgress = new Map();
        this.achievementService = new AchievementService();
    }

    async updateProgress(userId, data) {
        let progress = this.userProgress.get(userId) || this.initializeProgress();
        
        // Update progress metrics
        progress = {
            ...progress,
            completedModules: data.completedModules || progress.completedModules,
            totalTime: data.timeSpent || progress.totalTime,
            lastAssessmentScore: data.assessmentScore || progress.lastAssessmentScore,
            consecutiveDays: this.calculateConsecutiveDays(progress, data.timestamp),
            skillLevels: {
                ...progress.skillLevels,
                ...data.skillLevels
            }
        };

        this.userProgress.set(userId, progress);

        // Check for achievements
        const newAchievements = await this.achievementService.checkAchievements(userId, progress);
        
        if (newAchievements.length > 0) {
            await this.handleNewAchievements(userId, newAchievements);
        }

        return {
            progress,
            newAchievements
        };
    }

    initializeProgress() {
        return {
            completedModules: 0,
            totalTime: 0,
            lastAssessmentScore: 0,
            consecutiveDays: 0,
            lastActive: new Date(),
            skillLevels: {
                technical: 0,
                theoretical: 0,
                practical: 0
            }
        };
    }

    calculateConsecutiveDays(progress, timestamp) {
        const lastActive = new Date(progress.lastActive);
        const currentDate = new Date(timestamp);
        const dayDifference = Math.floor((currentDate - lastActive) / (1000 * 60 * 60 * 24));
        
        return dayDifference === 1 ? 
            progress.consecutiveDays + 1 : 
            dayDifference === 0 ? 
                progress.consecutiveDays : 0;
    }

    async handleNewAchievements(userId, achievements) {
        // Emit achievements to WebSocket
        global.wss.clients.forEach(client => {
            if (client.userId === userId) {
                client.send(JSON.stringify({
                    type: 'achievement_unlocked',
                    achievements
                }));
            }
        });

        // Store achievements in database
        await this.storeAchievements(userId, achievements);
    }

    async storeAchievements(userId, achievements) {
        try {
            // Assuming you have a User model with achievements array
            await User.findByIdAndUpdate(userId, {
                $push: {
                    achievements: {
                        $each: achievements.map(a => ({
                            ...a,
                            unlockedAt: new Date()
                        }))
                    }
                }
            });
        } catch (error) {
            console.error('Error storing achievements:', error);
        }
    }
}