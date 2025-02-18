const mongoose = require('mongoose');

const technicalTrainingSchema = new mongoose.Schema(
    {
        moduleId: { type: String, required: true, unique: true },
        moduleName: { type: String, required: true },
        objectives: [{ type: String, required: true }],
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced'],
            required: true,
        },
        durationWeeks: { type: Number, required: true },
        prerequisites: [{ type: String }],
        trainingFormats: [{ type: String }], // Solo, Meetup, Academy
        certification: {
            name: { type: String, required: true },
            requirements: [{ type: String, required: true }],
            creditValue: { type: Number, default: 1000 },
        },
    },
    { timestamps: true }
);

const TechnicalTraining = mongoose.model('TechnicalTraining', technicalTrainingSchema);
module.exports = TechnicalTraining;
