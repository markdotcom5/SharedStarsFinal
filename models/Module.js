const mongoose = require('mongoose');
const { OpenAI } = require("openai");
const Schema = mongoose.Schema;

// ✅ OpenAI Configuration with Robust Error Handling
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    console.error('❌ OpenAI Initialization Error:', error.message);
}

// ✅ Prevent `OverwriteModelError`
const moduleSchema = new Schema({
    moduleId: { type: String, required: true, unique: true, trim: true },
    title: String,
    type: String,
    category: String,
    difficulty: String,

    // ✅ Corrected `content` section
    content: {
        theory: [{
            title: { type: String, required: true },
            description: String,
            videoId: { type: Schema.Types.ObjectId, ref: 'Video' },
            resources: [String],
            order: { type: Number, default: 0 }
        }],
        practice: [{
            practiceType: {
                type: String,
                enum: ['individual', 'group', 'simulation'],
                required: true
            },
            description: String,
            duration: { type: Number, min: 0 },
            requirements: [String],
            difficulty: { 
                type: String, 
                enum: ['beginner', 'intermediate', 'advanced', 'expert']
            }
        }],
        assessment: {
            criteria: [String],
            passingScore: { type: Number, min: 0, max: 100, required: true, default: 70 }
        }
    },
// Add phase-specific structure
trainingPhase: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4, 5],
    validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not a valid phase number'
    }
},
phaseDetails: {
    name: {
        type: String,
        enum: [
            'Home-Based Training',
            'AR/VR Simulations',
            'Team Training',
            'HQ Training',
            'Final Certification'
        ]
    },
    location: {
        type: String,
        enum: ['remote', 'vr', 'team', 'hq', 'certification'],
        required: true
    },
    deliveryMethod: {
        type: String,
        enum: ['self-paced', 'instructor-led', 'ai-guided', 'team-based', 'hybrid'],
        required: true
    }
},

// Enhanced content structure
content: {
    theory: [{
        title: { type: String, required: true },
        description: String,
        videoId: { type: Schema.Types.ObjectId, ref: 'Video' },
        resources: [String],
        order: { type: Number, default: 0 }
    }],
    practice: [{
        practiceType: {
            type: String,
            enum: ['individual', 'group', 'simulation'],
            required: true
        },
        description: String,
        duration: { type: Number, min: 0 },
        requirements: [String],
        difficulty: { 
            type: String, 
            enum: ['beginner', 'intermediate', 'advanced', 'expert']
        }
    }],
    assessment: {
        criteria: [String],
        passingScore: { type: Number, min: 0, max: 100, required: true, default: 70 }
    }
},

// Phase-specific requirements
requirements: {
    physical: {
        endurance: {
            type: String,
            required: function() { return this.category === 'physical'; }
        },
        strength: String,
        flexibility: String
    },
    technical: {
        knowledge: [String],
        skills: [String],
        tools: [String]
    },
    equipment: {
        required: [String],
        optional: [String]
    },
    prerequisites: [{
        moduleId: { type: String, ref: 'Module' },
        minimumScore: { type: Number, min: 0, max: 100 }
    }]
},
    // ✅ AI Guidance Enhancements
    aiGuidance: {
        adaptiveDifficulty: Boolean,
        recommendedPath: [String],
        personalizedTips: [String],
        groupSuggestions: [String],
        lastUpdated: { type: Date, default: Date.now }
    },

    // ✅ Tracking Training Progress
    progressTracking: {
        requiredAttempts: { type: Number, default: 1, min: 1 },
        mastery: { type: Number, min: 0, max: 100, default: 0 },
        sessionProgress: [{
            sessionId: { type: String, required: true },
            completions: { type: Number, default: 0, min: 0 },
            bestScore: { type: Number, min: 0, max: 100 },
            lastAttempted: Date,
            attemptsRemaining: Number
        }]
    },

    // ✅ User Feedback & Performance Metrics
    metrics: {
        completionRate: { type: Number, default: 0, min: 0, max: 100 },
        averageScore: { type: Number, min: 0, max: 100 },
        difficultyRating: { type: Number, min: 1, max: 10 },
        userFeedback: [{
            rating: { type: Number, required: true, min: 1, max: 5 },
            comment: String,
            userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
            date: { type: Date, default: Date.now }
        }],
        activeUsers: { type: Number, default: 0, min: 0 },
        successRate: { type: Number, default: 0, min: 0, max: 100 }
    }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// ✅ AI-Powered Module Recommendation
