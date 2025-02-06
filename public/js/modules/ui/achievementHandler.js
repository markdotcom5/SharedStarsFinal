export const achievementHandler = {
    renderAchievement(achievement) {
        return `
            <div class="achievement-card bg-gradient-to-r from-purple-500 to-blue-500 p-4 rounded-lg text-white">
                <div class="achievement-icon text-3xl mb-2">${achievement.icon}</div>
                <h3 class="text-xl font-bold">${achievement.title}</h3>
                <p class="text-sm opacity-90">${achievement.description}</p>
            </div>
        `;
    },

    showNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white p-4 rounded-lg shadow-lg z-50 transform translate-y-0 transition-transform duration-300';
        notification.innerHTML = this.renderAchievement(achievement);
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateY(-100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    },

    init() {
        console.log('UI achievement handler initialized');
    }
};