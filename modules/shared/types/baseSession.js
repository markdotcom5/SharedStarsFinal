const baseSessionStructure = {
    id: {
        type: String,
        required: true,
        unique: true,
    },
    moduleId: {
        type: String,
        required: true,
        ref: 'Module',
    },
    type: {
        type: String,
        enum: ['training', 'assessment', 'practice', 'theory'],
        required: true,
    },
    metrics: {
        type: {
            completion: { type: Number, min: 0, max: 100, default: 0 },
            performance: { type: Number, min: 0, max: 100, default: 0 },
            timeSpent: Number,
            attemptsUsed: Number,
        },
    },
    credits: {
        earned: Number,
        available: Number,
        breakdown: Map,
    },
};

module.exports = baseSessionStructure;
