const EventEmitter = require('events');
const SpaceTrainingRL = require('../models/SpaceTrainingRL'); // ✅ Correct path
const BayesianTracker = require('../models/BayesianTracking');
const AIServiceIntegrator = require('./AIServiceIntegrator');
const aiLearningInstance = require('./AILearningSystem'); // ✅ Correct import
const UnifiedEVAAIService = require('./UnifiedEVAAIService');
const ProgressTracking = require('./ProgressTracker'); // ✅ Correct path
const ModuleSystemIntegrator = require('./ModuleSystemIntegrator');
const ReinforcementLearning = require('../models/ReinforcementLearning'); // ✅ Ensure correct path

const TRAINING_MODULES = {
    FOUNDATIONAL: {
        id: 'foundational',
        modules: ['space_science', 'mission_prep', 'zero_g_adaptation', 'crew_dynamics'],
    },
    INTERMEDIATE: {
        id: 'intermediate',
        modules: ['emergency_protocols', 'spacecraft_operations', 'problem_solving'],
    },
    SIMULATION: {
        id: 'simulation',
        modules: ['eva_sim', 'spacecraft_ops_sim', 'planetary_nav_sim'],
    },
    HEALTH_PERFORMANCE: {
        id: 'health',
        modules: ['physical_training', 'mental_resilience', 'space_medicine'],
    },
    TECHNICAL: {
        id: 'technical',
        modules: ['spacecraft_controls', 'navigation', 'propulsion_systems'],
    },
    EMERGENCY: {
        id: 'emergency',
        modules: ['system_failures', 'survival_techniques', 'crisis_response'],
    },
    ENGINEERING: {
        id: 'engineering',
        modules: ['spacecraft_repair', 'robotics', 'health_monitoring'],
    },
    EVA: {
        id: 'eva',
        modules: ['spacewalk', 'suit_operations', 'emergency_procedures'],
    },
    NAVIGATION: {
        id: 'navigation',
        modules: ['mission_planning', 'orbital_mechanics', 'autonomous_nav'],
    },
    SURFACE_OPS: {
        id: 'surface_ops',
        modules: ['terrain_adaptation', 'rover_operations', 'habitat_construction'],
    },
    SPACE_MEDICINE: {
        id: 'medicine',
        modules: ['medical_protocols', 'emergency_medicine', 'telemedicine'],
    },
    AI_ROBOTICS: {
        id: 'ai_robotics',
        modules: ['ai_mission_planning', 'human_machine_collab', 'robotics_deployment'],
    },
    AGRICULTURE: {
        id: 'agriculture',
        modules: ['hydroponics', 'resource_management', 'sustainability'],
    },
    COMMUNICATIONS: {
        id: 'communications',
        modules: ['realtime_comms', 'deep_space_comms', 'signal_processing'],
    },
    SPACE_LAW: {
        id: 'space_law',
        modules: ['regulations', 'ethics', 'governance'],
    },
    MISSION_CONTROL: {
        id: 'mission_control',
        modules: ['mission_monitoring', 'predictive_analytics', 'traffic_management'],
    },
    COMMERCIAL: {
        id: 'commercial',
        modules: ['space_economics', 'tourism', 'investment'],
    },
    RADIATION: {
        id: 'radiation',
        modules: ['radiation_protection', 'shielding', 'weather_forecasting'],
    },
    PSYCHOLOGICAL: {
        id: 'psychological',
        modules: ['isolation_training', 'team_building', 'mental_endurance'],
    },
    LEADERSHIP: {
        id: 'leadership',
        modules: ['crisis_leadership', 'crew_coordination', 'decision_making'],
    },
    CERTIFICATION: {
        id: 'certification',
        modules: ['final_exams', 'mission_trials', 'seat_allocation'],
    },
};

class TrainingModuleIntegrator extends EventEmitter {
    constructor() {
        super();
        // Initialize core services
        this.rl = new SpaceTrainingRL();
        this.bayesianTracker = new BayesianTracker();
        this.aiService = new AIServiceIntegrator();
        this.aiLearning = aiLearningInstance;
        this.evaService = UnifiedEVAAIService;
        this.progressTracker = ProgressTracking; // ✅ Correct reference
        this.moduleIntegrator = ModuleSystemIntegrator;

        // Training state management
        this.activeModules = new Map();
        this.userSessions = new Map();
        this.learningPaths = new Map();
        this.moduleHandlers = new Map();

        // Performance metrics
        this.metricAggregator = new MetricsAggregator();

        // Initialize training module handlers
        this.initializeModuleHandlers();
        this.setupEventListeners();
    }

    // ✅ Preserving training modules
    initializeModuleHandlers() {
        Object.entries(TRAINING_MODULES).forEach(([type, config]) => {
            this.moduleHandlers.set(type, this.createModuleHandler(config));
        });
    }

    initialize() {
        console.log('✅ TrainingModuleIntegrator Initialized');
    }

    createModuleHandler(moduleConfig) {
        return {
            getNextModule: async (userId, currentModule, performance) => {
                const state = await this.rl.getState({
                    moduleType: moduleConfig.id,
                    currentModule,
                    performance,
                });
                return this.determineNextModule(moduleConfig, state);
            },
            updateProgress: async (userId, moduleData) => {
                await this.bayesianTracker.updateKnowledgeState(
                    userId,
                    moduleConfig.id,
                    moduleData.performance.success
                );
                return this.generateProgressUpdate(userId, moduleConfig, moduleData);
            },
            getRecommendations: async (userId, moduleData) => {
                const state = await this.rl.getState({
                    moduleType: moduleConfig.id,
                    performance: moduleData.performance,
                });
                return this.generateModuleRecommendations(moduleConfig, state);
            },
        };
    }

