const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// ✅ STELLA Conversation Schema - Enhanced for Learning
const StellaConversationSchema = new Schema({
    userId: { 
        type: String,  // Accept string IDs for anonymous users
        required: true,
        index: true
    },
    fromUser: {
        type: Boolean,
        required: true,
        default: false
    },
    content: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        context: {
            type: String,
            enum: ['general', 'training', 'assessment', 'progress', 'certification'],
            default: 'general'
        },
        moduleId: String,
        missionId: String,
        exerciseId: String,
        metrics: Schema.Types.Mixed,
        sentiment: {
            type: String,
            enum: ['positive', 'neutral', 'negative'],
        },
        sessionId: String
    },
    aiAnalysis: {
        intent: String,
        topics: [String],
        actionRequired: Boolean,
        followUpNeeded: Boolean,
        // Enhanced with learning-specific fields
        questionType: {
            type: String,
            enum: ['informational', 'help', 'guidance', 'feedback', 'technical', 'assessment', 'other'],
            default: 'other'
        },
        keyEntities: [String],  // Key entities mentioned in the question (e.g., "core balance", "mission 2")
        confidenceScore: {      // How confident the AI was in its response
            type: Number,
            min: 0,
            max: 1,
            default: 0.85
        },
        responseQuality: {      // Tracking response quality (can be updated based on user feedback)
            type: Number,
            min: 1,
            max: 5,
            default: 3
        }
    },
    userFeedback: {             // Track explicit user feedback to improve responses
        helpful: {
            type: Boolean,
            default: null
        },
        rating: {
            type: Number,
            min: 1,
            max: 5,
            default: null
        },
        feedbackText: String,
        receivedAt: Date
    },
    processed: {
        type: Boolean,
        default: false
    },
    // Track frequency of similar questions
    frequencyData: {
        similarQuestionCount: {
            type: Number,
            default: 1
        },
        lastAsked: {
            type: Date,
            default: Date.now
        },
        responseTime: Number    // Time taken to generate response in ms
    },
    // Track vector embeddings for semantic search
    embeddings: {
        questionVector: [Number],
        responseVector: [Number]
    }
}, { timestamps: true });

// ✅ Indexes for efficient queries
StellaConversationSchema.index({ 'userId': 1, 'timestamp': -1 });
StellaConversationSchema.index({ 'metadata.context': 1 });
StellaConversationSchema.index({ 'metadata.moduleId': 1, 'metadata.missionId': 1 });
StellaConversationSchema.index({ 'aiAnalysis.questionType': 1 });
StellaConversationSchema.index({ 'aiAnalysis.keyEntities': 1 });
StellaConversationSchema.index({ 'frequencyData.similarQuestionCount': -1 }); // Index for finding most common questions

// ✅ Create Conversation Thread Method
StellaConversationSchema.statics.getConversationThread = async function(userId, limit = 10) {
    return this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean();
};

// ✅ Add Message to Conversation
StellaConversationSchema.statics.addMessage = async function(userId, message, isFromUser = true, metadata = {}) {
    return this.create({
        userId,
        fromUser: isFromUser,
        content: message,
        timestamp: new Date(),
        metadata
    });
};

// ✅ NEW: Find Similar Questions
// ✅ IMPROVED: Find Similar Questions
StellaConversationSchema.statics.findSimilarQuestions = async function(question, threshold = 0.85) {
    // Extract keywords for better matching
    const keywords = question.split(/\s+/)
        .filter(word => word.length > 3)
        .map(word => word.toLowerCase());
    
    let query;
    if (keywords.length >= 2) {
        // Create a text search condition using the keywords
        const keywordPattern = keywords.join('|');
        query = {
            content: { $regex: new RegExp(keywordPattern, 'i') },
            fromUser: true
        };
    } else {
        // Fall back to simple prefix matching
        query = {
            content: { $regex: new RegExp(question.substring(0, 20), 'i') },
            fromUser: true
        };
    }
    
    return this.find(query)
        .sort({ 'frequencyData.similarQuestionCount': -1 })
        .limit(5)
        .lean();
};

// ✅ NEW: Increment Question Frequency 
StellaConversationSchema.statics.incrementQuestionFrequency = async function(questionId) {
    return this.findByIdAndUpdate(
        questionId,
        { 
            $inc: { 'frequencyData.similarQuestionCount': 1 },
            $set: { 'frequencyData.lastAsked': new Date() }
        },
        { new: true }
    );
};

