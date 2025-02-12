// modules/moduleLoader.js
const physicalModule = require('./core/physical');
const technicalModule = require('./core/technical');
const simulationModule = require('./core/simulation');

// Define base structure here instead of importing
const BaseModuleStructure = {
    id: 'string',
    name: 'string',
    description: 'string',
    type: 'string',
    difficulty: 'number',
    duration: 'number'
};

class ModuleLoader {
    constructor() {
        this.modules = {
            physical: physicalModule,
            technical: technicalModule,
            simulation: simulationModule
        };

        this.moduleById = {
            'core-phys-001': physicalModule,
            'core-tech-001': technicalModule,
            'core-sim-001': simulationModule
        };

        this.moduleCache = new Map();
        this.progressTracker = new Map();
    }

    validateModuleStructure(module) {
        if (!module || typeof module !== 'object') {
            console.error('❌ Invalid module structure: Module must be an object');
            return false;
        }

        // Check for router property if it's an Express router module
        if (module.router) {
            return true;
        }

        const requiredFields = Object.keys(BaseModuleStructure);
        const missingFields = requiredFields.filter(field => {
            // Check if the field exists and matches expected type
            const expectedType = BaseModuleStructure[field];
            const actualValue = module[field];
            const actualType = typeof actualValue;
            
            return !actualValue || actualType !== expectedType;
        });

        if (missingFields.length > 0) {
            console.warn(`⚠️ Module structure warning: Missing or invalid fields: ${missingFields.join(', ')}`);
            return false;
        }

        return true;
    }

    async initializeModules() {
        try {
            console.log('🚀 Initializing Modules...');
            
            // Filter out null or undefined modules first
            const validModules = Object.entries(this.modules)
                .filter(([key, module]) => {
                    if (!module) {
                        console.warn(`⚠️ Warning: Module '${key}' is undefined or null`);
                        return false;
                    }
                    return true;
                });

            // Initialize valid modules
            validModules.forEach(([key, module]) => {
                if (this.validateModuleStructure(module)) {
                    this.moduleCache.set(key, module);
                    console.log(`✅ Module '${key}' initialized successfully`);
                } else {
                    console.warn(`⚠️ Warning: Module '${key}' has invalid structure but will be loaded`);
                    this.moduleCache.set(key, module);
                }
            });

            console.log('✅ Module initialization completed');
            
        } catch (error) {
            console.error('❌ Error Initializing Modules:', error);
            // Don't throw error, just log it
            console.warn('⚠️ Continuing with partial module initialization');
        }
    }


    async loadModule(moduleId) {
        try {
            if (this.moduleCache.has(moduleId)) {
                return this.moduleCache.get(moduleId);
            }

            const module = this.moduleById[moduleId];
            if (!module) throw new Error(`Module ${moduleId} not found`);

            this.moduleCache.set(moduleId, module);
            return module;
        } catch (error) {
            console.error(`❌ Error loading module ${moduleId}:`, error);
            throw error;
        }
    }

    async validateModulePrerequisites(moduleId, userId) {
        try {
            const module = await this.loadModule(moduleId);
            if (!module.prerequisites || module.prerequisites.length === 0) return true;

            const userProgress = await this.getUserProgress(userId);
            return module.prerequisites.every(prereq => userProgress.completedModules.includes(prereq));
        } catch (error) {
            console.error('❌ Error validating prerequisites:', error);
            throw error;
        }
    }

    async getAvailableModules(userId) {
        try {
            return Promise.all(Object.values(this.modules).map(async module => ({
                id: module.id,
                name: module.name,
                description: module.description,
                difficulty: module.difficulty,
                duration: module.duration,
                isAvailable: await this.validateModulePrerequisites(module.id, userId),
                progress: this.calculateModuleProgress(userId, module.id),
                trainingFormats: module.trainingFormats,
                creditSystem: module.creditSystem,
                certification: module.certification
            })));
        } catch (error) {
            console.error('❌ Error getting available modules:', error);
            throw error;
        }
    }

    async getUserProgress(userId) {
        return {
            completedModules: [],
            inProgress: [],
            achievements: [],
            totalCredits: 0
        };
    }

    calculateModuleProgress(userId, moduleId) {
        return this.progressTracker.get(`${userId}-${moduleId}`) || 0;
    }

    async updateModuleProgress(userId, moduleId, progress) {
        try {
            this.progressTracker.set(`${userId}-${moduleId}`, progress);
            console.log(`✅ Updated progress for ${moduleId}: ${progress}%`);
            return { moduleId, progress, isCompleted: progress === 100 };
        } catch (error) {
            console.error('❌ Error updating module progress:', error);
            throw error;
        }
    }

    async getModuleDetails(moduleId) {
        try {
            const module = await this.loadModule(moduleId);
            return {
                ...module,
                tasks: module.tasks || [],
                assessments: module.assessments || [],
                requirements: module.requirements || [],
                certification: module.certification || null
            };
        } catch (error) {
            console.error(`❌ Error fetching module details for ${moduleId}:`, error);
            throw error;
        }
    }

    clearCache() {
        this.moduleCache.clear();
        console.log('🗑️ Module cache cleared');
    }
}

// Create a single instance
const moduleLoader = new ModuleLoader();

// Don't automatically initialize - let the app do it
module.exports = {
    ModuleLoader,
    moduleLoader
};
