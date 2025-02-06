// public/js/training.js

class TrainingInterface {
    constructor() {
        this.timelineManager = window.timelineManager;
        this.currentModule = null;
        this.progress = {
            totalCredits: 0,
            completedModules: [],
            activeModule: null,
            certificationProgress: {}
        };
        this.aiCoach = new AICoach();
        this.biometricMonitor = new BiometricMonitor();
        this.initializeInterface();
    }

    async initializeInterface() {
        // Progress tracking elements
        this.progressChart = new Chart(
            document.getElementById('progress-chart').getContext('2d'),
            this.getProgressChartConfig()
        );

        await this.biometricMonitor.startTracking();

        // Initialize event listeners
        document.querySelectorAll('.module-select').forEach(btn => 
            btn.addEventListener('click', e => this.startModule(e.target.dataset.moduleId))
        );

        // Real-time performance tracking
        setInterval(() => this.updateMetrics(), 1000);
    }

    async startModule(moduleId) {
        try {
            const moduleData = await this.fetchModuleContent(moduleId);
            this.currentModule = {
                id: moduleId,
                data: moduleData,
                startTime: Date.now(),
                metrics: {
                    attention: [],
                    comprehension: [],
                    performance: []
                }
            };

            // Update UI
            this.renderModuleContent(moduleData);
            this.aiCoach.startGuidance(moduleId);
            await this.biometricMonitor.startTracking();

            // Notify timeline manager
            this.timelineManager.updateModuleProgress(moduleId, 'started');
        } catch (error) {
            console.error('Error starting module:', error);
            this.showError('Failed to start module');
        }
    }

    async updateMetrics() {
        if (!this.currentModule) return;

        const metrics = await this.collectCurrentMetrics();
        const analysis = await this.aiCoach.analyzePerformance(metrics);

        // Update progress displays
        this.updateProgressChart(metrics);
        this.updateBiometricDisplay(metrics.biometrics);

        // Check for achievements/milestones
        if (analysis.achievements.length > 0) {
            analysis.achievements.forEach(achievement => {
                this.timelineManager.awardAchievement(achievement.type);
            });
        }

        // Update credit count based on performance
        const earnedCredits = this.calculateEarnedCredits(metrics);
        this.timelineManager.addCredits(earnedCredits);
    }

    async collectCurrentMetrics() {
        const biometrics = await this.biometricMonitor.getCurrentReadings();
        const performance = this.getCurrentPerformanceMetrics();
        
        return {
            biometrics,
            performance,
            timestamp: Date.now(),
            moduleProgress: this.calculateModuleProgress()
        };
    }

    calculateEarnedCredits(metrics) {
        const baseCredits = 10;
        const performanceMultiplier = metrics.performance.average;
        const attentionBonus = metrics.biometrics.attentionScore > 0.8 ? 1.5 : 1;
        
        return Math.round(baseCredits * performanceMultiplier * attentionBonus);
    }

    renderModuleContent(moduleData) {
        const container = document.getElementById('training-content');
        container.innerHTML = `
            <div class="module-interface bg-gray-900 p-6 rounded-lg">
                <div class="flex justify-between items-start">
                    <h2 class="text-2xl font-bold text-blue-400">${moduleData.title}</h2>
                    <div class="metrics-display">
                        <div class="text-green-400">Credits: <span id="credit-counter">0</span></div>
                        <div class="text-blue-400">Progress: <span id="progress-percent">0</span>%</div>
                    </div>
                </div>
                
                <div class="mt-6 grid grid-cols-2 gap-6">
                    <div class="content-area bg-gray-800 p-4 rounded-lg">
                        ${this.renderModuleSections(moduleData.sections)}
                    </div>
                    <div class="interaction-area">
                        ${this.renderInteractiveElements(moduleData.exercises)}
                    </div>
                </div>

                <div id="ai-guidance" class="mt-6 bg-blue-900/30 p-4 rounded-lg border border-blue-500/20">
                    <h3 class="text-xl font-semibold text-blue-400">AI Coach</h3>
                    <div id="guidance-content" class="mt-2 text-gray-300"></div>
                </div>
            </div>
        `;
    }

    getProgressChartConfig() {
        return {
            type: 'radar',
            data: {
                labels: ['Technical', 'Physical', 'Practical', 'Theory', 'Safety'],
                datasets: [{
                    label: 'Current Progress',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    borderColor: 'rgb(59, 130, 246)',
                    pointBackgroundColor: 'rgb(59, 130, 246)'
                }]
            },
            options: {
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            stepSize: 20
                        }
                    }
                }
            }
        };
    }
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', () => {
    window.trainingInterface = new TrainingInterface();
});

