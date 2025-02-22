// public/js/training-animations.js
class TrainingAnimations {
    constructor() {
        this.feedbackTypes = {
            success: {
                color: 'green',
                icon: '✓',
                animation: 'bounce'
            },
            warning: {
                color: 'yellow',
                icon: '⚠',
                animation: 'pulse'
            },
            error: {
                color: 'red',
                icon: '⨯',
                animation: 'shake'
            }
        };
    }

    async showFormFeedback(type, message) {
        const feedback = this.feedbackTypes[type];
        const element = document.createElement('div');
        element.className = `feedback-popup ${feedback.animation} bg-${feedback.color}-500/20`;
        element.innerHTML = `
            <span class="icon">${feedback.icon}</span>
            <p>${message}</p>
        `;
        
        document.body.appendChild(element);
        await this.animateFeedback(element);
        setTimeout(() => element.remove(), 3000);
    }

    async showProgressUpdate(progress) {
        const progressBar = document.querySelector('.progress-bar');
        await this.animateProgress(progressBar, progress);
    }

    async showAchievement(achievement) {
        const overlay = document.createElement('div');
        overlay.className = 'achievement-overlay';
        overlay.innerHTML = `
            <div class="achievement-card">
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
                <div class="achievement-icon">${achievement.icon}</div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        await this.animateAchievement(overlay);
        setTimeout(() => overlay.remove(), 5000);
    }
}