import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

async function main() {
  try {
    // Connect to your database
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
    
    // Create a text search index (only runs once)
    try {
      await mongoose.connection.db.collection('stellaknowledges').createIndex({ summary: "text" });
      console.log("Created text index on summary field");
    } catch (error) {
      console.log("Note about index:", error.message);
    }
    
    // Set up access to your collection
    const StellaKnowledge = mongoose.model('StellaKnowledge', {}, 'stellaknowledges');
    
    // Search for documents matching these keywords
    const query = "cardiovascular exercise";
    console.log(`Searching for: "${query}"`);
    
    // Run the search
    const results = await StellaKnowledge.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    ).sort({ score: { $meta: "textScore" } }).limit(5);
    
    // Show results
    console.log("🔍 Results:", results);
    
    // Disconnect from database
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  } catch (error) {
    console.error("Error:", error);
  }
}

// Run everything
main();