class AchievementsController {
    constructor() {
        this.achievements = [];
        this.socket = null;
        this.eventListeners = new Map();
        this.initialize();
    }

    async initialize() {
        try {
            await this.loadAchievements();
            this.setupWebSocket();
            this.setupEventListeners();
            this.renderAchievements();
        } catch (error) {
            console.error('Achievement initialization failed:', error);
            this.handleError(error);
        }
    }

    async loadAchievements() {
        try {
            const response = await fetch('/api/achievements', {
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.achievements = await response.json();
            this.emit('achievementsLoaded', this.achievements);
        } catch (error) {
            console.error('Loading achievements failed:', error);
            throw error;
        }
    }

    setupWebSocket() {
        try {
            this.socket = new WebSocket(`wss://${window.location.host}/ws/achievements`);
            
            this.socket.onmessage = (event) => this.handleAchievementUpdate(JSON.parse(event.data));
            this.socket.onerror = (error) => this.handleError(error);
            this.socket.onclose = () => this.handleDisconnect();
            
            // Heartbeat to keep connection alive
            setInterval(() => {
                if (this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30000);
        } catch (error) {
            console.error('WebSocket setup failed:', error);
            this.handleError(error);
        }
    }

    handleAchievementUpdate(data) {
        switch(data.type) {
            case 'new':
                this.achievements.push(data.achievement);
                break;
            case 'update':
                const index = this.achievements.findIndex(a => a.id === data.achievement.id);
                if (index !== -1) {
                    this.achievements[index] = data.achievement;
                }
                break;
            case 'delete':
                this.achievements = this.achievements.filter(a => a.id !== data.achievementId);
                break;
        }
        this.renderAchievements();
        this.emit('achievementsUpdated', this.achievements);
    }

    renderAchievements() {
        const container = document.getElementById('achievements-container');
        if (!container) return;

        container.innerHTML = this.achievements.map(achievement => `
            <div class="achievement-card cosmic-card" data-id="${achievement.id}">
                <div class="achievement-icon">
                    ${this.sanitizeHTML(achievement.icon)}
                </div>
                <div class="achievement-info">
                    <h3>${this.sanitizeHTML(achievement.title)}</h3>
                    <p>${this.sanitizeHTML(achievement.description)}</p>
                    <div class="progress-bar">
                        <div class="progress" 
                             style="width: ${achievement.progress}%" 
                             role="progressbar" 
                             aria-valuenow="${achievement.progress}" 
                             aria-valuemin="0" 
                             aria-valuemax="100">
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.setupAchievementCardListeners();
    }

    setupAchievementCardListeners() {
        const cards = document.querySelectorAll('.achievement-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const achievementId = card.dataset.id;
                this.showAchievementDetails(achievementId);
            });
        });
    }

    showAchievementDetails(achievementId) {
        const achievement = this.achievements.find(a => a.id === achievementId);
        if (!achievement) return;

        // Implementation for showing achievement details modal
        // This would integrate with your UI components
    }

    // Event handling
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // Error handling
    handleError(error) {
        console.error('Achievement Error:', error);
        this.emit('error', error);
        // Implement your error handling UI here
    }

    handleDisconnect() {
        console.log('WebSocket disconnected, attempting to reconnect...');
        setTimeout(() => this.setupWebSocket(), 5000);
    }

    // Security
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    // Cleanup
    destroy() {
        if (this.socket) {
            this.socket.close();
        }
        this.eventListeners.clear();
        // Remove any DOM listeners
    }
}

export default AchievementsController;