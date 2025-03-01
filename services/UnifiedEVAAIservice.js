const OpenAI = require('openai');
const { EventEmitter } = require('events');
const TrainingLearningSystem = require('./TrainingLearningSystem');

class UnifiedEVAAIService extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI(process.env.OPENAI_API_KEY);
        
        // Get components from TrainingLearningSystem
        this.aiLearning = TrainingLearningSystem.AILearning || {};
        this.progressTracker = TrainingLearningSystem.ProgressTracker || {};
        this.learningSystem = TrainingLearningSystem.LearningSystem || this.aiLearning || {};
        
        this.initialized = false;
    }

    async initialize() {
        try {
            console.log("🚀 Initializing Unified EVA AI Service");
            
            // Initialize learning system if available
            if (typeof this.learningSystem.initialize === 'function') {
                await this.learningSystem.initialize();
            }
            
            // Initialize progress tracking if available
            if (typeof this.progressTracker.initialize === 'function') {
                await this.progressTracker.initialize();
            }
            
            this.initialized = true;
            console.log("✅ Unified EVA AI Service Initialized");
        } catch (error) {
            console.error("❌ EVA AI Service Initialization Error:", error);
            throw error;
        }
    }

    // OpenAI Integration Methods
    async generateProcedureGuidance(procedure, userLevel) {
        try {
            const response = await this.openai.chat.completions.create({
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an advanced EVA training assistant specializing in spacewalk procedures and safety protocols."
                    },
                    {
                        role: "user",
                        content: `Generate step-by-step guidance for ${procedure} suitable for a ${userLevel} trainee. Include safety checkpoints and common mistakes to avoid.`
                    }
                ],
                temperature: 0.7,
                max_tokens: 1000
            });

            // Track AI interaction if method available
            if (typeof this.trackAIInteraction === 'function') {
                await this.trackAIInteraction(procedure, userLevel, 'guidance');
            }

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating EVA guidance:', error);
            throw error;
        }
    }

    // Learning System Integration
    async updateLearningModel(userId, sessionData) {
        try {
            // Check if learning system is available
            if (!this.learningSystem || typeof this.learningSystem.getState !== 'function') {
                console.warn('Learning system not available or properly initialized');
                return null;
            }
            
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
                learning: typeof this.learningSystem.getMetrics === 'function' ? 
                          await this.learningSystem.getMetrics(userId) : {},
                aiInteractions: typeof this.getAIInteractionMetrics === 'function' ?
                               await this.getAIInteractionMetrics(userId) : {}
            };

            if (typeof this.progressTracker.updateMetrics === 'function') {
                await this.progressTracker.updateMetrics(userId, metrics);
            }
            
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
            efficiency: this.calculateEfficiency(sessionData)
        };
    }

    calculateReward(sessionData) {
        const metrics = this.calculatePerformanceMetrics(sessionData);
        return (
            metrics.accuracy * 0.4 +
            metrics.safetyScore * 0.4 +
            metrics.efficiency * 0.2
        );
    }

    async trackAIInteraction(type, level, interactionType) {
        try {
            if (typeof this.progressTracker.logAIInteraction === 'function') {
                await this.progressTracker.logAIInteraction({
                    type,
                    level,
                    interactionType,
                    timestamp: new Date()
                });
            }
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
            (safetyViolations * violationPenalty) -
            (criticalErrors * criticalPenalty) -
            (warningFlags * warningPenalty)
        );
    }

    calculateEfficiency(sessionData) {
        const optimalTime = sessionData.optimalCompletionTime || 300; // 5 minutes default
        const actualTime = this.calculateCompletionTime(sessionData);
        return Math.max(0, 1 - (actualTime - optimalTime) / optimalTime);
    }

    async getAIInteractionMetrics(userId) {
        if (typeof this.progressTracker.getAIInteractionStats === 'function') {
            return await this.progressTracker.getAIInteractionStats(userId);
        }
        return {};
    }

    // Real-time Feedback
    async provideFeedback(userId, currentAction) {
        try {
            if (!this.learningSystem || typeof this.learningSystem.getState !== 'function') {
                console.warn('Learning system not available or properly initialized');
                return "Feedback system unavailable";
            }
            
            const learningState = await this.learningSystem.getState(userId);
            const feedback = await this.generateActionFeedback(currentAction, learningState);
            
            this.emit('feedback-generated', {
                userId,
                feedback,
                timestamp: new Date()
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
                model: "gpt-4-turbo-preview",
                messages: [
                    {
                        role: "system",
                        content: "You are an EVA performance evaluation expert providing real-time feedback."
                    },
                    {
                        role: "user",
                        content: `Analyze this action and provide specific feedback: ${JSON.stringify({ action, learningState })}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            return response.choices[0].message.content;
        } catch (error) {
            console.error('Error generating action feedback:', error);
            throw error;
        }
    }
}

module.exports = new UnifiedEVAAIService();