// public/js/visualizations/ProgressTracker.js
class TrackerAnalytics {
    constructor() {
        this.userInteractions = new Map();
        this.featureUsage = new Map();
        this.satisfactionScore = new Map();
    }

    trackInteraction(userId, interactionType) {
        if (!this.userInteractions.has(userId)) {
            this.userInteractions.set(userId, []);
        }
        this.userInteractions.get(userId).push({
            type: interactionType,
            timestamp: new Date()
        });
    }

    trackFeatureUsage(featureId) {
        const count = this.featureUsage.get(featureId) || 0;
        this.featureUsage.set(featureId, count + 1);
    }

    getUserSatisfaction(userId) {
        return this.satisfactionScore.get(userId) || 0;
    }
}
class STELLACoordinator {
    constructor() {
        this.tracker = new ProgressTracker();
        this.analytics = new TrackerAnalytics();
    }

    async processTrainingEvent(userId, event) {
        // STELLA analyzes the event
        const analysis = await this.getSTELLAAnalysis(event);
        
        // Update tracker visualization
        this.tracker.updateProgress(analysis.progress);
        
        // Generate personalized guidance
        const guidance = await this.generateGuidance(userId, analysis);
        
        // Update UI with recommendations
        this.tracker.updateRecommendations(guidance.recommendations);
        
        // Track user interaction
        this.analytics.trackInteraction(userId, 'training_event');
    }

    async getSTELLAAnalysis(event) {
        // Connect with your AISpaceCoach service
        const analysis = await aiCoachInstance.analyzeTrainingEvent(event);
        return analysis;
    }

    async generateGuidance(userId, analysis) {
        // Get personalized recommendations from STELLA
        const guidance = await aiCoachInstance.generateGuidance(userId, analysis);
        return guidance;
    }
}
class ProgressTracker {
    constructor() {
        this.container = null;
        this.charts = {};
        this.stellaState = {
            active: false,
            analyzing: false,
            lastUpdate: null,
            insights: [],
            recommendations: [],
            conversationHistory: [],
            activeModules: new Set(),
            performanceMetrics: new Map()
        };
        this.initialize();
    }

    async initialize() {
        this.container = await this.createContainer();
        this.initializeWebSocket();
        this.initializeSTELLA();
        this.initializeCharts();
        this.setupEventListeners();
    }

