const { OpenAI } = require('openai');
const EventEmitter = require('events');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const tf = require('@tensorflow/tfjs-node');

// Models
const TrainingSession = require('../models/TrainingSession');
const EVASession = require('../models/eva/EVASession');
const UserProgress = require('../models/UserProgress');

class AITrainingService extends EventEmitter {
    constructor(server) {
        super();
        // Initialize OpenAI
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.defaultModel = 'gpt-4-turbo-preview';

        // Initialize WebSocket server
        this.wss = new WebSocket.Server({ server, noServer: true });
        this.clients = new Map();
        this.activeEVASessions = new Map();

        // Initialize tracking systems
        this.userProfiles = new Map();
        this.performanceMetrics = new Map();
        this.creditSystem = new Map();

        // Initialize Advanced AI Components
        this.initializeAIComponents();

        // Set up WebSocket handlers
        this.setupWebSocketHandlers();
    }

    async initializeAIComponents() {
        // Initialize State Space
        this.stateSpace = {
            knowledge: new Array(100).fill(0),
            skills: new Array(50).fill(0),
            performance: new Array(30).fill(0),
        };

        // Initialize Action Space
        this.actionSpace = {
            difficulty: ['easy', 'medium', 'hard'],
            taskTypes: ['theory', 'practical', 'assessment'],
            adaptationTypes: ['increase', 'decrease', 'maintain'],
        };

        // Initialize Bayesian Model
        this.bayesianModel = {
            priorKnowledge: new Map(),
            learningRates: new Map(),
            confidenceScores: new Map(),
        };

        // Initialize RL Model
        await this.initializeRLModel();
    }

