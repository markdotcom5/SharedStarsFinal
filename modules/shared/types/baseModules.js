const baseModuleStructure = {
    id: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['physical', 'technical', 'simulation', 'zero-g', 'mission-ops', 'leadership'],
        required: true
    },
    objectives: [String],
    duration: {
        weeks: Number,
        hoursPerWeek: Number
    },
    certification: {
        name: String,
        requirements: [String],
        creditValue: Number
    }
};

module.exports = baseModuleStructure;
