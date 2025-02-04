const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  messages: [
    {
      sender: { type: String, required: true }, // "user" or "ai"
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]
});

module.exports = mongoose.model("Chat", chatSchema);
