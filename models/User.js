const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
            minlength: 6,
        },
        achievements: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Achievement',
            },
        ],
        trainingModules: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Module',
            },
        ],
        trainingSessions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'TrainingSession',
            },
        ],
        progress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserProgress',
        },
        aiGuidance: {
            mode: {
                type: String,
                enum: ['manual', 'assist', 'full_guidance'],
                default: 'assist',
            },
            lastGuidance: {
                type: Date,
                default: Date.now,
            },
            preferences: {
                theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
                difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'] },
                notificationsEnabled: { type: Boolean, default: true },
            },
        },
        subscription: {
            type: {
                type: String,
                enum: ['individual', 'family', 'galactic', 'custom'],
                default: 'individual',
            },
            startDate: Date,
            endDate: Date,
            status: {
                type: String,
                enum: ['active', 'inactive', 'cancelled', 'pending'],
                default: 'pending',
            },
            customAmount: {
                type: Number,
                min: 50,
            },
        },
        settings: {
            language: {
                type: String,
                enum: ['en', 'zh', 'ko', 'es'],
                default: 'en',
            },
            notifications: {
                push: { type: Boolean, default: true },
            },
            theme: {
                type: String,
                enum: ['dark', 'light'],
                default: 'dark',
            },
        },
        leaderboard: {
            score: {
                type: Number,
                default: 0,
                index: true,
            },
            rank: {
                type: Number,
            },
            history: [
                {
                    date: {
                        type: Date,
                        default: Date.now,
                    },
                    score: Number,
                    breakdown: {
                        sessionsScore: { type: Number, default: 0 },
                        streakScore: { type: Number, default: 0 },
                        exerciseVarietyScore: { type: Number, default: 0 },
                        durationImprovementScore: { type: Number, default: 0 },
                    },
                },
            ],
            lastUpdated: {
                type: Date,
                default: Date.now,
            },
        },
        credits: {
            type: Number,
            default: 0,
            min: 0,
        },
        lastLogin: Date,
        loginAttempts: {
            type: Number,
            default: 0,
            min: 0,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        location: {
            coordinates: {
                type: [Number],
                index: '2dsphere',
            },
            state: String,
            country: String,
        },
        badges: [
            {
                name: String,
                acquired: Date,
                level: {
                    type: String,
                    enum: ['bronze', 'silver', 'gold', 'platinum'],
                },
            },
        ],
        certifications: [
            {
                name: String,
                issuedDate: Date,
                expiryDate: Date,
                creditsEarned: Number,
            },
        ],
        roles: {
            type: [String],
            default: ['trainee'],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes
userSchema.index({ 'leaderboard.score': -1, _id: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'leaderboard.rank': 1 });

// Password hashing middleware
userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        try {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        } catch (err) {
            return next(err);
        }
    }
    next();
});

// Enhanced methods
userSchema.methods = {
    comparePassword: async function (password) {
        return bcrypt.compare(password, this.password);
    },

    updateAIGuidance: async function (newMode) {
        this.aiGuidance.mode = newMode;
        this.aiGuidance.lastGuidance = new Date();
        return this.save();
    },

    getProgress: async function () {
        await this.populate('progress');
        return this.progress;
    },

    calculateAndUpdateCredits: async function (moduleId, score) {
        try {
            const creditEarned = Math.floor(score * 10);
            this.credits += creditEarned;
            await this.save();
            return creditEarned;
        } catch (error) {
            console.error('❌ Error updating credits:', error);
            throw new Error('Failed to update credits');
        }
    },

    calculateLeaderboardScore: async function () {
        try {
            await this.populate(['achievements', 'certifications']);

            // Base score calculation
            let score =
                this.credits * 0.4 +
                (this.achievements?.length || 0) * 100 +
                (this.certifications?.length || 0) * 200;

            // Add streak bonus if available
            if (this.leaderboard?.history?.length > 0) {
                const latestHistory = this.leaderboard.history[this.leaderboard.history.length - 1];
                score += latestHistory.breakdown.streakScore || 0;
            }

            // Update leaderboard
            this.leaderboard.score = Math.floor(score);
            this.leaderboard.lastUpdated = new Date();

            // Add to history if score changed
            if (
                !this.leaderboard.history?.length ||
                this.leaderboard.history[this.leaderboard.history.length - 1].score !== score
            ) {
                this.leaderboard.history.push({
                    date: new Date(),
                    score: Math.floor(score),
                    breakdown: {
                        sessionsScore: Math.floor(this.credits * 0.4),
                        streakScore:
                            this.leaderboard?.history?.length > 0
                                ? this.leaderboard.history[this.leaderboard.history.length - 1]
                                      .breakdown.streakScore
                                : 0,
                        exerciseVarietyScore: (this.achievements?.length || 0) * 100,
                        durationImprovementScore: (this.certifications?.length || 0) * 200,
                    },
                });
            }

            await this.save();
            return this.leaderboard.score;
        } catch (error) {
            console.error('❌ Error calculating leaderboard score:', error);
            throw new Error('Failed to update leaderboard score');
        }
    },
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
