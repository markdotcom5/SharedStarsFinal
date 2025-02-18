export const achievementHandler = {
    achievements: new Map(),

    async trackAchievement(userId, achievementType) {
        try {
            const response = await fetch('/api/achievements/track', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId, achievementType }),
            });
            return await response.json();
        } catch (error) {
            console.error('Achievement tracking error:', error);
            throw error;
        }
    },

    displayAchievement(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <h3>${achievement.title}</h3>
                <p>${achievement.description}</p>
            </div>
        `;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 5000);
    },

    init() {
        console.log('Core achievement handler initialized');
    },
};
