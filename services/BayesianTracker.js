const mongoose = require('mongoose');

// Schema for storing knowledge states
const knowledgeStateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleId: {
        type: String,
        required: true
    },
    skillStates: {
        type: Map,
        of: {
            knownProbability: Number,
            lastUpdated: Date,
            attempts: Number,
            successes: Number
        }
    },
    metadata: {
        lastActivity: Date,
        totalAttempts: Number,
        averagePerformance: Number
    }
}, { timestamps: true });

const KnowledgeState = mongoose.model('KnowledgeState', knowledgeStateSchema);

class BayesianTracker {
    constructor() {
        // Initial probability parameters
        this.params = {
            pLearn: 0.2,      // Probability of learning after an attempt
            pGuess: 0.25,     // Probability of correct guess when unknown
            pSlip: 0.1,       // Probability of incorrect when known
            pForget: 0.05     // Probability of forgetting over time
        };

        // Skill categories for EVA operations
        this.skillCategories = {
            zero_g_adaptation: {
                name: 'Zero-G Adaptation',
                threshold: 0.8,
                prerequisiteFor: ['suit_operations', 'tool_handling']
            },
            suit_operations: {
                name: 'Suit Operations',
                threshold: 0.85,
                prerequisiteFor: ['emergency_procedures']
            },
            tool_handling: {
                name: 'Tool Handling',
                threshold: 0.75,
                prerequisiteFor: ['repair_operations']
            },
            emergency_procedures: {
                name: 'Emergency Procedures',
                threshold: 0.9,
                prerequisiteFor: []
            },
            repair_operations: {
                name: 'Repair Operations',
                threshold: 0.8,
                prerequisiteFor: []
            }
        };

        console.log("✅ Bayesian Tracker Initialized");
    }

    async updateKnowledgeState(userId, moduleId, successRate) {
        try {
            console.log(`📊 Updating knowledge state for ${userId} in ${moduleId}`);
            
            let state = await KnowledgeState.findOne({ userId, moduleId });
            if (!state) {
                state = new KnowledgeState({
                    userId,
                    moduleId,
                    skillStates: new Map(),
                    metadata: {
                        lastActivity: new Date(),
                        totalAttempts: 0,
                        averagePerformance: 0
                    }
                });
            }

            // Update skill states
            for (const [skillName, skillConfig] of Object.entries(this.skillCategories)) {
                const currentSkillState = state.skillStates.get(skillName) || {
                    knownProbability: 0.5,
                    lastUpdated: new Date(),
                    attempts: 0,
                    successes: 0
                };

                // Apply Bayesian update
                const pSuccess = successRate / 100;
                const pPrior = currentSkillState.knownProbability;
                const pLikelihood = pSuccess ? this.params.pGuess : (1 - this.params.pSlip);
                
                const pPosterior = (pLikelihood * pPrior) / 
                    (pLikelihood * pPrior + (1 - pLikelihood) * (1 - pPrior));

                // Apply learning and forgetting
                const timeSinceLastUpdate = (new Date() - currentSkillState.lastUpdated) / (1000 * 60 * 60 * 24); // days
                const forgettingFactor = Math.exp(-this.params.pForget * timeSinceLastUpdate);
                
                currentSkillState.knownProbability = pPosterior * forgettingFactor;
                currentSkillState.attempts += 1;
                currentSkillState.successes += pSuccess ? 1 : 0;
                currentSkillState.lastUpdated = new Date();

                state.skillStates.set(skillName, currentSkillState);
            }

            // Update metadata
            state.metadata.lastActivity = new Date();
            state.metadata.totalAttempts += 1;
            state.metadata.averagePerformance = (
                state.metadata.averagePerformance * (state.metadata.totalAttempts - 1) + 
                successRate
            ) / state.metadata.totalAttempts;

            await state.save();
            return state;
        } catch (error) {
            console.error('Error updating knowledge state:', error);
            throw error;
        }
    }

    async getSkillMastery(userId, moduleId) {
        try {
            console.log(`🔍 Fetching skill mastery for ${userId} in ${moduleId}`);
            const state = await KnowledgeState.findOne({ userId, moduleId });
            
            if (!state) return 0;

            // Calculate weighted average of skill probabilities
            let totalWeight = 0;
            let weightedSum = 0;

            for (const [skillName, skillConfig] of Object.entries(this.skillCategories)) {
                const skillState = state.skillStates.get(skillName);
                if (skillState) {
                    const weight = skillConfig.threshold;
                    weightedSum += skillState.knownProbability * weight;
                    totalWeight += weight;
                }
            }

            return (weightedSum / totalWeight) * 100;
        } catch (error) {
            console.error('Error getting skill mastery:', error);
            return 0;
        }
    }

    async identifyKnowledgeGaps(userId) {
        try {
            console.log(`🔍 Identifying knowledge gaps for ${userId}`);
            const states = await KnowledgeState.find({ userId });
            const gaps = [];

            for (const state of states) {
                for (const [skillName, skillConfig] of Object.entries(this.skillCategories)) {
                    const skillState = state.skillStates.get(skillName);
                    if (skillState) {
                        const currentProbability = skillState.knownProbability;
                        const threshold = skillConfig.threshold;

                        if (currentProbability < threshold) {
                            gaps.push({
                                skill: skillName,
                                currentLevel: this.getProficiencyLevel(currentProbability),
                                priority: this.calculatePriority(skillName, currentProbability, threshold)
                            });
                        }
                    }
                }
            }

            return gaps.sort((a, b) => 
                this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority)
            );
        } catch (error) {
            console.error('Error identifying knowledge gaps:', error);
            return [];
        }
    }

    getProficiencyLevel(probability) {
        if (probability < 0.3) return 'beginner';
        if (probability < 0.6) return 'intermediate';
        if (probability < 0.8) return 'advanced';
        return 'expert';
    }

    calculatePriority(skillName, currentProbability, threshold) {
        const gap = threshold - currentProbability;
        const skill = this.skillCategories[skillName];
        
        // Higher priority if skill is prerequisite for others
        const isPrerequisite = skill.prerequisiteFor.length > 0;
        
        if (gap > 0.5 && isPrerequisite) return 'critical';
        if (gap > 0.3 || isPrerequisite) return 'high';
        if (gap > 0.2) return 'medium';
        return 'low';
    }

    getPriorityWeight(priority) {
        const weights = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        return weights[priority] || 0;
    }
}

module.exports = new BayesianTracker();