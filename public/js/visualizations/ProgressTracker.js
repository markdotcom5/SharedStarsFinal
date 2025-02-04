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
                <div class="progress-overview">
                    <h3 class="text-blue-400 font-bold">Training Progress</h3>
                    <div class="progress-bar h-2 bg-gray-700 rounded-full mt-2">
                        <div class="progress w-0 h-full bg-blue-500 rounded-full transition-all"></div>
                    </div>
                </div>
                <div class="skills-overview space-y-2">
                    <h4 class="text-sm text-gray-400">Skills Development</h4>
                    <div class="skills-grid"></div>
                </div>
                <div class="real-time-metrics">
                    <div class="metrics-grid grid grid-cols-2 gap-2"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
        return container;
    }

    updateProgress(data) {
        const { overall, skills, metrics } = data;
        this.container.querySelector('.progress').style.width = `${overall}%`;
        
        this.updateSkills(skills);
        this.updateMetrics(metrics);
    }

    updateSkills(skills) {
        const skillsGrid = this.container.querySelector('.skills-grid');
        skillsGrid.innerHTML = Object.entries(skills).map(([skill, level]) => `
            <div class="skill-item">
                <div class="flex justify-between text-xs">
                    <span class="text-gray-300">${skill}</span>
                    <span class="text-blue-300">${level}%</span>
                </div>
                <div class="h-1 bg-gray-700 rounded-full mt-1">
                    <div class="h-full bg-blue-500 rounded-full" style="width: ${level}%"></div>
                </div>
            </div>
        `).join('');
    }

    updateMetrics(metrics) {
        const metricsGrid = this.container.querySelector('.metrics-grid');
        metricsGrid.innerHTML = Object.entries(metrics).map(([key, value]) => `
            <div class="metric-item bg-gray-800/50 rounded p-2">
                <div class="text-xs text-gray-400">${key}</div>
                <div class="text-lg text-white">${value}</div>
            </div>
        `).join('');
    }

    initializeWebSocket() {
        const ws = new WebSocket(`wss://${window.location.host}/ws`);
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'progress_update') {
                this.updateProgress(data.progress);
            }
        };
    }
}
