
// public/js/services/AchievementServices.js
class AchievementServices {
    constructor() {
        this.achievements = new Map();
        this.notifications = [];
        this.initializeWebSocket();
    }

    async fetchAchievements() {
        const response = await fetch('/api/achievements');
        const achievements = await response.json();
        achievements.forEach(achievement => {
            this.achievements.set(achievement.id, achievement);
        });
    }

    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = `
            achievement-notification fixed top-4 right-4 
            bg-gradient-to-r from-blue-900 to-purple-900 
            p-4 rounded-lg shadow-xl transform transition-all
            duration-500 translate-x-full
        `;

        notification.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="achievement-icon w-12 h-12 rounded-full 
                     bg-gradient-to-r from-blue-500 to-purple-500 
                     flex items-center justify-center text-2xl">
                    ${achievement.icon}
                </div>
                <div>
                    <div class="text-sm text-blue-300">Achievement Unlocked!</div>
                    <div class="font-bold text-white">${achievement.title}</div>
                    <div class="text-sm text-gray-300">${achievement.description}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);
        requestAnimationFrame(() => {
            notification.style.transform = 'translateX(0)';
        });

        setTimeout(() => {
            notification.style.transform = 'translateX(full)';
            setTimeout(() => notification.remove(), 500);
        }, 5000);
    }

    initializeWebSocket() {
        const ws = new WebSocket(`wss://${window.location.host}/ws`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'achievement_unlocked') {
                this.showNotification(data.achievement);
            }
        };
    }
}