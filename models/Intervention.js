// models/Intervention.js
const mongoose = require('mongoose');

const InterventionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    moduleId: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['HINT', 'EXAMPLE', 'SIMPLIFICATION', 'HUMAN_SUPPORT', 'PRACTICE'],
        required: true
    },
    triggerType: {
        type: String,
        enum: ['TIME_BASED', 'ERROR_BASED', 'CONFIDENCE_BASED', 'PROGRESS_BASED'],
        required: true
    },
    confidence: {
        before: Number,
        after: Number
    },
    content: {
        title: String,
        description: String,
        resources: [String],
        difficulty: String
    },
    effectiveness: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'DISMISSED'],
        default: 'PENDING'
    },
    duration: {
        started: Date,
        completed: Date
    },
    metrics: {
        timeSpent: Number,
        interactionCount: Number,
        helpfulnessRating: Number
    }
}, { timestamps: true });

module.exports = mongoose.model('Intervention', InterventionSchema);
