// models/StellaKnowledge.js
const mongoose = require('mongoose');

const StellaKnowledgeSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  embedding: {
    type: [Number],
    required: true
  },
  metadata: {
    type: Object,
    default: {}
  },
  topics: [String],
  category: String,
  confidence: {
    type: Number,
    default: 1.0
  },
  useCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for vector search (MongoDB Atlas)
// Note: This will need to be created separately in MongoDB Atlas
// db.stellaknowledges.createIndex({ embedding: "vectorSearch" })

module.exports = mongoose.model('StellaKnowledge', StellaKnowledgeSchema);