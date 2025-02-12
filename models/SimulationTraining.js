const mongoose = require('mongoose');

const simulationTrainingSchema = new mongoose.Schema({
  moduleId: { type: String, required: true, unique: true },
  moduleName: { type: String, required: true },
  objectives: [{ type: String, required: true }],
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true },
  durationWeeks: { type: Number, required: true },
  scenarios: [
    {
      name: { type: String, required: true },
      description: { type: String, required: true },
      keySkills: [{ type: String, required: true }],
      challenges: [{ type: String }]
    }
  ],
  trainingFormats: [{ type: String }], // Solo, Meetup, Academy
  certification: {
    name: { type: String, required: true },
    requirements: [{ type: String, required: true }],
    creditValue: { type: Number, default: 1500 }
  }
}, { timestamps: true });

const SimulationTraining = mongoose.model('SimulationTraining', simulationTrainingSchema, 'simulationtraining'); // ✅ Force correct collection
module.exports = SimulationTraining;
