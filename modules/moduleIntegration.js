const CoreTrainingSystem = require('../services/CoreTrainingSystem');
const { ModuleLoader } = require('./moduleLoader');
const STELLAIntegration = require('../services/stella-integration');
const BayesianTracker = require('../services/BayesianTracker');

class ModuleIntegration {
    constructor() {
        // Core systems
        this.coreSystem = CoreTrainingSystem;
        this.moduleLoader = new ModuleLoader();
        this.registeredModules = new Map();
        
        // AI Systems
        this.stella = new STELLAIntegration();
        this.bayesianTracker = new BayesianTracker();
        
        // New features
        this.realTimeMetrics = new Map();
        this.adaptiveContent = new Map();
        this.userPerformanceCache = new Map();
    }

    async initialize() {
        // Initialize AI systems
        await this.stella.initialize();
        await this.bayesianTracker.initialize();
        
        // Initialize modules
        await this.integrateExistingModules();
        
        // Setup real-time monitoring
        this.setupPerformanceMonitoring();
    }

    async integrateExistingModules() {
        const moduleConfigs = {
            physical: {
                path: './core/physical',
                components: ['assessments', 'tasks', 'requirements'],
                routes: physicalRoutes,  // ✅ Use the imported routes
                aiFeatures: ['formAnalysis', 'biometricTracking', 'adaptiveDifficulty']
            },
            technical: {
                path: './core/technical',
                components: ['tasks', 'systems', 'protocols'],
                routes: technicalRoutes,  // ✅ Use the imported routes
                aiFeatures: ['knowledgeAssessment', 'procedureOptimization']
            },
            simulation: {
                path: './core/simulation',
                components: ['missions', 'scenarios', 'teamRoles'],
                routes: simulationRoutes,  // ✅ Use the imported routes
                aiFeatures: ['scenarioAdaptation', 'performancePrediction']
            },
            eva: {
                path: './core/eva',
                components: ['procedures', 'equipment', 'safety'],
                routes: evaRoutes,  // ✅ Use the imported routes
                aiFeatures: ['safetyMonitoring', 'equipmentOptimization']
            }
        };
    
        for (const [moduleId, config] of Object.entries(moduleConfigs)) {
            await this.integrateModule(moduleId, config);
        }
    }

    async integrateModule(moduleId, config) {
        try {
            // STELLA preparation with enhanced features
            await this.stella.prepareModule(moduleId, {
                ...config,
                adaptiveLearning: true,
                realTimeAnalysis: true,
                performanceTracking: true
            });

            console.log(`🔄 Integrating ${moduleId} module...`);

            // Load and validate components
            const moduleComponents = await this.loadModuleComponents(moduleId, config);

            // Initialize AI features
            if (config.aiFeatures) {
                await this.initializeAIFeatures(moduleId, config.aiFeatures);
            }

            // Register with core system
            await this.coreSystem.initializeModule(moduleId, {
                ...config,
                components: moduleComponents,
                aiIntegration: true
            });

            // Setup event handlers and real-time monitoring
            this.setupModuleEventHandlers(moduleId);
            this.setupRealTimeMonitoring(moduleId);

            // Register routes with enhanced middleware
            if (config.routes) {
                this.registerModuleRoutes(moduleId, config.routes);
            }

            // Store module configuration
            this.registeredModules.set(moduleId, {
                config,
                components: moduleComponents,
                status: 'active',
                aiFeatures: config.aiFeatures || []
            });

            console.log(`✅ ${moduleId} module integrated successfully`);
        } catch (error) {
            console.error(`❌ Error integrating ${moduleId} module:`, error);
            throw error;
        }
    }

    async initializeAIFeatures(moduleId, features) {
        for (const feature of features) {
            await this.stella.initializeFeature(moduleId, feature);
            await this.bayesianTracker.setupTracking(moduleId, feature);
        }
    }

    setupRealTimeMonitoring(moduleId) {
        const monitor = setInterval(async () => {
            const module = this.registeredModules.get(moduleId);
            if (!module) return;

            try {
                const metrics = await this.stella.gatherMetrics(moduleId);
                const analysis = await this.bayesianTracker.analyzePerformance(moduleId);
                
                await this.updateModuleState(moduleId, { metrics, analysis });
            } catch (error) {
                console.error(`Error in real-time monitoring for ${moduleId}:`, error);
            }
        }, 5000); // Adjust interval as needed

        this.realTimeMetrics.set(moduleId, monitor);
    }

