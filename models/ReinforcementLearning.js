// models/ReinforcementLearning.js
const mongoose = require('mongoose');

const StateSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    moduleId: {
        type: String,
        required: true,
    },
    state: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },
    value: Number,
    visits: Number,
    lastUpdated: Date,
});

const ActionSchema = new mongoose.Schema({
    stateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
        required: true,
    },
    action: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
    },
    reward: Number,
    count: Number,
    qValue: Number,
});

const State = mongoose.model('State', StateSchema);
const Action = mongoose.model('Action', ActionSchema);

class ReinforcementLearning {
    constructor() {
        this.learningRate = 0.1;
        this.discountFactor = 0.9;
        this.explorationRate = 0.1;
    }

    async getState(userId, moduleId, stateData) {
        try {
            let state = await State.findOne({ userId, moduleId });
            if (!state) {
                state = new State({
                    userId,
                    moduleId,
                    state: new Map(Object.entries(stateData)),
                    value: 0,
                    visits: 0,
                    lastUpdated: new Date(),
                });
                await state.save();
            }
            return state;
        } catch (error) {
            console.error('Error getting state:', error);
            throw error;
        }
    }

    async updateState(stateId, reward) {
        try {
            const state = await State.findById(stateId);
            if (!state) throw new Error('State not found');

            state.value = (state.value * state.visits + reward) / (state.visits + 1);
            state.visits += 1;
            state.lastUpdated = new Date();

            await state.save();
            return state;
        } catch (error) {
            console.error('Error updating state:', error);
            throw error;
        }
    }

    async selectAction(stateId, availableActions) {
        try {
            // Exploration vs exploitation
            if (Math.random() < this.explorationRate) {
                return availableActions[Math.floor(Math.random() * availableActions.length)];
            }

            const actions = await Action.find({ stateId });
            if (!actions.length) {
                return availableActions[Math.floor(Math.random() * availableActions.length)];
            }

            return actions.reduce((best, current) =>
                current.qValue > best.qValue ? current : best
            ).action;
        } catch (error) {
            console.error('Error selecting action:', error);
            throw error;
        }
    }

    async updateAction(stateId, action, reward, nextStateId) {
        try {
            let actionDoc = await Action.findOne({ stateId, action });
            if (!actionDoc) {
                actionDoc = new Action({
                    stateId,
                    action: new Map(Object.entries(action)),
                    reward: 0,
                    count: 0,
                    qValue: 0,
                });
            }

            const nextState = await State.findById(nextStateId);
            const maxNextQ = nextState ? nextState.value : 0;

            // Q-learning update
            const newQValue =
                actionDoc.qValue +
                this.learningRate * (reward + this.discountFactor * maxNextQ - actionDoc.qValue);

            actionDoc.qValue = newQValue;
            actionDoc.count += 1;
            actionDoc.reward =
                (actionDoc.reward * (actionDoc.count - 1) + reward) / actionDoc.count;

            await actionDoc.save();
            return actionDoc;
        } catch (error) {
            console.error('Error updating action:', error);
            throw error;
        }
    }
}

module.exports = {
    ReinforcementLearning: new ReinforcementLearning(),
    State,
    Action,
};