    async createContainer() {
        const container = document.createElement('div');
        container.className = 'fixed bottom-4 right-4 w-96 bg-black/80 rounded-xl p-4 transition-all duration-300';
        container.innerHTML = `
            <!-- STELLA Command Center -->
            <div class="stella-command-center mb-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                        <div id="stella-avatar" class="relative">
                            <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <span class="text-xl">🤖</span>
                            </div>
                            <div id="stella-status" class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                        </div>
                        <div>
                            <h3 class="text-blue-400 font-bold">STELLA AI</h3>
                            <p id="stella-mode" class="text-xs text-gray-400">Active Analysis</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button id="toggle-view" class="p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"/>
                            </svg>
                        </button>
                        <button id="stella-settings" class="p-2 rounded-lg bg-gray-700/30 hover:bg-gray-700/50">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- AI Interaction Interface -->
                <div class="mt-4">
                    <div class="relative">
                        <input type="text" 
                               id="stella-command" 
                               class="w-full bg-gray-700/30 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-400"
                               placeholder="Ask STELLA about your training...">
                        <span class="absolute left-3 top-2.5 text-gray-400">⌘</span>
                    </div>
                    <!-- Quick Commands -->
                    <div class="quick-commands flex gap-2 mt-2 overflow-x-auto pb-2">
                        <button class="quick-cmd px-3 py-1 rounded-full bg-blue-500/20 text-xs text-blue-400 whitespace-nowrap">
                            Progress Analysis
                        </button>
                        <button class="quick-cmd px-3 py-1 rounded-full bg-blue-500/20 text-xs text-blue-400 whitespace-nowrap">
                            Next Steps
                        </button>
                        <button class="quick-cmd px-3 py-1 rounded-full bg-blue-500/20 text-xs text-blue-400 whitespace-nowrap">
                            Performance Tips
                        </button>
                    </div>
                </div>
            </div>

            <!-- Dynamic Content Area -->
            <div id="content-area" class="space-y-4">
                <!-- Progress Overview -->
                <div class="progress-section bg-gray-800/30 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-2">
                        <h4 class="text-blue-400">Overall Progress</h4>
                        <span id="progress-percentage" class="text-xl font-bold text-white">0%</span>
                    </div>
                    <div class="relative h-2 bg-gray-700 rounded-full">
                        <div id="progress-bar" class="absolute h-full bg-blue-500 rounded-full transition-all duration-500"></div>
                        <div class="absolute top-0 left-0 w-full h-full flex justify-between px-0.5">
                            <div class="w-0.5 h-3 -mt-0.5 bg-gray-600"></div>
                            <div class="w-0.5 h-3 -mt-0.5 bg-gray-600"></div>
                            <div class="w-0.5 h-3 -mt-0.5 bg-gray-600"></div>
                            <div class="w-0.5 h-3 -mt-0.5 bg-gray-600"></div>
                        </div>
                    </div>
                </div>

                <!-- STELLA's Analysis -->
                <div class="analysis-section bg-gray-800/30 rounded-lg p-4">
                    <h4 class="text-blue-400 mb-3">AI Analysis</h4>
                    <div id="analysis-content" class="space-y-3">
                        <!-- Performance Metrics -->
                        <div class="grid grid-cols-3 gap-2">
                            <div class="metric-card bg-gray-700/30 rounded-lg p-2 text-center">
                                <span class="text-xs text-gray-400">Efficiency</span>
                                <div class="text-lg font-bold text-green-400">94%</div>
                            </div>
                            <div class="metric-card bg-gray-700/30 rounded-lg p-2 text-center">
                                <span class="text-xs text-gray-400">Focus</span>
                                <div class="text-lg font-bold text-yellow-400">87%</div>
                            </div>
                            <div class="metric-card bg-gray-700/30 rounded-lg p-2 text-center">
                                <span class="text-xs text-gray-400">Mastery</span>
                                <div class="text-lg font-bold text-blue-400">82%</div>
                            </div>
                        </div>

                        <!-- Skills Radar Chart -->
                        <div class="skills-radar h-48" id="skills-chart"></div>
                    </div>
                </div>

                <!-- Real-time Recommendations -->
                <div class="recommendations-section bg-gray-800/30 rounded-lg p-4">
                    <div class="flex justify-between items-center mb-3">
                        <h4 class="text-blue-400">STELLA's Recommendations</h4>
                        <span class="text-xs text-gray-400">Updated just now</span>
                    </div>
                    <div id="recommendations-list" class="space-y-2">
                        <!-- Dynamic recommendations here -->
                    </div>
                </div>

                <!-- Interactive Timeline -->
                <div class="timeline-section bg-gray-800/30 rounded-lg p-4">
                    <h4 class="text-blue-400 mb-3">Training Timeline</h4>
                    <div class="relative">
                        <div class="h-1 bg-gray-700 rounded-full">
                            <div id="timeline-progress" class="h-full bg-green-500 rounded-full" style="width: 45%"></div>
                        </div>
                        <div class="flex justify-between mt-2 text-xs text-gray-400">
                            <span>Start</span>
                            <span>Current</span>
                            <span>Launch Ready</span>
                        </div>
                    </div>
                    <div class="mt-2 text-center">
                        <span class="text-sm text-gray-400">Estimated completion in </span>
                        <span id="completion-estimate" class="text-blue-400 font-bold">18 months</span>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(container);
        return container;
    }

    setupEventListeners() {
        // Command input handling
        const commandInput = this.container.querySelector('#stella-command');
        commandInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleCommand(e.target.value);
                e.target.value = '';
            }
        });

        // Quick commands
        const quickCmds = this.container.querySelectorAll('.quick-cmd');
        quickCmds.forEach(cmd => {
            cmd.addEventListener('click', () => this.handleQuickCommand(cmd.textContent.trim()));
        });

        // View toggle
        const toggleBtn = this.container.querySelector('#toggle-view');
        toggleBtn.addEventListener('click', () => this.toggleView());

        // Settings
        const settingsBtn = this.container.querySelector('#stella-settings');
        settingsBtn.addEventListener('click', () => this.showSettings());
    }

    async handleCommand(command) {
        const response = await this.getSTELLAResponse(command);
        this.displaySTELLAResponse(response);
    }

    async getSTELLAResponse(command) {
        return new Promise((resolve, reject) => {
            this.ws.send(JSON.stringify({
                type: 'STELLA_COMMAND',
                command,
                context: {
                    currentProgress: this.getCurrentProgress(),
                    recentActivity: this.getRecentActivity(),
                    performanceMetrics: Array.from(this.stellaState.performanceMetrics.entries())
                }
            }));

            const messageHandler = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'STELLA_RESPONSE') {
                    this.ws.removeEventListener('message', messageHandler);
                    resolve(data.response);
                }
            };

            this.ws.addEventListener('message', messageHandler);
            setTimeout(() => reject(new Error('Response timeout')), 10000);
        });
    }

    displaySTELLAResponse(response) {
        // Create response element
        const responseEl = document.createElement('div');
        responseEl.className = 'bg-gray-700/30 rounded-lg p-4 mt-2';
        responseEl.innerHTML = `
            <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    🤖
                </div>
                <div class="flex-1">
                    <div class="text-blue-400">${response.message}</div>
                    ${response.recommendations ? `
                        <div class="mt-2 space-y-2">
                            ${response.recommendations.map(rec => `
                                <div class="recommendation bg-gray-800/30 rounded p-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-white">${rec.title}</span>
                                        <span class="text-blue-400">+${rec.points} pts</span>
                                    </div>
                                    <p class="text-gray-400 text-xs mt-1">${rec.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Add to conversation history
        const contentArea = this.container.querySelector('#content-area');
        contentArea.prepend(responseEl);

        // Cleanup old responses
        const responses = contentArea.querySelectorAll('.response');
        if (responses.length > 3) {
            responses[responses.length - 1].remove();
        }
    }

    updateProgress(data) {
        const progressBar = this.container.querySelector('#progress-bar');
        const percentageEl = this.container.querySelector('#progress-percentage');
        
        progressBar.style.width = `${data.overall}%`;
        percentageEl.textContent = `${Math.round(data.overall)}%`;

        // Update performance metrics
        this.updatePerformanceMetrics(data.metrics);
        
        // Update recommendations based on new progress
        this.updateRecommendations(data.recommendations);

        // Update timeline
        this.updateTimeline(data.timeline);

        // Trigger STELLA analysis
        this.triggerSTELLAAnalysis(data);
    }

    updatePerformanceMetrics(metrics) {
        Object.entries(metrics).forEach(([metric, value]) => {
            const metricEl = this.container.querySelector(`#metric-${metric}`);
            if (metricEl) {
                this.animateNumber(metricEl, value);
                this.updateMetricTrend(metric, value);
            }
        });
    }

    updateRecommendations(recommendations) {
        const recList = this.container.querySelector('#recommendations-list');
        recList.innerHTML = recommendations.map(rec => `
            <div class="recommendation bg-gray-700/30 rounded-lg p-3 cursor-pointer hover:bg-gray-700/50"
                 onclick="tracker.handleRecommendation('${rec.id}')">
                <div class="flex justify-between items-start">
                    <div>
                        <div class="text-sm text-blue-400">${rec.title}</div>
                        <div class="text-xs text-gray-400">${rec.description}</div>
                    </div>
                    <div class="flex flex-col items-end">
                        <span class="text-xs text-green-400">+${rec.points} pts</span>
                        <span class="text-xs text-gray-400">${rec.duration}</span>
                    </div>
                </div>
                ${rec.requirements ? `
                    <div class="mt-2 text-xs">
                        <span class="text-gray-400">Requires: </span>
                        <span class="text-yellow-400">${rec.requirements.join(', ')}</span>
                    </div>
                ` : ''}
                <button class="mt-2 w-full text-center text-xs bg-blue-500/20 hover:bg-blue-500/30 py-1 rounded">
                    Start Now
                </button>
            </div>
        `).join('');
    }

    async triggerSTELLAAnalysis(data) {
        if (!this.stellaState.analyzing) {
            this.stellaState.analyzing = true;
            const analysis = await this.getSTELLAAnalysis(data);
            this.updateSTELLAInsights(analysis);
            this.stellaState.analyzing = false;
        }
    }// Add this to ProgressTracker class
async testTrackerFunctionality() {
    try {
        // Test WebSocket connection
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.error("WebSocket connection failed");
            return false;
        }

        // Test STELLA integration
        const stellaResponse = await this.getSTELLAResponse("test");
        if (!stellaResponse) {
            console.error("STELLA response failed");
            return false;
        }

        // Test UI updates
        this.updateProgress({
            overall: 25,
            metrics: {
                accuracy: 90,
                focus: 85,
                efficiency: 88
            },
            skills: {
                physical: 75,
                technical: 80,
                psychological: 85
            }
        });

        console.log("✅ Tracker functionality tests passed");
        return true;
    } catch (error) {
        console.error("❌ Tracker test failed:", error);
        return false;
    }
}

    async getSTELLAAnalysis(data) {
        return new Promise((resolve) => {
            this.ws.send(JSON.stringify({
                type: 'REQUEST_ANALYSIS',
                data: {
                    progress: data,
                    performanceHistory: Array.from(this.stellaState.performanceMetrics.entries()),
                    activeModules: Array.from(this.stellaState.activeModules)
                }
            }));

            const handleAnalysis = (event) => {
                const response = JSON.parse(event.data);
                if (response.type === 'ANALYSIS_COMPLETE') {
                    this.ws.removeEventListener('message', handleAnalysis);
                    resolve(response.analysis);
                }
            };

            this.ws.addEventListener('message', handleAnalysis);
        });
    }

    updateSTELLAInsights(analysis) {
        const insightsContainer = this.container.querySelector('#analysis-content');
        
        // Update performance metrics
        Object.entries(analysis.metrics).forEach(([metric, value]) => {
            const metricEl = insightsContainer.querySelector(`#metric-${metric} .value`);
            if (metricEl) {
                this.animateNumber(metricEl, value);
            }
        });

        // Update skills radar chart
        if (analysis.skills) {
            this.updateSkillsChart(analysis.skills);
        }

        // Update AI insights
        const insights = analysis.insights.map(insight => `
            <div class="insight bg-gray-700/30 rounded-lg p-3 mb-2">
                <div class="flex items-center gap-2">
                    <div class="text-${insight.type}-400">${insight.icon}</div>
                    <div class="flex-1">
                        <div class="text-sm font-medium">${insight.title}</div>
                        <div class="text-xs text-gray-400">${insight.description}</div>
                    </div>
                </div>
                ${insight.action ? `
                    <button class="mt-2 w-full text-xs bg-${insight.type}-500/20 hover:bg-${insight.type}-500/30 py-1 rounded"
                            onclick="tracker.handleInsightAction('${insight.id}')">
                        ${insight.action}
                    </button>
                ` : ''}
            </div>
        `).join('');

        // Add insights to the container
        const insightsSection = insightsContainer.querySelector('.insights-section');
        if (insightsSection) {
            insightsSection.innerHTML = insights;
        }
    }

    updateSkillsChart(skills) {
        if (!this.charts.skillsRadar) {
            // Initialize radar chart
            const ctx = document.getElementById('skills-chart').getContext('2d');
            this.charts.skillsRadar = new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(skills),
                    datasets: [{
                        label: 'Current Skills',
                        data: Object.values(skills),
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: 'rgba(59, 130, 246, 0.8)',
                        pointBackgroundColor: 'rgba(59, 130, 246, 1)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgba(59, 130, 246, 1)'
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
            });
        } else {
            // Update existing chart
            this.charts.skillsRadar.data.datasets[0].data = Object.values(skills);
            this.charts.skillsRadar.update();
        }
    }

    handleInsightAction(insightId) {
        this.ws.send(JSON.stringify({
            type: 'INSIGHT_ACTION',
            insightId,
            userId: this.userId
        }));
    }

    handleRecommendation(recId) {
        this.ws.send(JSON.stringify({
            type: 'START_RECOMMENDATION',
            recommendationId: recId,
            userId: this.userId
        }));
    }

    toggleView() {
        this.container.classList.toggle('w-96');
        this.container.classList.toggle('w-full');
        this.container.classList.toggle('max-w-4xl');

        if (this.container.classList.contains('w-full')) {
            this.expandView();
        } else {
            this.collapseView();
        }
    }

    expandView() {
        // Show additional detailed analytics
        const contentArea = this.container.querySelector('#content-area');
        contentArea.classList.add('grid', 'grid-cols-2', 'gap-4');
        
        // Initialize detailed charts if needed
        this.initializeDetailedCharts();
    }

    collapseView() {
        const contentArea = this.container.querySelector('#content-area');
        contentArea.classList.remove('grid', 'grid-cols-2', 'gap-4');
    }

    animateNumber(element, target, duration = 1000) {
        const start = parseInt(element.textContent);
        const diff = target - start;
        const steps = 60;
        const stepValue = diff / steps;
        let current = start;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            current += stepValue;
            element.textContent = Math.round(current);

            if (step >= steps) {
                clearInterval(timer);
                element.textContent = target;
            }
        }, duration / steps);
    }

    showSettings() {
        // Implement settings modal
        console.log('Settings modal not yet implemented');
    }
}

// Initialize tracker
const tracker = new ProgressTracker();