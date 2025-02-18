const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Schema = mongoose.Schema;

// OpenAI Configuration with robust error handling
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.error('OpenAI Initialization Error:', error.message);
}

// ✅ Fixed Schema Definition
const moduleSchema = new Schema(
    {
        moduleId: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Module title is required'],
            trim: true,
            minlength: [3, 'Title must be at least 3 characters long'],
            maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        type: {
            type: String,
            enum: ['training', 'simulation', 'assessment', 'mission'],
            required: [true, 'Module type is required'],
        },
        category: {
            // ✅ Added 'eva' to enum
            type: String,
            enum: [
                'technical',
                'physical',
                'psychological',
                'teamwork',
                'emergency',
                'space-exploration',
                'eva', // ✅ Fixed category validation issue
            ],
            required: true,
        },
        difficulty: {
            type: String,
            enum: ['beginner', 'intermediate', 'advanced', 'expert'],
            required: true,
        },
        prerequisites: [
            {
                // ✅ Fixed prerequisites issue (must be an object)
                module: {
                    type: Schema.Types.ObjectId,
                    ref: 'Module',
                    required: true,
                },
                minimumScore: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
            },
        ],
        status: {
            type: String,
            enum: ['draft', 'active', 'archived', 'deprecated'],
            default: 'draft',
        },
        version: {
            type: String,
            default: '1.0.0',
        },
        prerequisites: [
            {
                module: {
                    type: Schema.Types.ObjectId,
                    ref: 'Module',
                    required: true, // ✅ Ensures valid reference
                },
                minimumScore: {
                    type: Number,
                    min: 0,
                    max: 100,
                },
            },
        ],
        // ✅ Correctly closed array

        // ✅ Fixing `content` section
        content: {
            theory: [
                {
                    title: {
                        type: String,
                        required: true,
                    },
                    description: String,
                    videoId: {
                        type: Schema.Types.ObjectId,
                        ref: 'Video',
                    },
                    resources: [String],
                    order: {
                        type: Number,
                        default: 0,
                    },
                },
            ],
            practice: [
                {
                    practiceType: {
                        // ✅ Fixed naming to avoid conflict with `type`
                        type: String,
                        enum: ['individual', 'group', 'simulation'],
                        required: true,
                    },
                    description: String,
                    duration: {
                        type: Number,
                        min: 0,
                    },
                    requirements: [String],
                    difficulty: {
                        type: String,
                        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
                    },
                },
            ],
            assessment: {
                criteria: [String],
                passingScore: {
                    type: Number,
                    min: 0,
                    max: 100,
                    required: true,
                    default: 70,
                },
            },
        },
        aiGuidance: {
            adaptiveDifficulty: Boolean,
            recommendedPath: [String],
            personalizedTips: [String],
            groupSuggestions: [String],
            lastUpdated: {
                type: Date,
                default: Date.now,
            },
        },
        trainingStructure: {
            duration: {
                weeks: {
                    type: Number,
                    required: true,
                    min: 1,
                },
                minimumCompletionTime: Number,
                maximumCompletionTime: Number,
                recommendedPace: String,
            },
            progression: {
                milestones: [
                    {
                        name: String,
                        description: String,
                        requirementType: {
                            type: String,
                            enum: ['completion', 'score', 'time'],
                        },
                        threshold: Number,
                    },
                ],
                unlocks: [
                    {
                        moduleId: {
                            type: Schema.Types.ObjectId,
                            ref: 'Module',
                        },
                        requirementType: {
                            type: String,
                            enum: ['completion', 'score', 'time'],
                        },
                        requirement: Number,
                    },
                ],
            },
            sessions: [
                {
                    id: {
                        type: String,
                        required: true,
                    },
                    name: {
                        type: String,
                        required: true,
                    },
                    duration: Number,
                    weekRequired: Number,
                    minimumCompletions: {
                        type: Number,
                        default: 1,
                    },
                    exercises: [
                        {
                            name: {
                                type: String,
                                required: true,
                            },
                            sets: Number,
                            duration: Number,
                            description: String,
                            successCriteria: String,
                            progressionMetrics: [String],
                            equipment: [String],
                            safetyGuidelines: [String],
                        },
                    ],
                    credits: {
                        type: Number,
                        default: 0,
                    },
                    maxAttempts: {
                        type: Number,
                        default: 3,
                    },
                },
            ],
            certificationRequirements: {
                minimumSessionCompletions: {
                    type: Number,
                    required: true,
                },
                minimumSuccessRate: {
                    type: Number,
                    min: 0,
                    max: 100,
                    required: true,
                },
                timeRequirements: {
                    minimumWeeks: Number,
                    maximumWeeks: Number,
                },
                mandatoryMilestones: [String],
                expirationPeriod: {
                    type: Number,
                    default: 365,
                },
            },
        },
        creditSystem: {
            totalCredits: {
                type: Number,
                default: 0,
                min: 0,
            },
            creditDistribution: {
                attendance: {
                    type: Number,
                    default: 0,
                },
                performance: {
                    type: Number,
                    default: 0,
                },
                completion: {
                    type: Number,
                    default: 0,
                },
                bonusActivities: {
                    type: Number,
                    default: 0,
                },
            },
            milestoneBonus: [
                {
                    milestoneName: {
                        type: String,
                        required: true,
                    },
                    creditValue: {
                        type: Number,
                        required: true,
                        min: 0,
                    },
                    criteria: String,
                },
            ],
        },
        progressTracking: {
            requiredAttempts: {
                type: Number,
                default: 1,
                min: 1,
            },
            mastery: {
                type: Number,
                min: 0,
                max: 100,
                default: 0,
            },
            sessionProgress: [
                {
                    sessionId: {
                        type: String,
                        required: true,
                    },
                    completions: {
                        type: Number,
                        default: 0,
                        min: 0,
                    },
                    bestScore: {
                        type: Number,
                        min: 0,
                        max: 100,
                    },
                    lastAttempted: Date,
                    attemptsRemaining: Number,
                },
            ],
        },
        metrics: {
            completionRate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
            averageScore: {
                type: Number,
                min: 0,
                max: 100,
            },
            difficultyRating: {
                type: Number,
                min: 1,
                max: 10,
            },
            userFeedback: [
                {
                    rating: {
                        type: Number,
                        required: true,
                        min: 1,
                        max: 5,
                    },
                    comment: String,
                    userId: {
                        type: Schema.Types.ObjectId,
                        ref: 'User',
                        required: true,
                    },
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            activeUsers: {
                type: Number,
                default: 0,
                min: 0,
            },
            successRate: {
                type: Number,
                default: 0,
                min: 0,
                max: 100,
            },
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Enhanced Methods
// ✅ Enhanced Methods
moduleSchema.methods.generateAIContent = async function (prompt) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: 'You are an AI space training coach creating module content.',
                },
                {
                    role: 'user',
                    content: `Generate detailed guidance for a space training module about: ${prompt}`,
                },
            ],
            max_tokens: 500,
        });

        return response.choices[0]?.message?.content?.trim() || 'No AI content generated.';
    } catch (error) {
        console.error('❌ AI Content Generation Error:', error.message);
        throw new Error('Failed to generate AI content');
    }
};

