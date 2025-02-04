// public/js/eventHandler.js
class TrainingEventHandler {
    constructor() {
        this.socket = new WebSocket(`wss://${window.location.host}/ws`);
        this.progressTracker = new ProgressTracker();
        this.achievementDisplay = new AchievementDisplay();
        this.initializeWebSocket();
    }

    initializeWebSocket() {
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch(data.type) {
                case 'progress_update':
                    this.progressTracker.updateProgress(data.progress);
                    break;
                case 'achievement_unlocked':
                    this.achievementDisplay.showAchievement(data.achievement);
                    break;
                case 'skill_increase':
                    this.progressTracker.updateSkill(data.skill);
                    break;
            }
        };
    }
}