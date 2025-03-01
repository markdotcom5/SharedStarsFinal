class ProgressTrackingSystem {
    constructor(aiGuide, visualSystem) {
        this.aiGuide = aiGuide;
        this.visualSystem = visualSystem;
        this.achievements = new Map();
        this.initializeProgressTracking();
    }

    initializeProgressTracking() {
        // Progress Bar
        const progressBar = document.createElement('div');
        progressBar.className = 'fixed top-0 left-0 w-full h-1 bg-gray-800';
        
        const progress = document.createElement('div');
        progress.className = 'h-full bg-blue-500 transition-all duration-300';
        progressBar.appendChild(progress);
        document.body.appendChild(progressBar);

        // Achievement Notifications
        const achievementContainer = document.createElement('div');
        achievementContainer.className = 'fixed right-4 bottom-4 space-y-2';
        document.body.appendChild(achievementContainer);
    }

    async updateProgress(moduleId, completionData) {
        try {
            const response = await fetch('/api/progress/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    moduleId,
                    completionData,
                    timestamp: Date.now()
                })
            });

            const { progress, achievements } = await response.json();
            this.updateProgressBar(progress);
            this.handleNewAchievements(achievements);
        } catch (error) {
            console.error('Progress update error:', error);
        }
    }

    handleNewAchievements(achievements) {
        achievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
            this.visualSystem.highlightModule(achievement.moduleId, 'achievement');
        });
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = `
            achievement-notification bg-black/80 rounded-lg p-4 text-white
            transform translate-x-full animate-slide-in
        `;
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="achievement-icon w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    ${achievement.icon}
                </div>
                <div>
                    <div class="font-bold">${achievement.title}</div>
                    <div class="text-sm text-gray-400">${achievement.description}</div>
                </div>
            </div>
        `;

        document.querySelector('.achievement-container').appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    }
}