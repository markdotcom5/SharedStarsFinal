// services/CoreTrainingSystem.js
const EventEmitter = require('events');
const BayesianTracker = require('./BayesianTracker');
const aiLearningInstance = require('./AILearningSystem');  // ✅ Correct import
const UnifiedEVAAIService = require('./UnifiedEVAAIService');
const ProgressTracking = require('../services/ProgressTracker');  // ✅ Correct path

class CoreTrainingSystem extends EventEmitter {
    constructor() {
        super();
        this.modules = {
            physical: {
                id: 'physical',
                aiEnabled: true,
                components: ['assessments', 'tasks', 'requirements'],
                prerequisites: []
            },
            technical: {
                id: 'technical',
                aiEnabled: true,
                components: ['tasks', 'systems', 'protocols'],
                prerequisites: ['physical.basics']
            },
            simulation: {
                id: 'simulation',
                aiEnabled: true,
                components: ['missions', 'scenarios', 'teamRoles'],
                prerequisites: ['technical.basics', 'physical.advanced']
            },
            eva: {
                id: 'eva',
                aiEnabled: true,
                components: ['procedures', 'equipment', 'safety'],
                prerequisites: ['simulation.basics', 'physical.zero_g']
            }
        };

        // Initialize core services
        this.bayesianTracker = new BayesianTracker();
        this.aiLearning = aiLearningInstance;
        this.progressTracker = ProgressTracking;  // ✅ Correct reference

        // Module-specific AI services
        this.moduleAIServices = {
            eva: UnifiedEVAAIService,
            // Add other module-specific AI services here
        };

        this.setupEventHandlers();
    }

    setupEventHandlers() {
        Object.keys(this.modules).forEach(moduleId => {
            const module = this.modules[moduleId];
            
            // Module-specific events
            this.on(`${moduleId}:progress`, async (data) => {
                await this.handleModuleProgress(moduleId, data);
            });

            this.on(`${moduleId}:assessment`, async (data) => {
                await this.handleModuleAssessment(moduleId, data);
            });

            // AI feedback events
            if (module.aiEnabled) {
                this.on(`${moduleId}:ai-feedback`, async (data) => {
                    await this.handleAIFeedback(moduleId, data);
                });
            }
        });
    }

    async initializeModule(moduleId, config = {}) {
        const module = this.modules[moduleId];
        if (!module) {
            throw new Error(`Module ${moduleId} not found`);
        }

        try {
            // Initialize module components
            for (const component of module.components) {
                await this.initializeComponent(moduleId, component);
            }

            // Initialize AI if enabled
            if (module.aiEnabled) {
                await this.initializeAI(moduleId);
            }

            // Initialize tracking
            await this.bayesianTracker.initializeTracking(moduleId);
            await this.progressTracker.initializeModule(moduleId);

            console.log(`✅ Module ${moduleId} initialized successfully`);
            return true;
        } catch (error) {
            console.error(`❌ Error initializing module ${moduleId}:`, error);
            throw error;
        }
    }

    async initializeComponent(moduleId, component) {
        try {
            // Load component configuration
            const config = require(`../modules/core/${moduleId}/${component}`);
            
            // Initialize component
            await config.initialize();
            
            console.log(`✅ Component ${component} initialized for ${moduleId}`);
        } catch (error) {
            console.error(`❌ Error initializing component ${component} for ${moduleId}:`, error);
            throw error;
        }
    }

    async initializeAI(moduleId) {
        const aiService = this.moduleAIServices[moduleId];
        if (aiService) {
            await aiService.initialize();
        }
        await this.aiLearning.initializeForModule(moduleId);
    }

    async handleModuleProgress(moduleId, data) {
        const { userId, progress } = data;

        try {
            // Update Bayesian knowledge state
            await this.bayesianTracker.updateKnowledgeState(
                userId,
                moduleId,
                progress.successRate
            );

            // Update module-specific AI if available
            if (this.moduleAIServices[moduleId]) {
                await this.moduleAIServices[moduleId].updateLearningModel(userId, progress);
            }

            // Update general AI learning system
            await this.aiLearning.updateProgress(userId, moduleId, progress);

            // Track progression
            await this.progressTracker.updateProgress(userId, moduleId, progress);

            // Generate feedback
            const feedback = await this.generateFeedback(userId, moduleId, progress);

            // Emit feedback event
            this.emit(`${moduleId}:feedback`, {
                userId,
                moduleId,
                feedback,
                timestamp: new Date()
            });

        } catch (error) {
            console.error(`Error handling progress for ${moduleId}:`, error);
            throw error;
        }
    }

    async handleModuleAssessment(moduleId, data) {
        const { userId, assessment } = data;

        try {
            // Update knowledge state
            await this.bayesianTracker.updateKnowledgeState(
                userId,
                moduleId,
                assessment.score
            );

            // Generate recommendations
            const recommendations = await this.generateRecommendations(userId, moduleId);

            // Update learning path
            await this.updateLearningPath(userId, moduleId, assessment);

            return { recommendations };
        } catch (error) {
            console.error(`Error handling assessment for ${moduleId}:`, error);
            throw error;
        }
    }

    async generateFeedback(userId, moduleId, data) {
        const module = this.modules[moduleId];
        const aiService = this.moduleAIServices[moduleId];

        // Get knowledge gaps
        const gaps = await this.bayesianTracker.identifyKnowledgeGaps(userId);
        
        // Get module-specific feedback if available
        let moduleFeedback = {};
        if (aiService) {
            moduleFeedback = await aiService.generateFeedback(userId, data);
        }

        // Get general AI feedback
        const aiFeedback = await this.aiLearning.generateFeedback(userId, moduleId, data);

        return {
            ...moduleFeedback,
            ...aiFeedback,
            gaps,
            recommendations: await this.generateRecommendations(userId, moduleId)
        };
    }

    async generateRecommendations(userId, moduleId) {
        const knowledgeState = await this.bayesianTracker.getSkillMastery(userId, moduleId);
        const gaps = await this.bayesianTracker.identifyKnowledgeGaps(userId);

        return this.aiLearning.generateRecommendations(userId, {
            moduleId,
            knowledgeState,
            gaps
        });
    }

    async updateLearningPath(userId, moduleId, assessment) {
        const currentState = await this.bayesianTracker.getSkillMastery(userId, moduleId);
        
        // Check prerequisites for next modules
        for (const [nextModuleId, module] of Object.entries(this.modules)) {
            if (module.prerequisites.includes(`${moduleId}.basics`)) {
                const readiness = await this.checkModuleReadiness(userId, nextModuleId);
                if (readiness.ready) {
                    await this.progressTracker.unlockModule(userId, nextModuleId);
                }
            }
        }
    }

    async checkModuleReadiness(userId, moduleId) {
        const module = this.modules[moduleId];
        const prerequisites = module.prerequisites;

        const prerequisiteStatus = await Promise.all(
            prerequisites.map(async prereq => {
                const [moduleId, level] = prereq.split('.');
                const mastery = await this.bayesianTracker.getSkillMastery(userId, moduleId);
                return mastery >= this.getRequiredMasteryLevel(level);
            })
        );

        return {
            ready: prerequisiteStatus.every(status => status),
            missingPrerequisites: prerequisites.filter((_, index) => !prerequisiteStatus[index])
        };
    }

    getRequiredMasteryLevel(level) {
        const levels = {
            basics: 70,
            advanced: 85,
            expert: 95,
            zero_g: 90
        };
        return levels[level] || 70;
    }
}

module.exports = new CoreTrainingSystem();