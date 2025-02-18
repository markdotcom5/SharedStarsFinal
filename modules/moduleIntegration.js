// modules/moduleIntegration.js
const CoreTrainingSystem = require('../services/CoreTrainingSystem');
const { ModuleLoader } = require('./moduleLoader');

class ModuleIntegration {
    constructor() {
        this.coreSystem = CoreTrainingSystem;
        this.moduleLoader = new ModuleLoader();
        this.registeredModules = new Map();
    }

    async integrateExistingModules() {
        // Physical Module Integration
        await this.integrateModule('physical', {
            path: './core/physical',
            components: ['assessments', 'tasks', 'requirements'],
            routes: require('../routes/physical'),
        });

        // Technical Module Integration
        await this.integrateModule('technical', {
            path: './core/technical',
            components: ['tasks', 'systems', 'protocols'],
            routes: require('../routes/technical'),
        });

        // Simulation Module Integration
        await this.integrateModule('simulation', {
            path: './core/simulation',
            components: ['missions', 'scenarios', 'teamRoles'],
            routes: require('../routes/simulation/simulation'),
        });

        // EVA Module Integration
        await this.integrateModule('eva', {
            path: './core/eva',
            components: ['procedures', 'equipment', 'safety'],
            routes: require('../routes/eva'),
        });
    }

    async integrateModule(moduleId, config) {
        try {
            console.log(`🔄 Integrating ${moduleId} module...`);

            // Load module components
            const moduleComponents = await this.loadModuleComponents(moduleId, config);

            // Register with core system
            await this.coreSystem.initializeModule(moduleId, {
                ...config,
                components: moduleComponents,
            });

            // Set up event handlers
            this.setupModuleEventHandlers(moduleId);

            // Register routes
            if (config.routes) {
                this.registerModuleRoutes(moduleId, config.routes);
            }

            this.registeredModules.set(moduleId, {
                config,
                components: moduleComponents,
                status: 'active',
            });

            console.log(`✅ ${moduleId} module integrated successfully`);
        } catch (error) {
            console.error(`❌ Error integrating ${moduleId} module:`, error);
            throw error;
        }
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
    }

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

    async handleModuleAIFeedback(moduleId, data) {
        try {
            await this.coreSystem.handleAIFeedback(moduleId, data);
        } catch (error) {
            console.error(`Error handling ${moduleId} AI feedback:`, error);
        }
    }

    registerModuleRoutes(moduleId, routes) {
        if (!routes.router) {
            console.warn(`⚠️ No router found for ${moduleId} module`);
            return;
        }

        // Register routes with your Express app
        app.use(`/api/modules/${moduleId}`, routes.router);
        console.log(`✅ Registered routes for ${moduleId} module`);
    }

    // Method to add new modules
    async addNewModule(moduleId, config) {
        if (this.registeredModules.has(moduleId)) {
            throw new Error(`Module ${moduleId} already exists`);
        }

        await this.integrateModule(moduleId, config);
    }

    // Method to get module status
    getModuleStatus(moduleId) {
        const module = this.registeredModules.get(moduleId);
        return module ? module.status : 'not_found';
    }

    // Method to update module configuration
    async updateModuleConfig(moduleId, newConfig) {
        const module = this.registeredModules.get(moduleId);
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        // Update configuration
        module.config = { ...module.config, ...newConfig };
        await this.coreSystem.updateModuleConfig(moduleId, newConfig);

        this.registeredModules.set(moduleId, module);
    }
}

module.exports = new ModuleIntegration();
