// models/BlogPost.js
const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'Featured'
  },
  publishedDate: {
    type: Date,
    default: Date.now
  },
  author: {
    name: {
      type: String,
      default: 'Mark Sendo'
    },
    title: {
      type: String,
      default: 'SharedStars Founder'
    },
    imageUrl: String
  },
  imageUrl: String,
  slug: String,
  published: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', blogPostSchema);