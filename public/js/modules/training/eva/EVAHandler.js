import { TrainingHandler } from '../TrainingHandler';
import { AIHandler } from '../AIHandler';
import EVASafetyMonitor from './EVASafetyMonitor';
import EVAProgressTracker from './EVAProgressTracker';

class EVAHandler extends TrainingHandler {
    constructor() {
        super('eva');
        this.safetyMonitor = new EVASafetyMonitor();
        this.progressTracker = new EVAProgressTracker();
        this.aiHandler = new AIHandler();
        this.initializeEventListeners();
    }

    async initializeModule() {
        try {
            console.log('🚀 Initializing EVA Module');

            // Get module data from server
            const moduleData = await this.fetchModuleData();

            // Initialize safety monitoring
            await this.safetyMonitor.initialize(moduleData.safetyProtocols);

            // Set up progress tracking
            await this.progressTracker.initialize(moduleData.procedures);

            // Initialize AI guidance
            await this.aiHandler.initializeEVAGuidance();

            this.renderInterface(moduleData);

            console.log('✅ EVA Module Initialized');
        } catch (error) {
            console.error('❌ EVA Module Initialization Error:', error);
            this.handleError(error);
        }
    }

    async startSession() {
        try {
            const session = await this.api.post('/api/eva/session/start');
            this.currentSession = session;
            this.safetyMonitor.startMonitoring(session.id);
            this.progressTracker.startTracking(session.id);
            return session;
        } catch (error) {
            console.error('❌ Session Start Error:', error);
            this.handleError(error);
        }
    }

    async completeSession() {
        try {
            const finalChecks = await this.safetyMonitor.performFinalChecks();
            if (!finalChecks.passed) {
                throw new Error('Final safety checks failed');
            }

            const completion = await this.api.put(
                `/api/eva/session/${this.currentSession.id}/complete`,
                {
                    completionData: {
                        safetyScore: finalChecks.safetyScore,
                        performanceMetrics: this.progressTracker.getMetrics(),
                    },
                }
            );

            this.handleSessionCompletion(completion);
        } catch (error) {
            console.error('❌ Session Completion Error:', error);
            this.handleError(error);
        }
    }

    initializeEventListeners() {
        // Equipment selection
        document.getElementById('equipment-select')?.addEventListener('change', (e) => {
            this.safetyMonitor.validateEquipment(e.target.value);
        });

        // Safety check submissions
        document.getElementById('safety-check-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.safetyMonitor.submitSafetyCheck(new FormData(e.target));
        });

        // Progress updates
        document.getElementById('eva-progress-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.progressTracker.updateProgress(new FormData(e.target));
        });
    }

    async handleEmergency(emergency) {
        try {
            console.log('🚨 Emergency Procedure Initiated:', emergency.type);
            await this.safetyMonitor.handleEmergency(emergency);
            const guidance = await this.aiHandler.getEmergencyGuidance(emergency);
            this.updateInterface({ emergency: true, guidance });
        } catch (error) {
            console.error('❌ Emergency Handling Error:', error);
            this.handleCriticalError(error);
        }
    }

    handleError(error) {
        console.error('EVA Error:', error);
        // Update UI with error
        document.getElementById('eva-error-display')?.classList.remove('hidden');
        document.getElementById('eva-error-message').textContent = error.message;
    }

    handleCriticalError(error) {
        console.error('Critical EVA Error:', error);
        this.safetyMonitor.triggerEmergencyProtocol();
        // Show critical error UI
        document.getElementById('eva-critical-error')?.classList.remove('hidden');
    }

    updateInterface(data) {
        // Update progress indicators
        if (data.progress) {
            document.getElementById('eva-progress-bar').style.width = `${data.progress}%`;
            document.getElementById('eva-progress-text').textContent = `${data.progress}%`;
        }

        // Update safety status
        if (data.safety) {
            const statusElement = document.getElementById('safety-status');
            statusElement.className = `status-indicator ${data.safety.status}`;
            statusElement.textContent = data.safety.message;
        }

        // Update current procedure
        if (data.currentProcedure) {
            document.getElementById('current-procedure').textContent = data.currentProcedure;
        }
    }
}

export default new EVAHandler();
