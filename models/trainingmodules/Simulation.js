const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const simulationSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        scenarioId: { type: String, required: true },
        status: {
            type: String,
            enum: ['not-started', 'in-progress', 'completed'],
            default: 'not-started',
        },
        objectives: [
            {
                description: { type: String, required: true },
                completed: { type: Boolean, default: false },
                completionTime: { type: Date },
            },
        ],
        score: {
            accuracy: { type: Number, default: 0 },
            efficiency: { type: Number, default: 0 },
            overall: { type: Number, default: 0 },
        },
        startTime: { type: Date },
        endTime: { type: Date },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Simulation', simulationSchema);
