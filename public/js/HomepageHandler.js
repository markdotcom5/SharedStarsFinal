import CountdownTimer from './CountdownTimer.js';

class HomepageHandler {
    constructor() {
        console.log('🚀 Initializing Homepage Handler...');
        this.initializeComponents();
    }

    initializeComponents() {
        this.initializeCountdownTimers();
    }

    initializeCountdownTimers() {
        new CountdownTimer('globalCountdown', '/api/countdown/global');
        new CountdownTimer('personalCountdown', '/api/countdown/user');
    }
}

// ✅ Ensure Homepage Handler is initialized on page load
document.addEventListener('DOMContentLoaded', () => {
    new HomepageHandler();
});
