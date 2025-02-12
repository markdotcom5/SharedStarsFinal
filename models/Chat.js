const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // ❌ Removed `unique: true`
  messages: [
    {
      sender: String,
      text: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Chat", chatSchema);