// ✅ AI-Powered Module Recommendation
moduleSchema.methods.generateRecommendation = async function (userProfile) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content:
                        'You are an AI space training advisor providing personalized module recommendations.',
                },
                {
                    role: 'user',
                    content: `Analyze this user profile and provide a detailed recommendation for this module: ${JSON.stringify(userProfile)}`,
                },
            ],
            max_tokens: 500,
        });

        return {
            recommendation:
                response.choices[0]?.message?.content?.trim() || 'No AI recommendation available.',
            moduleId: this._id,
            moduleTitle: this.title,
            generatedAt: new Date(),
        };
    } catch (error) {
        console.error('❌ AI Recommendation Generation Error:', error.message);
        throw new Error('Failed to generate module recommendation');
    }
};

// ✅ Time Completion Calculation Method
moduleSchema.methods.calculateTimeToCompletion = function (userProfile) {
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
moduleSchema.statics.getRecommendedModules = async function (userProfile, options = {}) {
    const { limit = 5, category } = options;

    const query = category
        ? { category, difficulty: { $lte: userProfile.skillLevel } }
        : { difficulty: { $lte: userProfile.skillLevel } };

    return this.find(query).sort({ 'metrics.averageScore': -1 }).limit(limit).exec();
};

// ✅ Add indexes for better query performance
moduleSchema.index({ category: 1, difficulty: 1 });
moduleSchema.index({ 'metrics.averageScore': -1 });
moduleSchema.index({ status: 1 });

// ✅ Remove duplicate index warning
const existingIndexes = moduleSchema.indexes();
if (
    !existingIndexes.some((index) => JSON.stringify(index[0]) === JSON.stringify({ moduleId: 1 }))
) {
    moduleSchema.index({ moduleId: 1 }, { unique: true }); // ✅ Keep unique constraint here ONLY if not already defined
}

// ✅ Validation Middleware
moduleSchema.pre('save', function (next) {
    if (this.prerequisites?.length > 5) {
        return next(new Error('Maximum of 5 prerequisites allowed'));
    }
    this.aiGuidance.lastUpdated = new Date();
    next();
});

// ✅ Virtual for completion status
moduleSchema.virtual('isComplete').get(function () {
    return this.progressTracking?.mastery >= 100;
});

// ✅ Additional virtuals for common calculations
moduleSchema.virtual('totalCreditsPossible').get(function () {
    return (
        (this.creditSystem?.totalCredits || 0) +
        (this.creditSystem?.creditDistribution?.bonusActivities || 0)
    );
});

// ✅ Model creation
const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
