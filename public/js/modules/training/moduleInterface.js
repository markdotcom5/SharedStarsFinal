// public/js/modules/training/moduleInterface.js

class ModuleInterface {
    constructor(moduleId) {
        this.moduleId = moduleId;
        this.currentLevel = 0;
        this.moduleData = trainingModules[moduleId];
        this.aiHandler = new AIHandler();
        this.spaceTraining = new SpaceTrainingFSD();
        this.biometricData = {
            heartRate: [],
            oxygenLevel: [],
            stressLevel: [],
            vestibularStability: []
        };
        this.certificationProgress = new Map();
    }

    async initialize() {
        this.container = document.querySelector('#training-container');
        if (!this.container) throw new Error('Training container not found');

        await this.aiHandler.initialize(userId, 'full_guidance');
        await this.startBiometricMonitoring();
        this.setupEventListeners();
        this.render();
    }

    async startBiometricMonitoring() {
        try {
            // Start real-time biometric monitoring
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            this.heartRateMonitor = new HeartRateMonitor(stream);
            this.vestibularMonitor = new VestibularMonitor();
            
            // Update interval for biometrics
            setInterval(() => this.updateBiometrics(), 1000);
        } catch (error) {
            console.error('Biometric monitoring error:', error);
        }
    }

    async updateBiometrics() {
        const currentBiometrics = {
            heartRate: await this.heartRateMonitor.getCurrentRate(),
            vestibularStability: this.vestibularMonitor.getStability(),
            oxygenLevel: await this.getOxygenLevel(),
            stressLevel: this.calculateStressLevel()
        };

        // Update history
        Object.keys(currentBiometrics).forEach(metric => {
            this.biometricData[metric].push({
                value: currentBiometrics[metric],
                timestamp: Date.now()
            });
        });

        // Check thresholds and notify AI
        this.checkBiometricThresholds(currentBiometrics);
        
        // Update UI
        this.updateBiometricDisplay(currentBiometrics);
    }

    checkBiometricThresholds(metrics) {
        const thresholds = this.moduleData.biometricTargets;
        const violations = [];

        Object.entries(metrics).forEach(([metric, value]) => {
            const threshold = thresholds[metric];
            if (threshold) {
                if (value < threshold.min || value > threshold.max) {
                    violations.push({ metric, value, threshold });
                }
            }
        });

        if (violations.length > 0) {
            this.handleBiometricViolations(violations);
        }
    }

    async handleBiometricViolations(violations) {
        // Notify AI Handler
        await this.aiHandler.handleBiometricWarning(violations);
        
        // Adjust difficulty if needed
        const adjustment = this.spaceTraining.adjustDifficulty({
            biometricViolations: violations,
            currentPerformance: this.getCurrentPerformance()
        });

        // Update module parameters
        this.applyDifficultyAdjustment(adjustment);
    }

    render() {
        const module = this.moduleData;
        this.container.innerHTML = `
            <div class="p-8 bg-gray-900 min-h-screen">
                <div class="max-w-6xl mx-auto">
                    <!-- Module Header -->
                    <div class="mb-8">
                        <h1 class="text-4xl font-bold text-blue-400">${module.title}</h1>
                        <p class="text-gray-300 mt-2">${module.description}</p>
                        <div class="mt-4 bg-blue-900/30 p-4 rounded-lg">
                            <h3 class="text-blue-400 font-bold">Certification Progress</h3>
                            <div class="grid grid-cols-2 gap-4 mt-2">
                                ${this.renderCertificationRequirements()}
                            </div>
                        </div>
                    </div>

                    <!-- Biometric Monitoring -->
                    <div class="bg-gray-800 p-4 rounded-lg mb-8">
                        <h3 class="text-green-400 font-bold mb-4">Real-time Biometrics</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4" id="biometric-displays">
                            ${this.renderBiometricDisplays()}
                        </div>
                    </div>

                    <!-- AI Guidance -->
                    <div class="bg-blue-900/30 p-4 rounded-lg mb-8" id="ai-guidance">
                        <h3 class="text-blue-400 font-bold mb-2">AI Coach</h3>
                        <div id="ai-messages" class="space-y-2">
                            <!-- AI messages will be inserted here -->
                        </div>
                    </div>

                    <!-- Levels Grid -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${module.levels.map((level, index) => this.renderLevel(level, index)).join('')}
                    </div>
                </div>
            </div>
        `;
    }

    renderLevel(level, index) {
        const isLocked = !this.checkLevelPrerequisites(level);
        const statusClass = isLocked ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-500';
        
        return `
            <div class="bg-gray-800 rounded-lg p-6 border border-gray-700 ${statusClass}">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-2xl font-bold text-white">${level.name}</h3>
                    ${isLocked ? '<span class="text-red-400">🔒</span>' : ''}
                </div>
                <div class="space-y-4">
                    ${this.renderLevelContent(level)}
                </div>
                <button 
                    class="mt-4 w-full ${isLocked ? 'bg-gray-600' : 'bg-blue-600 hover:bg-blue-700'} 
                           text-white py-2 px-4 rounded transition-colors"
                    data-level="${index}"
                    ${isLocked ? 'disabled' : ''}
                >
                    ${isLocked ? 'Complete Prerequisites' : 'Start Level'}
                </button>
            </div>
        `;
    }

    setupEventListeners() {
        // AI Handler events
        this.aiHandler.on('guidance', (guidance) => {
            this.updateAIGuidance(guidance);
        });

        this.aiHandler.on('achievement', (achievement) => {
            this.showAchievement(achievement);
        });

        // Biometric events
        document.addEventListener('biometricWarning', (e) => {
            this.handleBiometricWarning(e.detail);
        });
    }
}

export default ModuleInterface;