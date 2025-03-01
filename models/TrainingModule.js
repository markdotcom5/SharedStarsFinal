const mongoose = require("mongoose");

const trainingModuleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  difficultyLevel: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  missions: [
    {
      missionId: String,
      name: String,
      status: { type: String, enum: ["locked", "in_progress", "completed"], default: "locked" },
      progress: { type: Number, default: 0 }, // Percentage completion
    }
  ],
  requirements: [String], // Pre-requisites for the module
  certificationIssued: { type: Boolean, default: false },
});

module.exports = mongoose.model("TrainingModule", trainingModuleSchema);
