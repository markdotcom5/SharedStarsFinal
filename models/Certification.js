const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const AIController = require("../controllers/AIController");

const certificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    description: { type: String },
    level: { 
      type: String, 
      enum: ["beginner", "intermediate", "advanced", "expert"], 
      required: true
    },
    dateEarned: { type: Date, default: Date.now },
    // Optionally, if you plan to track progress for a certification, add a progress field.
    progress: {
      // This is optional. Remove if not needed.
      percentageComplete: { type: Number, default: 0 }
    },
    aiMetrics: {
      predictedCompletion: Date,
      recommendedPath: [String],
      improvementAreas: [String]
    },
    status: {
      type: String,
      enum: ["in_progress", "completed", "expired", "revoked"],
      default: "in_progress"
    }
  },
  { timestamps: true }
);

certificationSchema.methods.calculateAIMetrics = async function() {
  let aiAnalysis;
  try {
    aiAnalysis = await AIController.analyzeCertificationProgress({ certification: this });
  } catch (error) {
    console.error("Error during AI analysis:", error);
    aiAnalysis = null;
  }

  // If a progress field exists and percentageComplete is defined, use that logic.
  if (this.progress && typeof this.progress.percentageComplete === "number" && this.progress.percentageComplete > 0) {
    const remainingPercentage = 100 - this.progress.percentageComplete;
    // Calculate average days per percentage point since creation.
    const daysPerPercent = (new Date() - this.createdAt) / this.progress.percentageComplete;
    const predictedDays = remainingPercentage * daysPerPercent;
    this.aiMetrics.predictedCompletion = new Date(Date.now() + predictedDays);
  } else if (aiAnalysis && aiAnalysis.metrics && typeof aiAnalysis.metrics.completionRate === "number") {
    // Otherwise, if AI analysis is available, use its computed completion rate.
    this.aiMetrics.predictedCompletion = new Date(Date.now() + (100 - aiAnalysis.metrics.completionRate) * 86400000);
  } else {
    // Fallback: set predictedCompletion to a default value (e.g., one week from now)
    this.aiMetrics.predictedCompletion = new Date(Date.now() + 7 * 86400000);
  }

  // Save the updated certification
  await this.save();

  // Return the combined metrics
  return {
    predictedCompletion: this.aiMetrics.predictedCompletion,
    // Use improvement areas from AI analysis if available, otherwise an empty array.
    improvementAreas: (aiAnalysis && aiAnalysis.metrics && aiAnalysis.metrics.skillLevels) || []
  };
};

// Prevent OverwriteModelError by checking if the model already exists
module.exports = mongoose.models.Certification
  ? mongoose.models.Certification
  : mongoose.model("Certification", certificationSchema);
