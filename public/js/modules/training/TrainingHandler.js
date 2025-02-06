// public/js/modules/training/TrainingHandler.js
import AIAssistant from '../../visualizations/AIAssistant.js';
import SpaceTrainingFSD from './fsdTraining.js';
import { ProgressTracker } from '../../visualizations/index.js';

class TrainingHandler {
    constructor(userId) {
        this.userId = userId;
        this.sessionId = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.fsd = new SpaceTrainingFSD();
        this.progressTracker = new ProgressTracker();
        this.sessionMetrics = {
            focusScore: 0,
            completionRate: 0,
            accuracyScore: 0
        };
    }

    async startAssessment() {
        try {
            // Initialize AI session for guidance
            const aiInitData = await AIAssistant.initialize(this.userId, 'full_guidance');
            console.log('AI Initialized:', aiInitData);

            const response = await fetch('/api/training/assessment/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    mode: 'full_guidance', 
                    userId: this.userId,
                    initialMetrics: this.sessionMetrics 
                })
            });

            const result = await response.json();
            if (result && result.success) {
                this.sessionId = result.sessionId;
                this.questions = result.questions.questions;
                this.currentQuestionIndex = 0;
                await this.showAIGuidedQuestion(this.questions[0]);
                
                // Start tracking progress
                this.progressTracker.startTracking(this.sessionId);
            } else {
                console.error('Failed to start assessment:', result);
            }
        } catch (error) {
            console.error('Error starting assessment:', error);
        }
    }

    async showAIGuidedQuestion(question) {
        console.log('Displaying question:', question.text);
        
        // Get FSD analysis for adaptive difficulty
        const learnerState = await this.fsd.analyzeLearnerState({
            focusTime: this.sessionMetrics.focusScore,
            interactionRate: this.sessionMetrics.completionRate,
            accuracy: this.sessionMetrics.accuracyScore
        });

        // Show immediate guidance
        AIAssistant.showGuidance("Analyzing your response pattern...");

        // Get personalized guidance
        const guidance = await AIAssistant.requestGuidance({
            questionId: question.id,
            currentProgress: this.currentQuestionIndex,
            learnerState
        });

        console.log('Received guidance:', guidance);
        AIAssistant.updateGuidance(guidance);

        // Update UI with question and adaptive settings
        this.updateQuestionDisplay(question, learnerState);
    }

    updateQuestionDisplay(question, learnerState) {
        const questionContainer = document.getElementById('question-container');
        if (questionContainer) {
            questionContainer.innerHTML = `
                <div class="space-y-4">
                    <h3 class="text-xl font-bold text-blue-400">${question.text}</h3>
                    <div class="bg-gray-800 p-4 rounded-lg">
                        ${this.renderQuestionContent(question, learnerState)}
                    </div>
                    ${this.renderMetricsDisplay()}
                </div>
            `;
        }
    }

    renderQuestionContent(question, learnerState) {
        // Adapt content based on learner state
        const difficulty = learnerState.comprehensionScore < 0.7 ? 'simplified' : 'standard';
        return question.content[difficulty] || question.content.standard;
    }

    renderMetricsDisplay() {
        return `
            <div class="grid grid-cols-3 gap-4 mt-4">
                <div class="text-center">
                    <div class="text-sm text-gray-400">Focus</div>
                    <div class="text-lg font-bold ${this.sessionMetrics.focusScore > 0.7 ? 'text-green-400' : 'text-yellow-400'}">
                        ${Math.round(this.sessionMetrics.focusScore * 100)}%
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-400">Completion</div>
                    <div class="text-lg font-bold text-blue-400">
                        ${Math.round(this.sessionMetrics.completionRate * 100)}%
                    </div>
                </div>
                <div class="text-center">
                    <div class="text-sm text-gray-400">Accuracy</div>
                    <div class="text-lg font-bold ${this.sessionMetrics.accuracyScore > 0.8 ? 'text-green-400' : 'text-yellow-400'}">
                        ${Math.round(this.sessionMetrics.accuracyScore * 100)}%
                    </div>
                </div>
            </div>
        `;
    }

    async processAnswer(answer) {
        try {
            const currentQuestion = this.questions[this.currentQuestionIndex];
            const response = await fetch(`/api/training/assessment/${this.sessionId}/submit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: currentQuestion,
                    answer: answer,
                    metrics: this.sessionMetrics
                })
            });

            const result = await response.json();
            if (result.success) {
                // Update metrics
                this.updateSessionMetrics(result.metrics);
                
                this.currentQuestionIndex++;
                if (result.isComplete) {
                    await this.completeAssessment();
                } else {
                    await this.showAIGuidedQuestion(result.nextQuestion);
                }
            } else {
                console.error('Error submitting answer:', result);
            }
        } catch (error) {
            console.error('Error in processAnswer:', error);
        }
    }

    updateSessionMetrics(newMetrics) {
        this.sessionMetrics = {
            ...this.sessionMetrics,
            ...newMetrics
        };
        this.progressTracker.updateMetrics(this.sessionMetrics);
    }

    async completeAssessment() {
        try {
            const response = await fetch(`/api/training/assessment/${this.sessionId}/complete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    finalMetrics: this.sessionMetrics
                })
            });

            const result = await response.json();
            if (result.success) {
                console.log('Assessment completed successfully. Training plan:', result.trainingPlan);
                this.progressTracker.completeSession(result.trainingPlan);
                await this.showCompletionSummary(result);
            } else {
                console.error('Failed to complete assessment:', result);
            }
        } catch (error) {
            console.error('Error completing assessment:', error);
        }
    }

    async showCompletionSummary(result) {
        const summaryContainer = document.getElementById('completion-summary');
        if (summaryContainer) {
            summaryContainer.innerHTML = `
                <div class="bg-gray-800 p-6 rounded-lg">
                    <h2 class="text-2xl font-bold text-blue-400 mb-4">Assessment Complete!</h2>
                    <div class="space-y-4">
                        <div class="performance-summary">
                            ${this.renderPerformanceSummary(result)}
                        </div>
                        <div class="next-steps mt-6">
                            ${this.renderNextSteps(result.trainingPlan)}
                        </div>
                    </div>
                </div>
            `;
        }
    }
}

export default TrainingHandler;