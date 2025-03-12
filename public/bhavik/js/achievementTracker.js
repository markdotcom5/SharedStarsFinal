// public/js/achievementTracker.js
class AchievementTracker {
    constructor() {
        this.ws = new WebSocket(`wss://${window.location.host}/ws`);
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'achievement-unlocked':
                    this.displayAchievement(data.achievement);
                    break;
                case 'progress-update':
                    this.updateProgressDisplay(data.progress);
                    break;
            }
        };
    }

    displayAchievement(achievement) {
        // Use existing AchievementDisplay class
        window.achievementDisplay.displayAchievement(achievement);
    }

    updateProgressDisplay(progress) {
        // Update progress bars and metrics
        const progressElements = {
            moduleProgress: document.querySelector('.module-progress'),
            skillLevels: document.querySelector('.skill-levels'),
            metrics: document.querySelector('.performance-metrics')
        };

        if (progressElements.moduleProgress) {
            progressElements.moduleProgress.style.width = `${progress.percentage}%`;
        }

        if (progressElements.skillLevels) {
            Object.entries(progress.skillLevels).forEach(([skill, level]) => {
                const skillElement = document.querySelector(`.skill-${skill.toLowerCase()}`);
                if (skillElement) {
                    skillElement.style.width = `${level}%`;
                }
            });
        }
    }
}

// Initialize tracker
document.addEventListener('DOMContentLoaded', () => {
    window.achievementTracker = new AchievementTracker();
});