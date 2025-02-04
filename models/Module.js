const mongoose = require('mongoose');
const { OpenAI } = require('openai');
const Schema = mongoose.Schema;

// OpenAI Configuration with robust error handling
let openai;
try {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });
} catch (error) {
    console.error('OpenAI Initialization Error:', error.message);
}

const moduleSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Module title is required'],
        trim: true,
        minlength: [3, 'Title must be at least 3 characters'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },
    type: {
        type: String,
        enum: ['training', 'simulation', 'assessment', 'mission'],
        required: true
    },
    category: {
        type: String,
        enum: ['technical', 'physical', 'psychological', 'teamwork', 'emergency', 'space-exploration'],
        required: true
    },
    difficulty: {
        type: String,
        enum: ['beginner', 'intermediate', 'advanced', 'expert'],
        required: true
    },
    prerequisites: [{
        module: {
            type: Schema.Types.ObjectId,
            ref: 'Module'
        },
        minimumScore: Number
    }],
    content: {
        theory: [{
            title: String,
            description: String,
            videoId: {
                type: Schema.Types.ObjectId,
                ref: 'Video'
            },
            resources: [String]
        }],
        practice: [{
            type: {
                type: String,
                enum: ['individual', 'group', 'simulation']
            },
            description: String,
            duration: Number,
            requirements: [String]
        }],
        assessment: {
            criteria: [String],
            passingScore: Number
        }
    },
    aiGuidance: {
        adaptiveDifficulty: Boolean,
        recommendedPath: [String],
        personalizedTips: [String],
        groupSuggestions: [String]
    },
    metrics: {
        completionRate: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        averageScore: Number,
        difficultyRating: Number,
        userFeedback: [{
            rating: Number,
            comment: String,
            userId: {
                type: Schema.Types.ObjectId,
                ref: 'User'
            }
        }]
    }
}, { 
    timestamps: true 
});

// Enhanced Methods
moduleSchema.methods.generateAIContent = async function(prompt) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system", 
                    content: "You are an AI space training coach creating module content."
                },
                {
                    role: "user", 
                    content: `Generate detailed guidance for a space training module about: ${prompt}`
                }
            ],
            max_tokens: 300
        });

        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("AI Content Generation Error:", error.message);
        throw new Error("Failed to generate AI content");
    }
};

// Recommendation Method
moduleSchema.methods.generateRecommendation = async function(userProfile) {
    if (!openai) {
        throw new Error('OpenAI not initialized');
    }

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
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
            max_tokens: 250
        });

        return {
            recommendation: response.choices[0].message.content.trim(),
            moduleId: this._id,
            moduleTitle: this.title
        };
    } catch (error) {
        console.error("AI Recommendation Generation Error:", error.message);
        throw new Error("Failed to generate module recommendation");
    }
};

// Static Methods for Discovery
moduleSchema.statics.getRecommendedModules = async function(userProfile, options = {}) {
    const { limit = 5, category } = options;
    
    const query = category 
        ? { category, difficulty: { $lte: userProfile.skillLevel } }
        : { difficulty: { $lte: userProfile.skillLevel } };

    return this.find(query)
        .sort({ 'metrics.averageScore': -1 }) // Sort by the highest average score
        .limit(limit);
};

// Validation Middleware
moduleSchema.pre('save', function(next) {
    if (this.prerequisites && this.prerequisites.length > 5) {
        return next(new Error('Maximum of 5 prerequisites allowed'));
    }
    next();
});

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module;
