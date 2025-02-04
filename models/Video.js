const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    url: { type: String, required: true },
    chapters: [{ title: String, start: Number, end: Number }],
    transcript: [{ time: Number, text: String }],
    bookmarks: [{ userId: String, time: Number, note: String }],
    achievements: [{ title: String, condition: String }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Video', videoSchema);
