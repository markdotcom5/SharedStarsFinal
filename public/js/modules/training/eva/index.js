import EVAHandler from './EVAHandler';
import EVAInterface from './EVAInterface';
import EVAProgressTracker from './EVAProgressTracker';
import EVASafetyMonitor from './EVASafetyMonitor';

class EVAModule {
    constructor() {
        this.handler = EVAHandler;
        this.interface = EVAInterface;
        this.progressTracker = new EVAProgressTracker();
        this.safetyMonitor = new EVASafetyMonitor();
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            console.log('🚀 Initializing EVA Module');

            // Initialize interface first
            await this.interface.initialize();

            // Initialize core components
            await Promise.all([
                this.handler.initializeModule(),
                this.progressTracker.initialize([]),
                this.safetyMonitor.initialize([]),
            ]);

            // Set up event listeners
            this.setupEventListeners();

            this.initialized = true;
            console.log('✅ EVA Module Initialized');
        } catch (error) {
            console.error('❌ EVA Module Initialization Error:', error);
            this.handleInitializationError(error);
        }
    }

    setupEventListeners() {
        // Handle interface events
        document.addEventListener('eva:procedureStart', (e) =>
            this.handler.startProcedure(e.detail.procedureId)
        );

        document.addEventListener('eva:safetyCheck', (e) =>
            this.safetyMonitor.submitSafetyCheck(e.detail.formData)
        );

        document.addEventListener('eva:equipmentSelected', (e) =>
            this.handler.validateEquipment(e.detail.equipment)
        );

        document.addEventListener('eva:emergencyStop', () => this.handleEmergencyStop());

        // Handle safety alerts
        this.safetyMonitor.on('alert', (alert) =>
            this.interface.showError(alert.message, alert.severity)
        );

        // Handle progress updates
        this.progressTracker.on('progress', (progress) => this.interface.updateStatus(progress));
    }

    async handleEmergencyStop() {
        try {
            await this.safetyMonitor.triggerEmergencyProtocol('Manual Emergency Stop');
            this.interface.switchView('safety');
        } catch (error) {
            console.error('❌ Emergency Stop Error:', error);
            this.interface.showError('Emergency stop system failure', 'critical');
        }
    }

    handleInitializationError(error) {
        console.error('Initialization Error:', error);
        this.interface.showError(
            'Module initialization failed. Please refresh the page.',
            'critical'
        );
    }

    // Export module APIs for external use
    static async createSession(config) {
        const module = new EVAModule();
        await module.initialize();
        return module;
    }

    static getModuleInfo() {
        return {
            id: 'eva-training',
            name: 'EVA Operations Training',
            version: '1.0.0',
            dependencies: ['core-training', 'ai-guidance'],
        };
    }
}

// Register module with the training system
window.TrainingModules = window.TrainingModules || {};
window.TrainingModules.EVA = EVAModule;

export default EVAModule;
