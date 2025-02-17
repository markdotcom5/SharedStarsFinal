// services/models/ReinforcementLearning.js
const mongoose = require('mongoose');

// State/Action Space for Space Training
const StateSpace = {
    KNOWLEDGE_LEVELS: {
        BEGINNER: 'BEGINNER',
        INTERMEDIATE: 'INTERMEDIATE',
        ADVANCED: 'ADVANCED'
    },
    PERFORMANCE_LEVELS: {
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH'
    },
    STRESS_LEVELS: {
        NORMAL: 'NORMAL',
        ELEVATED: 'ELEVATED',
        HIGH: 'HIGH'
    }
};

const ActionSpace = {
    DIFFICULTY: {
        DECREASE: -1,
        MAINTAIN: 0,
        INCREASE: 1
    },
    CONTENT_TYPE: {
        THEORY: 'THEORY',
        SIMULATION: 'SIMULATION',
        PRACTICAL: 'PRACTICAL'
    },
    SUPPORT_LEVEL: {
        GUIDED: 'GUIDED',
        SEMI_AUTONOMOUS: 'SEMI_AUTONOMOUS',
        AUTONOMOUS: 'AUTONOMOUS'
    }
};

class SpaceTrainingRL {
    constructor() {
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.2;
        this.qTable = new Map();
    }

    // Get state representation
    getState(userData) {
        return {
            knowledgeLevel: this.determineKnowledgeLevel(userData.assessmentScores),
            performanceLevel: this.determinePerformanceLevel(userData.recentPerformance),
            stressLevel: this.determineStressLevel(userData.biometrics)
        };
    }

    // Get available actions for state
    getActions(state) {
        const actions = [];
        
        // Add difficulty adjustments
        Object.values(ActionSpace.DIFFICULTY).forEach(difficulty => {
            Object.values(ActionSpace.CONTENT_TYPE).forEach(contentType => {
                Object.values(ActionSpace.SUPPORT_LEVEL).forEach(supportLevel => {
                    actions.push({
                        difficulty,
                        contentType,
                        supportLevel
                    });
                });
            });
        });

        return actions;
    }

    // Get Q-value for state-action pair
    getQValue(state, action) {
        const stateKey = this.getStateKey(state);
        const actionKey = this.getActionKey(action);
        
        if (!this.qTable.has(stateKey)) {
            this.qTable.set(stateKey, new Map());
        }
        
        const stateActions = this.qTable.get(stateKey);
        return stateActions.get(actionKey) || 0;
    }

    // Update Q-value based on reward
    async updateQValue(state, action, nextState, reward) {
        const stateKey = this.getStateKey(state);
        const actionKey = this.getActionKey(action);
        
        const currentQ = this.getQValue(state, action);
        const nextActions = this.getActions(nextState);
        const maxNextQ = Math.max(...nextActions.map(a => this.getQValue(nextState, a)));
        
        const newQ = currentQ + this.learningRate * (
            reward + this.discountFactor * maxNextQ - currentQ
        );

        if (!this.qTable.has(stateKey)) {
            this.qTable.set(stateKey, new Map());
        }
        
        this.qTable.get(stateKey).set(actionKey, newQ);
    }

    // Get optimal action for state
    async getOptimalAction(state) {
        const actions = this.getActions(state);
        
        // Exploration: Random action
        if (Math.random() < this.explorationRate) {
            return actions[Math.floor(Math.random() * actions.length)];
        }
        
        // Exploitation: Best action
        let bestAction = null;
        let bestValue = -Infinity;
        
        for (const action of actions) {
            const value = this.getQValue(state, action);
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        }
        
        return bestAction;
    }

    // Helper methods
    determineKnowledgeLevel(assessmentScores) {
        const avgScore = assessmentScores.reduce((a, b) => a + b, 0) / assessmentScores.length;
        
        if (avgScore < 0.4) return StateSpace.KNOWLEDGE_LEVELS.BEGINNER;
        if (avgScore < 0.7) return StateSpace.KNOWLEDGE_LEVELS.INTERMEDIATE;
        return StateSpace.KNOWLEDGE_LEVELS.ADVANCED;
    }

    determinePerformanceLevel(recentPerformance) {
        const avgPerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
        
        if (avgPerformance < 0.3) return StateSpace.PERFORMANCE_LEVELS.LOW;
        if (avgPerformance < 0.7) return StateSpace.PERFORMANCE_LEVELS.MEDIUM;
        return StateSpace.PERFORMANCE_LEVELS.HIGH;
    }

    determineStressLevel(biometrics) {
        const { heartRate, galvanicSkinResponse, eyeMovement } = biometrics;
        
        // Implement stress level determination based on biometric data
        // This is a simplified example
        const stressScore = (
            this.normalizeHeartRate(heartRate) +
            this.normalizeGSR(galvanicSkinResponse) +
            this.normalizeEyeMovement(eyeMovement)
        ) / 3;

        if (stressScore < 0.4) return StateSpace.STRESS_LEVELS.NORMAL;
        if (stressScore < 0.7) return StateSpace.STRESS_LEVELS.ELEVATED;
        return StateSpace.STRESS_LEVELS.HIGH;
    }

    // Normalization helpers
    normalizeHeartRate(hr) {
        // Normalize heart rate to 0-1 range
        const minHR = 60;
        const maxHR = 120;
        return Math.max(0, Math.min(1, (hr - minHR) / (maxHR - minHR)));
    }

    normalizeGSR(gsr) {
        // Normalize galvanic skin response
        const minGSR = 0;
        const maxGSR = 100;
        return (gsr - minGSR) / (maxGSR - minGSR);
    }

    normalizeEyeMovement(em) {
        // Normalize eye movement metrics
        return em.focusScore; // Assuming normalized value
    }

    // Key generation for Q-table
    getStateKey(state) {
        return `${state.knowledgeLevel}|${state.performanceLevel}|${state.stressLevel}`;
    }

    getActionKey(action) {
        return `${action.difficulty}|${action.contentType}|${action.supportLevel}`;
    }
}

module.exports = SpaceTrainingRL;