    async updateModuleState(moduleId, data) {
        const module = this.registeredModules.get(moduleId);
        if (!module) return;

        // Update module state
        module.currentState = {
            ...module.currentState,
            ...data,
            lastUpdate: Date.now()
        };

        // Emit updates
        this.coreSystem.emitStateUpdate(moduleId, module.currentState);
    }

    async loadModuleComponents(moduleId, config) {
        const components = {};
        
        for (const component of config.components) {
            try {
                const componentPath = `${config.path}/${component}`;
                components[component] = require(componentPath);
                console.log(`✅ Loaded ${moduleId} ${component} component`);
            } catch (error) {
                console.error(`❌ Error loading ${moduleId} ${component}:`, error);
                throw error;
            }
        }

        return components;
    }

    // Add event handlers including STELLA integration
setupModuleEventHandlers(moduleId) {
    // Progress events
    this.coreSystem.on(`${moduleId}:progress`, async (data) => {
        await this.handleModuleProgress(moduleId, data);
    });

    // Assessment events
    this.coreSystem.on(`${moduleId}:assessment`, async (data) => {
        await this.handleModuleAssessment(moduleId, data);
    });

    // AI feedback events
    this.coreSystem.on(`${moduleId}:ai-feedback`, async (data) => {
        await this.handleModuleAIFeedback(moduleId, data);
    });

    // STELLA specific event handlers
    this.setupSTELLAEventHandlers(moduleId);
}

// STELLA event handlers
setupSTELLAEventHandlers(moduleId) {
    this.coreSystem.on(`${moduleId}:stella-guidance`, async (data) => {
        await this.handleSTELLAGuidance(moduleId, data);
    });

    this.coreSystem.on(`${moduleId}:stella-intervention`, async (data) => {
        await this.handleSTELLAIntervention(moduleId, data);
    });
}

// STELLA guidance handler
async handleSTELLAGuidance(moduleId, data) {
    const module = this.registeredModules.get(moduleId);
    if (!module) return;

    try {
        const guidance = await this.stella.processGuidance(moduleId, data);
        this.coreSystem.emitUIUpdate(moduleId, {
            type: 'stella-guidance',
            data: guidance
        });
    } catch (error) {
        console.error(`Error handling STELLA guidance for ${moduleId}:`, error);
    }
}

// Module progress handler
async handleModuleProgress(moduleId, data) {
    const module = this.registeredModules.get(moduleId);
    if (!module) return;

    try {
        // Update module-specific progress
        if (module.components.tasks) {
            await module.components.tasks.updateProgress(data);
        }

        // Emit to core system
        await this.coreSystem.handleModuleProgress(moduleId, data);
    } catch (error) {
        console.error(`Error handling ${moduleId} progress:`, error);
    }
}

// Module assessment handler
async handleModuleAssessment(moduleId, data) {
    const module = this.registeredModules.get(moduleId);
    if (!module) return;

    try {
        // Handle module-specific assessment
        if (module.components.assessments) {
            await module.components.assessments.processAssessment(data);
        }

        // Update core system
        await this.coreSystem.handleModuleAssessment(moduleId, data);
    } catch (error) {
        console.error(`Error handling ${moduleId} assessment:`, error);
    }
}

// AI feedback handler
async handleModuleAIFeedback(moduleId, data) {
    try {
        await this.coreSystem.handleAIFeedback(moduleId, data);
    } catch (error) {
        console.error(`Error handling ${moduleId} AI feedback:`, error);
    }
}

// STELLA intervention handler
async handleSTELLAIntervention(moduleId, data) {
    const module = this.registeredModules.get(moduleId);
    if (!module) return;

    try {
        await this.stella.handleIntervention(moduleId, data);
        await this.coreSystem.handleSTELLAIntervention(moduleId, data);
    } catch (error) {
        console.error(`Error handling STELLA intervention for ${moduleId}:`, error);
    }
}
cleanup() {
    // Clear monitoring intervals
    for (const [moduleId, monitor] of this.realTimeMetrics) {
        clearInterval(monitor);
    }
    
    // Clear caches
    this.realTimeMetrics.clear();
    this.adaptiveContent.clear();
    this.userPerformanceCache.clear();
}
}

// Create singleton instance
const moduleIntegration = new ModuleIntegration();

// Export both class and singleton
module.exports = {
ModuleIntegration,
moduleIntegration
};