    setupEventListeners() {
        this.on('module-progress', this.handleModuleProgress.bind(this));
        this.on('assessment-complete', this.handleAssessmentComplete.bind(this));
        this.on('skill-practice', this.handleSkillPractice.bind(this));

        this.evaService.on('feedback-generated', this.handleAIFeedback.bind(this));
        this.aiLearning.on('path-update', this.updateLearningPath.bind(this));
    }

    async initializeModule(moduleId, config) {
        try {
            const module = await this.moduleIntegrator.loadModule(moduleId);

            if (config.aiEnabled) {
                await this.initializeAIFeatures(moduleId, config);
            }

            await this.initializeBayesianTracking(moduleId, config);
            await this.setupProgressionTracking(moduleId, config);

            this.activeModules.set(moduleId, {
                config,
                state: 'active',
                aiEnabled: config.aiEnabled,
                trackingEnabled: true,
            });

            return true;
        } catch (error) {
            console.error(`Failed to initialize module ${moduleId}:`, error);
            throw error;
        }
    }

    async initializeAIFeatures(moduleId, config) {
        await Promise.all([
            this.aiLearning.initializeForModule(moduleId, config),
            this.evaService.initialize(),
            this.bayesianTracker.initializeTracking(moduleId),
        ]);
    }

    async handleUserProgress(userId, moduleId, progressData) {
        try {
            await this.bayesianTracker.updateKnowledgeState(
                userId,
                moduleId,
                progressData.successRate
            );

            if (this.activeModules.get(moduleId)?.aiEnabled) {
                await this.aiLearning.updateModel(userId, moduleId, progressData);
            }

            await this.progressTracker.updateProgress(userId, moduleId, progressData);
            const feedback = await this.generateFeedback(userId, moduleId, progressData);
            await this.updateLearningPath(userId, moduleId);

            return {
                feedback,
                nextSteps: await this.getNextSteps(userId, moduleId),
                recommendations: await this.getRecommendations(userId, moduleId),
            };
        } catch (error) {
            console.error('Error handling user progress:', error);
            throw error;
        }
    }

    async generateFeedback(userId, moduleId, progressData) {
        const knowledgeGaps = await this.bayesianTracker.identifyKnowledgeGaps(userId);
        const skillMastery = await this.bayesianTracker.getSkillMastery(userId, moduleId);

        return this.evaService.generatePersonalizedFeedback({
            userId,
            moduleId,
            progressData,
            knowledgeGaps,
            skillMastery,
        });
    }

    async updateLearningPath(userId, moduleId) {
        const currentPath = this.learningPaths.get(userId) || [];
        const nextModules = await this.aiLearning.predictNextModules(userId, moduleId);

        this.learningPaths.set(userId, [
            ...currentPath,
            ...nextModules.filter((m) => !currentPath.includes(m)),
        ]);
    }

    async getNextSteps(userId, moduleId) {
        const knowledgeState = await this.bayesianTracker.getSkillMastery(userId, moduleId);
        const learningPath = this.learningPaths.get(userId) || [];

        return this.aiLearning.generateNextSteps({
            userId,
            moduleId,
            knowledgeState,
            learningPath,
        });
    }

    async getRecommendations(userId, moduleId) {
        const gaps = await this.bayesianTracker.identifyKnowledgeGaps(userId);
        return this.aiLearning.generateRecommendations(userId, gaps);
    }

    async handleModuleProgress(data) {
        const { userId, moduleId, progress } = data;
        await this.handleUserProgress(userId, moduleId, progress);
    }

    async handleAssessmentComplete(data) {
        const { userId, moduleId, assessment } = data;
        await this.bayesianTracker.updateKnowledgeState(userId, moduleId, assessment.score);
    }

    async handleSkillPractice(data) {
        const { userId, moduleId, skill, performance } = data;
        await this.bayesianTracker.updateKnowledgeState(userId, moduleId, performance.successRate);
    }

    async handleAIFeedback(data) {
        const { userId, moduleId, feedback } = data;
        await this.progressTracker.logAIFeedback(userId, moduleId, feedback);
    }

    async determineNextModule(moduleConfig, state) {
        const currentIndex = moduleConfig.modules.indexOf(state.currentModule);
        if (currentIndex === -1) return moduleConfig.modules[0];

        const action = await this.rl.getOptimalAction(state);
        return action.advance && currentIndex < moduleConfig.modules.length - 1
            ? moduleConfig.modules[currentIndex + 1]
            : moduleConfig.modules[currentIndex];
    }
}

class MetricsAggregator {
    constructor() {
        this.metrics = new Map();
    }

    addMetric(userId, moduleId, metric) {
        const key = `${userId}-${moduleId}`;
        const current = this.metrics.get(key) || [];
        this.metrics.set(key, [...current, metric]);
    }

    getMetrics(userId, moduleId) {
        return this.metrics.get(`${userId}-${moduleId}`) || [];
    }

    async aggregateMetrics(userId, moduleId) {
        return this.getMetrics(userId, moduleId);
    }
}

module.exports = new TrainingModuleIntegrator();
