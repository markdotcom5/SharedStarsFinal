const bcrypt = require("bcrypt");
const OpenAI = require("openai");
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
   // Basic User Info
   name: {
       type: String,
       required: true,
       trim: true
   },
   email: {
       type: String,
       required: true,
       unique: true,
       trim: true,
       lowercase: true
   },
   password: {
       type: String,
       required: true
   },

   // Relationships
   achievements: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Achievement"
   }],
   trainingModules: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "Module"
   }],
   trainingSessions: [{
       type: mongoose.Schema.Types.ObjectId,
       ref: "TrainingSession"
   }],

   // Module Progress
   moduleProgress: [{
       moduleId: {
           type: mongoose.Schema.Types.ObjectId,
           ref: 'Module'
       },
       creditsEarned: {
           type: Number,
           default: 0
       },
       completionDate: Date,
       score: {
           type: Number,
           min: 0,
           max: 100
       }
   }],

   // AI Guidance System
   aiGuidance: {
       mode: {
           type: String,
           enum: ['manual', 'assist', 'full_guidance'],
           default: 'assist'
       },
       lastGuidance: Date,
       preferences: {
           type: Map,
           of: String
       }
   },

   // Subscription Details
   subscription: {
       type: {
           type: String,
           enum: ['individual', 'family', 'galactic', 'custom'],
           default: 'individual'
       },
       startDate: Date,
       endDate: Date,
       status: {
           type: String,
           enum: ['active', 'inactive', 'cancelled', 'pending'],
           default: 'pending'
       },
       customAmount: {
           type: Number,
           min: 50 // Minimum $50/month for custom plans
       }
   },

   // User Settings & Preferences
   settings: {
       language: {
           type: String,
           enum: ['en', 'zh', 'ko', 'es'],
           default: 'en'
       },
       notifications: {
           email: { type: Boolean, default: true },
           push: { type: Boolean, default: true }
       },
       theme: {
           type: String,
           default: 'dark'
       }
   },

   // User Stats and Metadata
   leaderboardScore: { 
       type: Number, 
       default: 0, 
       min: 0 
   },
   credits: { 
       type: Number, 
       default: 0, 
       min: 0 
   },
   lastLogin: { type: Date },
   loginAttempts: { 
       type: Number, 
       default: 0, 
       min: 0 
   },
   isBlocked: { 
       type: Boolean, 
       default: false 
   },
   
   // Location Data
   location: {
       coordinates: { 
           type: [Number] 
       },
       state: String,
       country: String
   },

   // Achievements & Certifications
   badges: [{
       type: String,
       acquired: Date,
       level: {
           type: String,
           enum: ['bronze', 'silver', 'gold', 'platinum']
       }
   }],
   certifications: [{
       name: String,
       issuedDate: Date,
       expiryDate: Date,
       creditsEarned: Number
   }],

   roles: {
       type: [String],
       default: ['trainee']
   }
}, {
   timestamps: true,
   versionKey: false
});

// Indexes
userSchema.index({ "location.coordinates": "2dsphere" });
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ leaderboardScore: -1 });

// Instance Methods
userSchema.methods.hashPassword = async function(password) {
   const salt = await bcrypt.genSalt(10);
   return bcrypt.hash(password, salt);
};

userSchema.methods.comparePassword = async function(password) {
   return bcrypt.compare(password, this.password);
};

userSchema.methods.updateAIGuidance = async function(newMode) {
   this.aiGuidance.mode = newMode;
   this.aiGuidance.lastGuidance = new Date();
   return this.save();
};

userSchema.methods.updateAIContext = async function(newContext) {
   this.aiGuidance.preferences = new Map(Object.entries(newContext));
   return this.save();
};

userSchema.methods.calculateAndUpdateCredits = async function(moduleId, score) {
   const creditEarned = this.calculateModuleCredits(moduleId, score);
   this.credits += creditEarned;
   await this.save();
   return creditEarned;
};

userSchema.methods.calculateLeaderboardScore = async function() {
   const score = (this.credits * 0.4) + 
                (this.achievements.length * 100) +
                (this.certifications.length * 200);
   this.leaderboardScore = Math.floor(score);
   return this.save();
};

// Middleware
userSchema.pre("save", async function(next) {
   if (this.isModified("password")) {
       this.password = await this.hashPassword(this.password);
   }
   next();
});

module.exports = mongoose.model('User', userSchema);