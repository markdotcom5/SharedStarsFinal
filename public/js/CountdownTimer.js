// public/js/CountdownTimer.js
export default class CountdownTimer {
    constructor(elementId, endpoint, options = {}) {
        this.timerElement = document.getElementById(elementId);
        this.endpoint = endpoint;
        this.options = {
            showLabels: options.showLabels ?? true,
            updateInterval: options.updateInterval ?? 1000,
            moduleId: options.moduleId,
            format: options.format ?? 'full', // 'full', 'compact', or 'custom'
        };

        if (!this.timerElement) {
            console.error(`⚠️ Countdown timer element (#${elementId}) not found.`);
            return;
        }

        this.initialize();
    }

    async initialize() {
        // Create timer display elements
        this.createTimerElements();
        this.updateCountdown();
    }

    createTimerElements() {
        this.timerElement.innerHTML = `
            <div class="countdown-container">
                <div class="countdown-section">
                    <span class="countdown-value years">0</span>
                    <span class="countdown-label">Years</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value months">0</span>
                    <span class="countdown-label">Months</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value weeks">0</span>
                    <span class="countdown-label">Weeks</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value days">0</span>
                    <span class="countdown-label">Days</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value hours">0</span>
                    <span class="countdown-label">Hours</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value minutes">0</span>
                    <span class="countdown-label">Minutes</span>
                </div>
                <div class="countdown-section">
                    <span class="countdown-value seconds">0</span>
                    <span class="countdown-label">Seconds</span>
                </div>
            </div>
        `;

        // Add base styles
        const style = document.createElement('style');
        style.textContent = `
            .countdown-container {
                display: flex;
                gap: 1rem;
                justify-content: center;
                align-items: center;
                font-family: 'Arial', sans-serif;
            }
            .countdown-section {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-width: 60px;
            }
            .countdown-value {
                font-size: 1.5rem;
                font-weight: bold;
                color: #007bff;
            }
            .countdown-label {
                font-size: 0.8rem;
                color: #6c757d;
                text-transform: uppercase;
            }
            .countdown-expired {
                color: #dc3545;
            }
        `;
        document.head.appendChild(style);
    }

    async updateCountdown() {
        try {
            const url = this.options.moduleId
                ? `${this.endpoint}/${this.options.moduleId}`
                : this.endpoint;

            const response = await fetch(url);
            const data = await response.json();

            if (!data.success) throw new Error('Failed to fetch countdown data');

            // Get the relevant countdown data
            const countdownData = this.options.moduleId
                ? data.countdown.deadlines.nextSession.remaining
                : data.countdowns[0]?.deadlines.nextSession.remaining;

            this.renderCountdown(countdownData);

            // Schedule next update
            setTimeout(() => this.updateCountdown(), this.options.updateInterval);
        } catch (error) {
            console.error('❌ Error fetching countdown:', error);
            this.showError('🚀 The countdown is offline.');
        }
    }

    renderCountdown(countdown) {
        if (!countdown) {
            this.showError('🚀 The journey begins!');
            return;
        }

        // Update each time unit
        const units = ['years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'];
        units.forEach((unit) => {
            const element = this.timerElement.querySelector(`.${unit}`);
            if (element) {
                element.textContent = countdown[unit].toString().padStart(2, '0');
            }
        });

        // Handle expired timer
        if (countdown.totalSeconds <= 0) {
            this.timerElement.classList.add('countdown-expired');
        } else {
            this.timerElement.classList.remove('countdown-expired');
        }

        // Update visibility of labels based on options
        const labels = this.timerElement.querySelectorAll('.countdown-label');
        labels.forEach((label) => {
            label.style.display = this.options.showLabels ? 'block' : 'none';
        });
    }

    showError(message) {
        this.timerElement.innerHTML = `
            <div class="countdown-error">
                ${message}
            </div>
        `;
    }

    // Method to format time based on options
    formatTime(countdown) {
        if (this.options.format === 'compact') {
            return countdown.formatted;
        }

        if (this.options.format === 'custom') {
            // Implement custom formatting if needed
            return this.options.formatFn?.(countdown) ?? countdown.formatted;
        }

        // Default full format
        return `${countdown.years}y ${countdown.months}m ${countdown.weeks}w ${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s`;
    }
}

// ✅ Initialize Countdown Timer when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Global countdown with full format
    new CountdownTimer('globalCountdown', '/api/countdown/global', {
        showLabels: true,
        format: 'full',
    });

    // Personal countdown with compact format
    new CountdownTimer('personalCountdown', '/api/countdown/user', {
        showLabels: true,
        format: 'compact',
    });

    // Optional: Module-specific countdown
    if (document.getElementById('moduleCountdown')) {
        new CountdownTimer('moduleCountdown', '/api/countdown/module', {
            showLabels: true,
            format: 'full',
            moduleId: document.getElementById('moduleCountdown').dataset.moduleId,
        });
    }
});
