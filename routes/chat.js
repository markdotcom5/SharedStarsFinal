const express = require("express");
const router = express.Router();
const Chat = require("../models/Chat");

// Save chat to MongoDB
router.post("/save", async (req, res) => {
  const { userId, message, sender } = req.body;

  if (!userId || !message || !sender) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    await Chat.findOneAndUpdate(
      { userId },
      {
        $push: { messages: { sender, text: message, timestamp: new Date() } },
      },
      { upsert: true }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Chat save error:", error);
    res.status(500).json({ error: "Failed to save chat" });
  }
});

// Retrieve chat history
router.get("/history", async (req, res) => {
  const { userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const chat = await Chat.findOne({ userId });
    res.status(200).json({ messages: chat ? chat.messages : [] });
  } catch (error) {
    console.error("Chat retrieval error:", error);
    res.status(500).json({ error: "Failed to retrieve chat history" });
  }
});

module.exports = router;
