// viewStellaKnowledge.js - updated version
require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
});

const StellaKnowledge = mongoose.model('StellaKnowledge', {}, 'stellaknowledges');

async function viewKnowledge() {
  try {
    // Get count
    const count = await StellaKnowledge.countDocuments();
    console.log(`Total documents: ${count}`);
    
    // Get sample documents
    const docs = await StellaKnowledge.find().limit(10).lean();
    
    console.log("\nSample documents:");
    docs.forEach((doc, index) => {
      console.log(`\n--- Document ${index + 1} ---`);
      console.log(`ID: ${doc._id}`);
      console.log(`Title: ${doc.title || 'N/A'}`);
      console.log(`Category: ${doc.category || 'N/A'}`);
      
      // Safely display content if it exists
      if (doc.content) {
        console.log(`Content: ${doc.content.substring(0, 150)}...`);
      } else {
        console.log(`Content: Not available`);
      }
      
      console.log(`Has embedding: ${Array.isArray(doc.embedding) ? 'Yes' : 'No'}`);
      
      // Show other available fields
      const otherFields = Object.keys(doc).filter(key => 
        !['_id', 'title', 'category', 'content', 'embedding'].includes(key));
      
      if (otherFields.length > 0) {
        console.log(`Other fields: ${otherFields.join(', ')}`);
      }
    });
    
    // Get category breakdown
    const categories = await StellaKnowledge.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    console.log("\nCategory breakdown:");
    categories.forEach(cat => {
      console.log(`${cat._id || 'Uncategorized'}: ${cat.count} documents`);
    });
    
  } catch (err) {
    console.error("Error viewing knowledge:", err);
  } finally {
    mongoose.disconnect();
  }
}

viewKnowledge();