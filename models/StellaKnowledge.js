const mongoose = require('mongoose');

const StellaKnowledgeSchema = new mongoose.Schema({
  summary: { type: String, required: true },
  details: { type: String },
  category: { type: String },
  relevanceScore: { type: Number, default: 0.5 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StellaKnowledge', StellaKnowledgeSchema);