moduleSchema.methods.generateRecommendation = async function(userProfile) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: "You are an AI space training advisor providing personalized module recommendations."
                },
                {
                    role: "user",
                    content: `Analyze this user profile and provide a detailed recommendation for this module: ${JSON.stringify(userProfile)}`
                }
            ],
            max_tokens: 500
        });

        return {
            recommendation: response.choices[0]?.message?.content?.trim() || "No AI recommendation available.",
            moduleId: this._id,
            moduleTitle: this.title,
            generatedAt: new Date()
        };
    } catch (error) {
        console.error("❌ AI Recommendation Generation Error:", error.message);
        throw new Error("Failed to generate module recommendation");
    }
};

// ✅ Time Completion Calculation Method
moduleSchema.methods.calculateTimeToCompletion = function(userProfile) {
    if (!this.trainingStructure?.duration) {
        return null; // Prevents crashes if duration is missing
    }

    const baseTime = this.trainingStructure.duration.minimumCompletionTime || 0;
    const maxTime = this.trainingStructure.duration.maximumCompletionTime || baseTime * 2;

    let estimatedTime = baseTime;

    if (userProfile?.skillLevel && this.difficulty) {
        const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
        const userLevelIndex = difficultyLevels.indexOf(userProfile.skillLevel);
        const moduleLevelIndex = difficultyLevels.indexOf(this.difficulty);

        if (userLevelIndex < moduleLevelIndex) {
            estimatedTime *= 1.5; // Increase time if user is below module level
        }
    }

    if (userProfile?.completedModules?.length > 0) {
        estimatedTime *= 0.9; // Reduce time for experienced users
    }

    return Math.min(estimatedTime, maxTime);
};

// ✅ Static Methods for Discovery
moduleSchema.statics.getRecommendedModules = async function(userProfile, options = {}) {
    const { limit = 5, category } = options;

    const query = category
        ? { category, difficulty: { $lte: userProfile.skillLevel } }
        : { difficulty: { $lte: userProfile.skillLevel } };

    return this.find(query)
        .sort({ 'metrics.averageScore': -1 })
        .limit(limit)
        .exec();
};

// ✅ Add indexes for better query performance
moduleSchema.index({ category: 1, difficulty: 1 });
moduleSchema.index({ 'metrics.averageScore': -1 });
moduleSchema.index({ status: 1 });

// ✅ Remove duplicate index warning
const existingIndexes = moduleSchema.indexes();
if (!existingIndexes.some(index => JSON.stringify(index[0]) === JSON.stringify({ moduleId: 1 }))) {
    moduleSchema.index({ moduleId: 1 }, { unique: true }); // ✅ Keep unique constraint here ONLY if not already defined
}

// ✅ Validation Middleware
moduleSchema.pre('save', function(next) {
    if (this.prerequisites?.length > 5) {
        return next(new Error('Maximum of 5 prerequisites allowed'));
    }
    this.aiGuidance.lastUpdated = new Date();
    next();
});

// ✅ Virtual for completion status
moduleSchema.virtual('isComplete').get(function() {
    return this.progressTracking?.mastery >= 100;
});

// ✅ Additional virtuals for common calculations
moduleSchema.virtual('totalCreditsPossible').get(function() {
    return (this.creditSystem?.totalCredits || 0) +
           (this.creditSystem?.creditDistribution?.bonusActivities || 0);
});

// ✅ Model creation
module.exports = mongoose.models.Module || mongoose.model("Module", moduleSchema);
