// public/js/visualizations/ProgressTracker.js
class ProgressTracker {
    constructor() {
        this.container = this.createContainer();
        this.initializeWebSocket();
    }

    createContainer() {
        const container = document.createElement('div');
        container.className = 'fixed left-4 bottom-4 w-80 bg-black/80 rounded-xl p-4';
        container.innerHTML = `
            <div class="space-y-4">
                <!-- Progress Overview -->
                <div class="progress-overview">
                    <h3 class="text-blue-400 font-bold">Training Progress</h3>
                    <div class="progress-bar h-2 bg-gray-700 rounded-full mt-2">
                        <div class="progress w-0 h-full bg-blue-500 rounded-full transition-all"></div>
                    </div>
                </div>

                <!-- Credits Section -->
                <div class="credits-overview">
                    <h4 class="text-sm text-gray-400">SharedStars Credits</h4>
                    <div class="flex justify-between items-center">
                        <div class="text-2xl font-bold text-green-400" id="total-credits">0</div>
                        <div class="text-xs text-gray-400">
                            Next Milestone: <span id="next-milestone">1000</span>
                        </div>
                    </div>
                    <!-- Credit Breakdown -->
                    <div class="credit-breakdown mt-2 space-y-1 text-xs"></div>
                </div>

                <!-- Timeline Section -->
                <div class="timeline-overview">
                    <h4 class="text-sm text-gray-400">Journey Timeline</h4>
                    <div class="flex items-center space-x-2">
                        <div class="text-xl font-bold text-blue-400" id="years-to-launch">--</div>
                        <div class="text-xs text-gray-400">Years to Launch</div>
                    </div>
                    <div class="text-xs text-gray-400" id="timeline-acceleration"></div>
                </div>

                <!-- Skills Overview -->
                <div class="skills-overview space-y-2">
                    <h4 class="text-sm text-gray-400">Skills Development</h4>
                    <div class="skills-grid"></div>
                </div>

                <!-- Real-time Metrics -->
                <div class="real-time-metrics">
                    <div class="metrics-grid grid grid-cols-2 gap-2"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    updateProgress(data) {
        const { overall, skills, metrics, credits, timeline } = data;
        
        // Update original progress
        this.container.querySelector('.progress').style.width = `${overall}%`;
        this.updateSkills(skills);
        this.updateMetrics(metrics);

        // Update credits if provided
        if (credits) {
            this.updateCredits(credits);
        }

        // Update timeline if provided
        if (timeline) {
            this.updateTimeline(timeline);
        }
    }

    updateCredits(credits) {
        const totalCreditsEl = this.container.querySelector('#total-credits');
        const breakdownEl = this.container.querySelector('.credit-breakdown');
        const nextMilestoneEl = this.container.querySelector('#next-milestone');

        // Animate credit count
        this.animateNumber(totalCreditsEl, parseInt(totalCreditsEl.textContent), credits.total);

        // Calculate next milestone
        const nextMilestone = Math.ceil(credits.total / 1000) * 1000;
        nextMilestoneEl.textContent = nextMilestone;

        // Update breakdown
        breakdownEl.innerHTML = `
            <div class="flex justify-between">
                <span>Module Credits:</span>
                <span class="text-green-400">+${credits.breakdown.moduleCredits}</span>
            </div>
            <div class="flex justify-between">
                <span>Achievement Bonus:</span>
                <span class="text-green-400">+${credits.breakdown.achievementCredits}</span>
            </div>
            <div class="flex justify-between">
                <span>Streak Bonus:</span>
                <span class="text-green-400">+${Math.round(credits.breakdown.streakBonus * 100)}%</span>
            </div>
            <div class="flex justify-between">
                <span>Subscription Bonus:</span>
                <span class="text-green-400">+${Math.round((credits.breakdown.subscriptionMultiplier - 1) * 100)}%</span>
            </div>
        `;
    }

    updateTimeline(timeline) {
        const yearsEl = this.container.querySelector('#years-to-launch');
        const accelerationEl = this.container.querySelector('#timeline-acceleration');

        // Animate years countdown
        this.animateNumber(yearsEl, parseInt(yearsEl.textContent) || 15, timeline.yearsToLaunch);

        // Show acceleration message
        const acceleration = 15 - timeline.yearsToLaunch;
        if (acceleration > 0) {
            accelerationEl.textContent = `🚀 Timeline accelerated by ${acceleration} years`;
            accelerationEl.classList.add('text-green-400');
        }
    }

    animateNumber(element, start, end) {
        if (isNaN(start) || isNaN(end)) return;
        
        const duration = 1000;
        const steps = 60;
        const stepValue = (end - start) / steps;
        let current = start;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += stepValue;
            element.textContent = Math.round(current);

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = end;
            }
        }, duration / steps);
    }

    initializeWebSocket() {
        const ws = new WebSocket(`wss://${window.location.host}/ws`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'progress_update':
                    this.updateProgress(data.progress);
                    break;
                    
                case 'credit_update':
                    this.updateCredits(data.data);
                    break;
                    
                case 'timeline_update':
                    this.updateTimeline(data.data);
                    break;
                    
                case 'achievement_unlocked':
                    this.showAchievementNotification(data.data);
                    break;
            }
        };

        ws.onopen = () => {
            console.log('✅ Progress tracker connected');
        };

        ws.onerror = (error) => {
            console.error('❌ Progress tracker connection error:', error);
        };

        ws.onclose = () => {
            console.log('Connection closed, attempting to reconnect...');
            setTimeout(() => this.initializeWebSocket(), 5000);
        };
    }

    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 transform translate-y-0 transition-transform duration-300';
        notification.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="text-2xl">${achievement.icon}</div>
                <div>
                    <div class="font-bold">${achievement.title}</div>
                    <div class="text-sm">+${achievement.credits} credits</div>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        // Animate out after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateY(-100%)';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Initialize tracker
const tracker = new ProgressTracker();