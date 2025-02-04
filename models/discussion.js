const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const discussionSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'mission', 'certification', 'help'],
    required: true
  },
  relatedTo: {
    module: {
      type: Schema.Types.ObjectId,
      ref: 'Module'
    },
    certification: {
      type: Schema.Types.ObjectId,
      ref: 'Certification'
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'Video'
    }
  },
  tags: [String],
  likes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    date: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    likes: Number,
    isPinned: Boolean,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  aiModeration: {
    topicAnalysis: Schema.Types.Mixed,
    suggestedExperts: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    relatedResources: [String]
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'archived'],
    default: 'active'
  }
}, {
  timestamps: true
});

/**
 * Returns a summary of the discussion.
 * @returns {Object} Summary including title, author, category, and status.
 */
discussionSchema.methods.getSummary = function() {
  return {
    id: this._id,
    title: this.title,
    author: this.author,
    category: this.category,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Applies AI moderation to the discussion.
 * This is a placeholder method—integrate your AI moderation service logic here.
 * @returns {Promise<Object>} Updated AI moderation data.
 */
discussionSchema.methods.applyAIModeration = async function() {
  try {
    // Example: Replace the following code with a call to your AI moderation service.
    // For example: const aiResult = await aiModerationService.analyzeContent(this.content);
    const aiResult = {
      topicAnalysis: `Analysis for discussion: ${this.title}`,
      suggestedExperts: [],
      relatedResources: ['Resource1', 'Resource2']
    };
    
    // Update the aiModeration field and save the document
    this.aiModeration = aiResult;
    await this.save();
    return aiResult;
  } catch (error) {
    console.error('Error applying AI moderation:', error);
    throw error;
  }
};

// Prevent OverwriteModelError by checking if the model already exists.
module.exports = mongoose.models.Discussion
  ? mongoose.models.Discussion
  : mongoose.model('Discussion', discussionSchema);