    async initializeRLModel() {
        try {
            this.rlModel = tf.sequential({
                layers: [
                    tf.layers.dense({
                        inputShape: [180],
                        units: 128,
                        activation: 'relu',
                    }),
                    tf.layers.dense({
                        units: 64,
                        activation: 'relu',
                    }),
                    tf.layers.dense({
                        units: 9, // Combined action space size
                        activation: 'softmax',
                    }),
                ],
            });

            this.rlModel.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy'],
            });
        } catch (error) {
            console.error('❌ RL Model Initialization Error:', error);
            throw error;
        }
    }

    // Enhanced WebSocket Message Handler
    async handleWebSocketMessage(userId, ws, data) {
        try {
            switch (data.type) {
                case 'dashboard_request':
                    await this.updateDashboardStats(userId);
                    break;

                case 'eva_session_start':
                    await this.handleEVASession(userId, data);
                    break;

                case 'training_update':
                    await this.processTrainingUpdate(userId, data);
                    break;

                case 'request_ai_guidance':
                    await this.provideAIGuidance(userId, data);
                    break;

                case 'adaptive_learning_update':
                    await this.handleAdaptiveLearning(userId, data);
                    break;

                case 'performance_analysis':
                    await this.analyzePerformance(userId, data);
                    break;
            }
        } catch (error) {
            console.error('❌ Message Handler Error:', error);
            ws.send(JSON.stringify({ type: 'error', error: error.message }));
        }
    }

    // Enhanced AI Methods
    async provideAIGuidance(userId, data) {
        try {
            const userProfile = await this.getUserProfile(userId);
            const learningState = await this.getCurrentLearningState(userId);

            // Get RL-based next action
            const nextAction = await this.predictNextAction(learningState);

            // Get OpenAI guidance
            const guidance = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an advanced space training AI providing personalized guidance based on both current performance and predicted optimal learning path.',
                    },
                    {
                        role: 'user',
                        content: `Provide guidance based on:
                            Current Activity: ${data.activity}
                            Performance History: ${JSON.stringify(userProfile.performanceHistory)}
                            Learning State: ${JSON.stringify(learningState)}
                            Predicted Optimal Action: ${JSON.stringify(nextAction)}
                            Current Challenges: ${JSON.stringify(data.challenges)}`,
                    },
                ],
            });

            // Update Bayesian model
            await this.updateBayesianModel(userId, data.performance);

            const combinedGuidance = {
                aiGuidance: JSON.parse(guidance.choices[0].message.content),
                nextAction,
                learningState,
                bayesianMetrics: this.getBayesianMetrics(userId),
            };

            this.broadcastToUser(userId, 'ai_guidance', combinedGuidance);
            return combinedGuidance;
        } catch (error) {
            console.error('❌ AI Guidance Error:', error);
            throw error;
        }
    }

    async handleAdaptiveLearning(userId, data) {
        try {
            const currentState = await this.getCurrentLearningState(userId);
            const stateTensor = tf.tensor2d([this.flattenState(currentState)]);
            const actionProbabilities = this.rlModel.predict(stateTensor);

            const action = await this.selectOptimalAction(actionProbabilities);
            await this.updateLearningState(userId, action, data.performance);

            return {
                nextAction: action,
                updatedState: await this.getCurrentLearningState(userId),
                adaptiveMetrics: this.getAdaptiveMetrics(userId),
            };
        } catch (error) {
            console.error('❌ Adaptive Learning Error:', error);
            throw error;
        }
    }

    async analyzePerformance(userId, data) {
        try {
            // Update Bayesian knowledge
            const posteriorKnowledge = this.updateBayesianKnowledge(
                userId,
                data.moduleId,
                data.performance
            );

            // Get current learning state
            const learningState = await this.getCurrentLearningState(userId);

            // Predict next optimal action
            const nextAction = await this.predictNextAction(learningState);

            // Generate comprehensive analysis
            const analysis = {
                currentKnowledge: posteriorKnowledge,
                learningState,
                recommendedAction: nextAction,
                confidence: this.bayesianModel.confidenceScores.get(userId),
                adaptiveMetrics: this.getAdaptiveMetrics(userId),
            };

            this.broadcastToUser(userId, 'performance_analysis', analysis);
            return analysis;
        } catch (error) {
            console.error('❌ Performance Analysis Error:', error);
            throw error;
        }
    }

    // Helper Methods
    async getCurrentLearningState(userId) {
        const userProgress = await UserProgress.findOne({ userId });
        return {
            knowledge: this.stateSpace.knowledge.map((_, i) => userProgress?.knowledge?.[i] || 0),
            skills: this.stateSpace.skills.map((_, i) => userProgress?.skills?.[i] || 0),
            performance: this.stateSpace.performance.map(
                (_, i) => userProgress?.performance?.[i] || 0
            ),
        };
    }

    flattenState(state) {
        return [...state.knowledge, ...state.skills, ...state.performance];
    }

    async predictNextAction(state) {
        const stateTensor = tf.tensor2d([this.flattenState(state)]);
        const actionProbabilities = this.rlModel.predict(stateTensor);
        return this.selectOptimalAction(actionProbabilities);
    }

    async selectOptimalAction(actionProbabilities) {
        const probArray = await actionProbabilities.array();
        const maxIndex = probArray[0].indexOf(Math.max(...probArray[0]));

        return {
            difficulty: this.actionSpace.difficulty[Math.floor(maxIndex / 3)],
            taskType: this.actionSpace.taskTypes[maxIndex % 3],
            adaptationType:
                this.actionSpace.adaptationTypes[
                    Math.floor(
                        maxIndex /
                            (this.actionSpace.difficulty.length * this.actionSpace.taskTypes.length)
                    )
                ],
        };
    }

    updateBayesianKnowledge(userId, moduleId, performance) {
        const key = `${userId}-${moduleId}`;
        const prior = this.bayesianModel.priorKnowledge.get(key) || 0.5;
        const likelihood = 1 / (1 + Math.exp(-performance));

        const posterior =
            (prior * likelihood) / (prior * likelihood + (1 - prior) * (1 - likelihood));

        this.bayesianModel.priorKnowledge.set(key, posterior);
        this.bayesianModel.confidenceScores.set(key, Math.abs(posterior - 0.5) * 2);

        return posterior;
    }

    getBayesianMetrics(userId) {
        return {
            confidence: this.bayesianModel.confidenceScores.get(userId) || 0,
            learningRate: this.bayesianModel.learningRates.get(userId) || 0.1,
        };
    }

    getAdaptiveMetrics(userId) {
        return {
            currentLevel: this.getCurrentLevel(userId),
            adaptationRate: this.getAdaptationRate(userId),
            performanceHistory: this.getPerformanceHistory(userId),
        };
    }

    // Cleanup with enhanced resource management
    cleanup() {
        this.wss.clients.forEach((client) => {
            client.terminate();
        });

        if (this.rlModel) {
            this.rlModel.dispose();
        }

        this.clients.clear();
        this.userProfiles.clear();
        this.performanceMetrics.clear();
        this.creditSystem.clear();
        this.bayesianModel.priorKnowledge.clear();
        this.bayesianModel.learningRates.clear();
        this.bayesianModel.confidenceScores.clear();
    }
}

// Create and export singleton instance
const aiTrainingService = new AITrainingService();

// Handle graceful shutdown
process.on('SIGTERM', () => {
    aiTrainingService.cleanup();
});

process.on('SIGINT', () => {
    aiTrainingService.cleanup();
});

module.exports = aiTrainingService;
