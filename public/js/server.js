import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv"; // Load environment variables

// Load .env file (Ensure you have dotenv installed: `npm install dotenv`)
dotenv.config();

// Initialize Express app
const app = express();
app.use(cors());

// Connect to MongoDB
const connectDB = async () => {
  try {
      await mongoose.connect(process.env.MONGO_URI, {
          serverSelectionTimeoutMS: parseInt(process.env.MONGO_TIMEOUT, 10) || 5000,
          autoIndex: process.env.MONGO_AUTO_INDEX === "true",
          maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE, 10) || 10,
          socketTimeoutMS: parseInt(process.env.MONGO_SOCKET_TIMEOUT, 10) || 45000,
          retryWrites: true,
      });
      console.log("✅ MongoDB Connected");

      // Add model logging
      const modelNames = mongoose.modelNames();
      console.log("\n📚 Connected Models:");
      modelNames.forEach(model => {
          console.log(`✅ ${model} model connected`);
      });
      console.log(`\n🔢 Total Models Connected: ${modelNames.length}\n`);

      mongoose.connection.on("disconnected", () => {
          console.warn("⚠️ MongoDB Disconnected. Attempting to reconnect...");
          setTimeout(connectDB, 5000);
      });

      mongoose.connection.on("reconnected", () => {
          console.log("🔄 MongoDB Reconnected Successfully");
      });
  } catch (error) {
      console.error("❌ MongoDB Connection Error:", error);
      process.exit(1);
  }
};
// Define Leaderboard Schema
const leaderboardSchema = new mongoose.Schema({
  username: { type: String, required: true },
  score: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Leaderboard = mongoose.model("Leaderboard", leaderboardSchema);

// 🔹 API Route: Fetch Top 10 Leaderboard Entries
app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboard = await Leaderboard.find().sort({ score: -1 }).limit(10);
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    console.error("❌ Error fetching leaderboard:", error);
    res.status(500).json({ success: false, message: "Error fetching leaderboard", error: error.message });
  }
});

// 🔹 API Route: Add New Score
app.post("/api/leaderboard", async (req, res) => {
  try {
    const { username, score } = req.body;
    if (!username || score == null) {
      return res.status(400).json({ success: false, message: "Username and score are required." });
    }

    const newEntry = new Leaderboard({ username, score });
    await newEntry.save();

    res.status(201).json({ success: true, message: "Score added successfully!", data: newEntry });
  } catch (error) {
    console.error("❌ Error saving score:", error);
    res.status(500).json({ success: false, message: "Error saving score", error: error.message });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
