const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSessionSchema = new Schema({
  group: {
    type: Schema.Types.ObjectId,
    ref: 'StudyGroup',
    required: true
  },
  type: {
    type: String,
    enum: ['study', 'practice', 'assessment', 'mission'],
    required: true
  },
  participants: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'completed'],
      default: 'active'
    },
    progress: Number,
    performance: {
      accuracy: Number,
      completionTime: Number,
      score: Number
    }
  }],
  module: {
    type: Schema.Types.ObjectId,
    ref: 'Module',
    required: true
  },
  videos: [{
    type: Schema.Types.ObjectId,
    ref: 'Video'
  }],
  aiGuidance: {
    recommendations: [String],
    adaptations: [String],
    performanceAnalysis: Schema.Types.Mixed
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  status: {
    type: String,
    enum: ['scheduled', 'active', 'completed', 'cancelled'],
    default: 'scheduled'
  }
}, {
  timestamps: true
});

/**
 * Returns a summary of the group session.
 * @returns {Object} Summary including group ID, session type, status, and start time.
 */
groupSessionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    group: this.group,
    type: this.type,
    status: this.status,
    startTime: this.startTime,
    endTime: this.endTime
  };
};

/**
 * Applies AI guidance to the session.
 * This is a placeholder function for integrating with an AI service.
 * @returns {Promise<Object>} Updated AI guidance data.
 */
groupSessionSchema.methods.applyAIGuidance = async function() {
  try {
    // Replace this with your actual AI service call:
    const aiResult = {
      recommendations: ['Focus on collaboration', 'Enhance communication'],
      adaptations: ['Adjust session pace', 'Modify task difficulty'],
      performanceAnalysis: { overallScore: 85 }
    };

    // Update the aiGuidance field and save the document
    this.aiGuidance = aiResult;
    await this.save();
    return aiResult;
  } catch (error) {
    console.error('Error applying AI guidance:', error);
    throw error;
  }
};

// Prevent OverwriteModelError by conditionally exporting the model
module.exports = mongoose.models.GroupSession 
  ? mongoose.models.GroupSession 
  : mongoose.model('GroupSession', groupSessionSchema);
