// services/UnifiedEVAAIService.js
const OpenAI = require('openai');
const EventEmitter = require('events');
const aiLearningInstance = require('./AILearningSystem');
const ProgressTracking = require('../services/ProgressTracker'); // ✅ Correct path

class UnifiedEVAAIService extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI(process.env.OPENAI_API_KEY);
        this.aiLearning = aiLearningInstance;
        this.progressTracker = ProgressTracking; // ✅ Correct reference
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log('🚀 Initializing Unified EVA AI Service');

            // Initialize learning system
            await this.learningSystem.initialize();

            // Initialize progress tracking
            await this.progressTracker.initialize();

            this.initialized = true;
            console.log('✅ Unified EVA AI Service Initialized');
        } catch (error) {
            console.error('❌ EVA AI Service Initialization Error:', error);
            throw error;
        }
    }

    // OpenAI Integration Methods
    async generateProcedureGuidance(procedure, userLevel) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an advanced EVA training assistant specializing in spacewalk procedures and safety protocols.',
                    },
                    {
                        role: 'user',
                        content: `Generate step-by-step guidance for ${procedure} suitable for a ${userLevel} trainee. Include safety checkpoints and common mistakes to avoid.`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 1000,
            });

            // Track AI interaction
            await this.trackAIInteraction(procedure, userLevel, 'guidance');

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating EVA guidance:', error);
            throw error;
        }
    }

    // Learning System Integration
    async updateLearningModel(userId, sessionData) {
        try {
            // Update reinforcement learning model
            const state = await this.learningSystem.getState(userId);
            const action = await this.learningSystem.getOptimalAction(state);

            // Calculate reward based on performance
            const reward = this.calculateReward(sessionData);

            // Update model
            await this.learningSystem.updateModel(state, action, reward);

            return action;
        } catch (error) {
            console.error('Error updating learning model:', error);
            throw error;
        }
    }

    // Metrics Collection
    async trackMetrics(userId, sessionData) {
        try {
            const metrics = {
                performance: this.calculatePerformanceMetrics(sessionData),
                learning: await this.learningSystem.getMetrics(userId),
                aiInteractions: await this.getAIInteractionMetrics(userId),
            };

            await this.progressTracker.updateMetrics(userId, metrics);
            return metrics;
        } catch (error) {
            console.error('Error tracking metrics:', error);
            throw error;
        }
    }

    // Helper Methods
    calculatePerformanceMetrics(sessionData) {
        return {
            accuracy: this.calculateAccuracy(sessionData),
            completionTime: this.calculateCompletionTime(sessionData),
            safetyScore: this.calculateSafetyScore(sessionData),
            efficiency: this.calculateEfficiency(sessionData),
        };
    }

    calculateReward(sessionData) {
        const metrics = this.calculatePerformanceMetrics(sessionData);
        return metrics.accuracy * 0.4 + metrics.safetyScore * 0.4 + metrics.efficiency * 0.2;
    }

    async trackAIInteraction(type, level, interactionType) {
        try {
            await this.progressTracker.logAIInteraction({
                type,
                level,
                interactionType,
                timestamp: new Date(),
            });
        } catch (error) {
            console.error('Error tracking AI interaction:', error);
        }
    }

    // Metric Calculation Methods
    calculateAccuracy(sessionData) {
        const { correctActions, totalActions } = sessionData;
        return totalActions > 0 ? correctActions / totalActions : 0;
    }

    calculateCompletionTime(sessionData) {
        return (sessionData.endTime - sessionData.startTime) / 1000; // in seconds
    }

    calculateSafetyScore(sessionData) {
        const { safetyViolations, criticalErrors, warningFlags } = sessionData;
        const baseScore = 1.0;
        const violationPenalty = 0.1;
        const criticalPenalty = 0.2;
        const warningPenalty = 0.05;

        return Math.max(
            0,
            baseScore -
                safetyViolations * violationPenalty -
                criticalErrors * criticalPenalty -
                warningFlags * warningPenalty
        );
    }

    calculateEfficiency(sessionData) {
        const optimalTime = sessionData.optimalCompletionTime || 300; // 5 minutes default
        const actualTime = this.calculateCompletionTime(sessionData);
        return Math.max(0, 1 - (actualTime - optimalTime) / optimalTime);
    }

    async getAIInteractionMetrics(userId) {
        return await this.progressTracker.getAIInteractionStats(userId);
    }

    // Real-time Feedback
    async provideFeedback(userId, currentAction) {
        try {
            const learningState = await this.learningSystem.getState(userId);
            const feedback = await this.generateActionFeedback(currentAction, learningState);

            this.emit('feedback-generated', {
                userId,
                feedback,
                timestamp: new Date(),
            });

            return feedback;
        } catch (error) {
            console.error('Error providing feedback:', error);
            throw error;
        }
    }

    async generateActionFeedback(action, learningState) {
        try {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4-turbo-preview',
                messages: [
                    {
                        role: 'system',
                        content:
                            'You are an EVA performance evaluation expert providing real-time feedback.',
                    },
                    {
                        role: 'user',
                        content: `Analyze this action and provide specific feedback: ${JSON.stringify({ action, learningState })}`,
                    },
                ],
                temperature: 0.7,
                max_tokens: 500,
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating action feedback:', error);
            throw error;
        }
    }
}

module.exports = new UnifiedEVAAIService();