// ✅ NEW: Store User Feedback
StellaConversationSchema.statics.storeUserFeedback = async function(messageId, feedback) {
    return this.findByIdAndUpdate(
        messageId,
        {
            $set: {
                'userFeedback.helpful': feedback.helpful,
                'userFeedback.rating': feedback.rating,
                'userFeedback.feedbackText': feedback.feedbackText,
                'userFeedback.receivedAt': new Date()
            }
        },
        { new: true }
    );
};

// ✅ NEW: Get Most Common Questions
StellaConversationSchema.statics.getMostCommonQuestions = async function(limit = 10) {
    return this.find({
        fromUser: true,
        'frequencyData.similarQuestionCount': { $gt: 1 }
    })
    .sort({ 'frequencyData.similarQuestionCount': -1 })
    .limit(limit)
    .lean();
};

// ✅ NEW: Get Response Metrics
StellaConversationSchema.statics.getResponseMetrics = async function() {
    return this.aggregate([
        { $match: { fromUser: false } },
        { $group: {
            _id: null,
            averageResponseTime: { $avg: '$frequencyData.responseTime' },
            averageConfidence: { $avg: '$aiAnalysis.confidenceScore' },
            responseCount: { $sum: 1 }
        }}
    ]);
};

// ✅ NEW: Get Questions by Type
StellaConversationSchema.statics.getQuestionsByType = async function(type, limit = 20) {
    return this.find({
        fromUser: true,
        'aiAnalysis.questionType': type
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// ✅ NEW: Extract Training Topics
StellaConversationSchema.statics.extractTrainingTopics = async function() {
    return this.aggregate([
        { $match: { 
            fromUser: true,
            'metadata.context': 'training'
        }},
        { $unwind: '$aiAnalysis.topics' },
        { $group: {
            _id: '$aiAnalysis.topics',
            count: { $sum: 1 }
        }},
        { $sort: { count: -1 }},
        { $limit: 20 }
    ]);
};

// ✅ Find Messages by Context
StellaConversationSchema.statics.findByContext = async function(userId, context, limit = 10) {
    return this.find({
        userId,
        'metadata.context': context
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// ✅ Find Messages by Module
StellaConversationSchema.statics.findByModule = async function(userId, moduleId, limit = 10) {
    return this.find({
        userId,
        'metadata.moduleId': moduleId
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// ✅ Find Messages by Mission
StellaConversationSchema.statics.findByMission = async function(userId, missionId, limit = 10) {
    return this.find({
        userId,
        'metadata.missionId': missionId
    })
    .sort({ timestamp: -1 })
    .limit(limit)
    .lean();
};

// ✅ Get Conversation Statistics
StellaConversationSchema.statics.getStats = async function(userId) {
    const totalMessages = await this.countDocuments({ userId });
    const userMessages = await this.countDocuments({ userId, fromUser: true });
    const stellaMessages = await this.countDocuments({ userId, fromUser: false });
    
    // Get context distribution
    const contextStats = await this.aggregate([
        { $match: { userId } },
        { $group: { 
            _id: '$metadata.context', 
            count: { $sum: 1 } 
        }},
        { $sort: { count: -1 } }
    ]);
    
    // Get recent activity by day
    const dailyActivity = await this.aggregate([
        { $match: { userId } },
        { $group: {
            _id: { 
                $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } 
            },
            count: { $sum: 1 }
        }},
        { $sort: { _id: -1 } },
        { $limit: 7 }
    ]);
    
    return {
        totalMessages,
        userMessages,
        stellaMessages,
        contextDistribution: contextStats,
        dailyActivity
    };
};

// ✅ Clear Conversation History
StellaConversationSchema.statics.clearHistory = async function(userId) {
    return this.deleteMany({ userId });
};

// ✅ Method to extract AI training insights
StellaConversationSchema.statics.extractTrainingInsights = async function(userId, moduleId, daysBack = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    
    return this.find({
        userId,
        'metadata.moduleId': moduleId,
        timestamp: { $gte: startDate }
    })
    .select('content metadata.exerciseId timestamp')
    .sort({ timestamp: -1 })
    .lean();
};

console.log("✅ StellaConversation model loaded successfully");

// ✅ Prevent Duplicate Schema Compilation
const StellaConversation = mongoose.models.StellaConversation || mongoose.model("StellaConversation", StellaConversationSchema);

module.exports = StellaConversation;