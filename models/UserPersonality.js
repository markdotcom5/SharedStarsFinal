// models/UserPersonality.js
const mongoose = require('mongoose');

const UserPersonalitySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  traits: {
    honesty: {
      type: Number,
      default: 70,
      min: 0,
      max: 100
    },
    humor: {
      type: Number,
      default: 50,
      min: 0,
      max: 100
    },
    formality: {
      type: Number,
      default: 60,
      min: 0, 
      max: 100
    },
    encouragement: {
      type: Number,
      default: 75,
      min: 0,
      max: 100
    },
    detail: {
      type: Number,
      default: 65,
      min: 0,
      max: 100
    }
  },
  presetName: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('UserPersonality', UserPersonalitySchema);