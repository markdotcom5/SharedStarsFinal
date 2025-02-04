const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { OpenAI } = require('openai');

// OpenAI Configuration
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
} catch (error) {
  console.error('OpenAI Initialization Error:', error.message);
}

const challengeSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Challenge description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    type: {
      type: String,
      enum: {
        values: ['individual', 'team', 'global'],
        message: '{VALUE} is not a valid challenge type'
      },
      required: true
    },
    difficulty: {
      type: String,
      enum: {
        values: ['beginner', 'intermediate', 'advanced', 'expert'],
        message: '{VALUE} is not a valid difficulty level'
      },
      required: true
    },
    participants: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: function () {
            return this.type !== 'team';
          }
        },
        team: {
          type: Schema.Types.ObjectId,
          ref: 'StudyGroup',
          required: function () {
            return this.type === 'team';
          }
        },
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100
        },
        score: {
          type: Number,
          default: 0,
          min: 0
        },
        completedAt: Date,
        status: {
          type: String,
          enum: ['not_started', 'in_progress', 'completed'],
          default: 'not_started'
        }
      }
    ],
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Module'
      }
    ],
    objectives: [
      {
        description: {
          type: String,
          required: true,
          trim: true
        },
        points: {
          type: Number,
          default: 0,
          min: 0
        },
        type: {
          type: String,
          enum: ['performance', 'skill', 'completion']
        }
      }
    ],
    rewards: [
      {
        type: {
          type: String,
          enum: ['achievement', 'certification', 'points', 'badge']
        },
        points: {
          type: Number,
          default: 0,
          min: 0
        },
        achievementId: {
          type: Schema.Types.ObjectId,
          ref: 'Achievement'
        },
        certificationId: {
          type: Schema.Types.ObjectId,
          ref: 'Certification'
        },
        description: String
      }
    ],
    leaderboard: {
      type: Schema.Types.ObjectId,
      ref: 'Leaderboard'
    },
    startDate: {
      type: Date,
      required: [true, 'Challenge start date is required'],
      validate: {
        validator: function (v) {
          return v > new Date();
        },
        message: 'Start date must be in the future'
      }
    },
    endDate: {
      type: Date,
      required: [true, 'Challenge end date is required'],
      validate: {
        validator: function (v) {
          return this.startDate && v > this.startDate;
        },
        message: 'End date must be after start date'
      }
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'completed'],
      default: 'upcoming'
    },
    aiInsights: {
      recommendedStrategy: String,
      potentialChallenges: [String],
      successPrediction: Number
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for challenge duration in days
challengeSchema.virtual('duration').get(function () {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24)); // days
});

// Method to generate AI insights
challengeSchema.methods.generateAIInsights = async function () {
  if (!openai) {
    throw new Error('OpenAI not initialized');
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an AI challenge strategy advisor providing insights for space training challenges."
        },
        {
          role: "user",
          content: `Analyze this challenge: ${JSON.stringify({
            title: this.title,
            type: this.type,
            difficulty: this.difficulty,
            objectives: this.objectives
          })}`
        }
      ],
      max_tokens: 300
    });

    // Enhance the return by safely extracting the content and providing fallback values.
    const recommendedStrategy =
      response?.choices?.[0]?.message?.content?.trim() ||
      "No strategy available";
    
    this.aiInsights = {
      recommendedStrategy,
      potentialChallenges: ['Technical complexity', 'Team coordination'],
      successPrediction: Math.floor(Math.random() * 100)
    };

    // Return the updated insights for convenience
    return this.aiInsights;
  } catch (error) {
    console.error("AI Insights Generation Error:", error);
    throw new Error("Failed to generate challenge insights");
  }
};

// Static method to find active challenges
challengeSchema.statics.findActiveChallenges = function () {
  const now = new Date();
  return this.find({
    startDate: { $lte: now },
    endDate: { $gte: now },
    status: 'active'
  });
};

// Middleware to update status based on dates before saving
challengeSchema.pre('save', function (next) {
  const now = new Date();

  if (this.startDate <= now && this.endDate >= now) {
    this.status = 'active';
  } else if (this.endDate < now) {
    this.status = 'completed';
  }

  next();
});

// Prevent OverwriteModelError: If the model already exists, use it.
const Challenge = mongoose.models.Challenge
  ? mongoose.models.Challenge
  : mongoose.model('Challenge', challengeSchema);

module.exports = Challenge;
