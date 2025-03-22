// models/Translation.js
const mongoose = require('mongoose');

const translationSchema = new mongoose.Schema({
  language: {
    type: String,
    required: true,
    unique: true,
    enum: ['en', 'es', 'ko', 'zh']
  },
  data: {
    type: Map,
    of: String,
    default: {}
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Translation', translationSchema);