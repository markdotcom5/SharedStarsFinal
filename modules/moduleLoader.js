// modules/moduleLoader.js
const physicalModule = require('./core/physical');
const technicalModule = require('./core/technical');
const simulationModule = require('./core/simulation');
const evaModule = require('./core/eva/index');  // If `index.js` exists inside `eva`
const AILearningSystem = require('../services/AILearningSystem');
const ProgressTracking = require('../services/ProgressTracker');  // ✅ Correct path

// Enhanced base structure with more fields
const BaseModuleStructure = {
    id: 'string',
    name: 'string',
    description: 'string',
    type: 'string',
    difficulty: 'number',
    duration: 'number',
    prerequisites: 'object',
    aiEnabled: 'boolean',
    adaptiveLearning: 'boolean'
};

class ModuleLoader {
    constructor() {
        this.modules = {
            physical: physicalModule,
            technical: technicalModule,
            simulation: simulationModule,
            eva: evaModule  // Add EVA to modules
        };

        this.moduleById = {
            'core-phys-001': physicalModule,
            'core-tech-001': technicalModule,
            'core-sim-001': simulationModule,
            'core-eva-001': evaModule  // Add EVA to moduleById
        };

        this.moduleCache = new Map();
        this.progressTracker = new Map();
        this.aiLearningSystem = AILearningSystem;
        this.progressionTracker = ProgressTracking;
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
            const expectedType = BaseModuleStructure[field];
            const actualValue = module[field];
            const actualType = typeof actualValue;
            
            return !actualValue || actualType !== expectedType;
        });

        if (missingFields.length > 0) {
            console.warn(`⚠️ Module structure warning: Missing or invalid fields: ${missingFields.join(', ')}`);
            return false;
        }

        // Additional validation for AI-enabled modules
        if (module.aiEnabled) {
            const aiRequirements = ['adaptiveLearning', 'performanceMetrics', 'feedbackSystem'];
            const missingAI = aiRequirements.filter(req => !module[req]);
            if (missingAI.length > 0) {
                console.warn(`⚠️ AI-enabled module missing requirements: ${missingAI.join(', ')}`);
            }
        }

        return true;
    }

    async initializeModules() {
        try {
            console.log('🚀 Initializing Modules...');
            
            // Initialize AI Learning System first
            if (this.aiLearningSystem) {
                await this.aiLearningSystem.initialize();
                console.log('✅ AI Learning System initialized');
            }

            // Filter and initialize valid modules
            const validModules = Object.entries(this.modules)
                .filter(([key, module]) => {
                    if (!module) {
                        console.warn(`⚠️ Warning: Module '${key}' is undefined or null`);
                        return false;
                    }
                    return true;
                });

            // Initialize modules with AI integration
            for (const [key, module] of validModules) {
                if (this.validateModuleStructure(module)) {
                    if (module.aiEnabled) {
                        await this.initializeAIFeatures(module);
                    }
                    this.moduleCache.set(key, module);
                    console.log(`✅ Module '${key}' initialized successfully${module.aiEnabled ? ' with AI features' : ''}`);
                } else {
                    console.warn(`⚠️ Warning: Module '${key}' has invalid structure but will be loaded`);
                    this.moduleCache.set(key, module);
                }
            }

            console.log('✅ Module initialization completed');
            
        } catch (error) {
            console.error('❌ Error Initializing Modules:', error);
            console.warn('⚠️ Continuing with partial module initialization');
        }
    }

    async initializeAIFeatures(module) {
        try {
            // Set up AI learning models for the module
            await this.aiLearningSystem.setupModuleModels(module.id);
            
            // Initialize progression tracking
            await this.progressionTracker.initializeModuleTracking(module.id);

            // Set up adaptive learning if enabled
            if (module.adaptiveLearning) {
                await this.aiLearningSystem.initializeAdaptiveLearning(module.id);
            }
        } catch (error) {
            console.error(`❌ Error initializing AI features for module ${module.id}:`, error);
            throw error;
        }
    }

    async loadModule(moduleId) {
        try {
            if (this.moduleCache.has(moduleId)) {
                return this.moduleCache.get(moduleId);
            }

            const module = this.moduleById[moduleId];
            if (!module) throw new Error(`Module ${moduleId} not found`);

            // Load AI features if enabled
            if (module.aiEnabled) {
                await this.initializeAIFeatures(module);
            }

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
            
            // Check both completion and performance requirements
            const prereqStatus = await Promise.all(module.prerequisites.map(async prereq => {
                const isCompleted = userProgress.completedModules.includes(prereq);
                const performance = await this.progressionTracker.getModulePerformance(userId, prereq);
                return isCompleted && performance.score >= module.prerequisites.minScore;
            }));

            return prereqStatus.every(status => status);
        } catch (error) {
            console.error('❌ Error validating prerequisites:', error);
            throw error;
        }
    }

    async getAvailableModules(userId) {
        try {
            const modules = await Promise.all(Object.values(this.modules).map(async module => {
                const progress = await this.calculateModuleProgress(userId, module.id);
                const isAvailable = await this.validateModulePrerequisites(module.id, userId);
                
                // Get AI recommendations if enabled
                let aiRecommendations = null;
                if (module.aiEnabled) {
                    aiRecommendations = await this.aiLearningSystem.getModuleRecommendations(userId, module.id);
                }

                return {
                    id: module.id,
                    name: module.name,
                    description: module.description,
                    difficulty: module.difficulty,
                    duration: module.duration,
                    isAvailable,
                    progress,
                    aiRecommendations,
                    trainingFormats: module.trainingFormats,
                    creditSystem: module.creditSystem,
                    certification: module.certification,
                    adaptiveLearning: module.adaptiveLearning
                };
            }));

            // Sort modules based on user's learning path
            return this.aiLearningSystem.optimizeModuleOrder(modules, userId);
        } catch (error) {
            console.error('❌ Error getting available modules:', error);
            throw error;
        }
    }

    async getUserProgress(userId) {
        try {
            const progress = await this.progressionTracker.getUserProgress(userId);
            return {
                completedModules: progress.completed,
                inProgress: progress.inProgress,
                achievements: progress.achievements,
                totalCredits: progress.credits,
                performance: progress.performance
            };
        } catch (error) {
            console.error('❌ Error getting user progress:', error);
            throw error;
        }
    }

    async calculateModuleProgress(userId, moduleId) {
        try {
            const progress = await this.progressionTracker.getModuleProgress(userId, moduleId);
            return {
                percentage: progress.percentage,
                performance: progress.performance,
                adaptiveMetrics: progress.adaptiveMetrics,
                lastActivity: progress.lastActivity
            };
        } catch (error) {
            console.error('❌ Error calculating module progress:', error);
            return { percentage: 0, performance: null };
        }
    }

    async updateModuleProgress(userId, moduleId, progress) {
        try {
            // Update progress tracking
            await this.progressionTracker.updateProgress(userId, moduleId, progress);

            // Update AI models if enabled
            const module = await this.loadModule(moduleId);
            if (module.aiEnabled) {
                await this.aiLearningSystem.updateLearningModel(userId, moduleId, progress);
            }

            console.log(`✅ Updated progress for ${moduleId}: ${progress.percentage}%`);
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

    async getModuleDetails(moduleId) {
        try {
            const module = await this.loadModule(moduleId);
            return {
                ...module,
                tasks: module.tasks || [],
                assessments: module.assessments || [],
                requirements: module.requirements || [],
                certification: module.certification || null,
                aiFeatures: module.aiEnabled ? {
                    adaptiveLearning: module.adaptiveLearning,
                    performanceMetrics: module.performanceMetrics,
                    feedbackSystem: module.feedbackSystem
                } : null
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

// Export both class and instance
module.exports = {
    ModuleLoader,
    moduleLoader
};