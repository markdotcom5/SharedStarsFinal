const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const OpenAI = require("openai");

// Define the User schema ONCE
const userSchema = new mongoose.Schema(
    {
        // Relationships
        achievements: [{ type: mongoose.Schema.Types.ObjectId, ref: "Achievement" }],
        trainingModules: [{ type: mongoose.Schema.Types.ObjectId, ref: "Module" }],
        trainingSessions: [{ type: mongoose.Schema.Types.ObjectId, ref: "TrainingSession" }],

        // Module Progress (moved from second schema)
        moduleProgress: [{
            moduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Module' },
            creditsEarned: Number,
            completionDate: Date,
            score: Number
        }],

        // AI Guidance System Fields
        aiGuidance: {
            // ... your existing aiGuidance fields ...
        },

        // User Details
        email: {
            // ... your existing email fields ...
        },
        password: {
            // ... your existing password fields ...
        },
        subscription: {
            // ... your existing subscription fields ...
        },
        roles: {
            // ... your existing roles fields ...
        },

        // User Settings
        settings: {
            // ... your existing settings fields ...
        },

        // User Stats and Metadata
        leaderboardScore: { type: Number, default: 0, min: 0 },
        credits: { type: Number, default: 0, min: 0 },
        lastLogin: { type: Date },
        loginAttempts: { type: Number, default: 0, min: 0 },
        isBlocked: { type: Boolean, default: false },
        location: {
            coordinates: { type: [Number] },
            state: String,
            country: String,
        },
        badges: [
            // ... your existing badges fields ...
        ],
        certifications: [
            // ... your existing certifications fields ...
        ],
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes
userSchema.index({ "location.coordinates": "2dsphere" });

// Instance Methods
userSchema.methods.hashPassword = async function (password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function (password) {
    return bcrypt.compare(password, this.password);
};

userSchema.methods.updateAIGuidance = async function (newMode) {
    // ... your existing updateAIGuidance method ...
};

userSchema.methods.updateAIContext = async function (newContext) {
    // ... your existing updateAIContext method ...
};

userSchema.methods.generateAIInsights = async function (prompt) {
    // ... your existing generateAIInsights method ...
};

userSchema.methods.calculateAndUpdateCredits = async function(moduleId, score) {
    // ... your existing calculateAndUpdateCredits method ...
};

userSchema.methods.calculateModuleCredits = function(module, score) {
    // ... your existing calculateModuleCredits method ...
};

userSchema.methods.calculateLeaderboardScore = async function() {
    // ... your existing calculateLeaderboardScore method ...
};

// Middleware
userSchema.pre("save", async function(next) {
    if (this.isModified("password")) {
        this.password = await this.hashPassword(this.password);
    }
    next();
});

// Export the model
module.exports = mongoose.model('User', userSchema);