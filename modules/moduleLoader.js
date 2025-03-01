const physicalModule = require('./core/physical');
const technicalModule = require('./core/technical');
const simulationModule = require('./core/simulation');
const evaModule = require('./core/eva'); // ✅ Automatically loads `index.js` if present
const TrainingLearningSystem = require('./TrainingLearningSystem');
const { EventEmitter } = require('events');

// In-memory mock for EVA module
let evaModuleExists = false;

const checkAndInsertEVA = async () => {
    if (!evaModuleExists) {
        console.log("🛰️ EVA module not found, creating in memory...");
        evaModuleExists = true;
    } else {
        console.log("ℹ️ EVA module already exists in memory");
    }
};

class ModuleLoader extends EventEmitter {
    constructor() {
        super();
        this.modules = {
            physical: physicalModule,
            technical: technicalModule,
            simulation: simulationModule,
            eva: evaModule
        };

        this.moduleById = {
            'core-phys-001': physicalModule,
            'core-tech-001': technicalModule,
            'core-sim-001': simulationModule,
            'core-eva-001': evaModule
        };

        this.stella = new TrainingLearningSystem.STELLAIntegration || {};
        this.moduleCache = new Map();
        this.progressTracker = TrainingLearningSystem.ProgressTracker || {}; 
        this.aiLearningSystem = TrainingLearningSystem.AILearning || {};
        
        // In-memory module storage
        this.inMemoryModules = [
            { id: 'core-phys-001', name: 'Physical Training', type: 'physical' },
            { id: 'core-tech-001', name: 'Technical Training', type: 'technical' },
            { id: 'core-sim-001', name: 'Simulation', type: 'simulation' },
            { id: 'core-eva-001', name: 'EVA', type: 'simulation' }
        ];
    }

    async initializeModules() {
        try {
            console.log('🚀 Initializing AI Systems & Modules...');
            if (typeof this.stella.initialize === 'function') {
                await this.stella.initialize();
                console.log('✅ STELLA AI Coach Initialized');
            } else {
                console.log('⚠️ STELLA integration not available or initialized');
            }

            if (typeof this.aiLearningSystem.initialize === 'function') {
                await this.aiLearningSystem.initialize();
                console.log('✅ AI Learning System Initialized');
            } else {
                console.log('⚠️ AI Learning System not available or initialized');
            }

            // Check and insert EVA module (now using in-memory approach)
            await checkAndInsertEVA();

            for (const [key, module] of Object.entries(this.modules)) {
                if (!module) {
                    console.warn(`⚠️ Warning: Module '${key}' is undefined or null`);
                    continue;
                }

                this.moduleCache.set(key, module);
                console.log(`✅ Module '${key}' Initialized Successfully`);
            }

            console.log('✅ All Modules Successfully Loaded');
        } catch (error) {
            console.error('❌ Error Initializing Modules:', error);
        }
    }

    async loadModule(moduleId) {
        try {
            if (this.moduleCache.has(moduleId)) {
                return this.moduleCache.get(moduleId);
            }

            const module = this.moduleById[moduleId];
            if (!module) throw new Error(`Module ${moduleId} Not Found`);

            this.moduleCache.set(moduleId, module);
            return module;
        } catch (error) {
            console.error(`❌ Error Loading Module ${moduleId}:`, error);
            throw error;
        }
    }

    async getAvailableModules() {
        try {
            return Object.keys(this.modules);
        } catch (error) {
            console.error('❌ Error Retrieving Available Modules:', error);
            throw error;
        }
    }

    async calculateModuleProgress(userId, moduleId) {
        try {
            if (typeof this.progressTracker.getModuleProgress === 'function') {
                return await this.progressTracker.getModuleProgress(userId, moduleId);
            } else {
                console.warn('⚠️ Progress tracker not properly initialized');
                return { percentage: 0, performance: null };
            }
        } catch (error) {
            console.error('❌ Error calculating module progress:', error);
            return { percentage: 0, performance: null };
        }
    }

    async updateModuleProgress(userId, moduleId, progress) {
        try {
            if (typeof this.progressTracker.updateProgress === 'function') {
                await this.progressTracker.updateProgress(userId, moduleId, progress);
            } else {
                console.warn('⚠️ Progress tracker not properly initialized');
            }
            
            const module = await this.loadModule(moduleId);
            if (module && module.aiEnabled && typeof this.aiLearningSystem.updateLearningModel === 'function') {
                await this.aiLearningSystem.updateLearningModel(userId, moduleId, progress);
            }
    
            console.log(`✅ Updated progress for ${moduleId} (User: ${userId}): ${progress.percentage}%`);
            
            return {
                moduleId,
                progress: progress.percentage,
                isCompleted: progress.percentage === 100,
                performance: progress.performance
            };
        } catch (error) {
            console.error('❌ Error updating module progress:', error);
            throw error;
        }
    }

    clearCache() {
        this.moduleCache.clear();
        console.log('🗑️ Module Cache Cleared');
    }
    
    // Added methods to simulate database operations
    async getModuleById(id) {
        return this.inMemoryModules.find(m => m.id === id);
    }
    
    async getAllModules() {
        return this.inMemoryModules;
    }
    
    async addModule(module) {
        this.inMemoryModules.push(module);
        return module;
    }
}

// ✅ Properly Export an Instance of `ModuleLoader`
const moduleLoader = new ModuleLoader();
module.exports = moduleLoader;