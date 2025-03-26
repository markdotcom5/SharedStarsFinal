// SLL Populator Script
const mongoose = require('mongoose');
require('dotenv').config();

// Load models
const StellaConversation = require('../models/StellaConversation');

// Sample data - space training Q&A pairs
const trainingData = [
  {
    question: "What physical exercises are best for zero-gravity adaptation?",
    answer: "The most effective exercises for zero-gravity adaptation include resistance training with elastic bands, squats against resistance, and balance training. These help maintain muscle mass and bone density that would otherwise deteriorate in microgravity environments.",
    category: "physical-training"
  },
  {
    question: "How does the vestibular system adapt to space?",
    answer: "In microgravity, the vestibular system (inner ear balance) becomes confused without the constant pull of gravity. This causes space adaptation syndrome in about 70% of astronauts. The brain gradually adapts by relying more on visual cues for orientation rather than the inner ear signals.",
    category: "space-adaptation"
  },
  {
    question: "What is the protocol for emergency decompression on the ISS?",
    answer: "The emergency decompression protocol on the ISS involves: 1) Quickly locating the source of the leak using sound or pressure gauges, 2) Isolating the affected module by closing hatches, 3) Donning oxygen masks if available, 4) Sealing the leak using emergency patch kits if possible, and 5) Evacuating to the Soyuz spacecraft if the leak cannot be contained.",
    category: "emergency-procedures"
  },
  // Add 20-30 more Q&A pairs here
];

// Connect to MongoDB
async function populateDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB!');
    
    console.log('Starting SLL population...');
    
    // Clear existing training data if needed
    // Uncomment the next line to clear existing data (be careful!)
    // await StellaConversation.deleteMany({ userId: 'system' });
    
    // Process each Q&A pair
    for (const item of trainingData) {
      // Create user question
      const question = new StellaConversation({
        content: item.question,
        fromUser: true,
        userId: 'system',
        timestamp: new Date(),
        metadata: {
          category: item.category,
          source: 'training_dataset',
          aiAnalysis: {
            topics: [item.category],
            confidenceScore: 0.95
          }
        }
      });
      
      await question.save();
      console.log(`Saved question: ${item.question.substring(0, 30)}...`);
      
      // Create STELLA response
      const response = new StellaConversation({
        content: item.answer,
        fromUser: false,
        userId: 'system',
        timestamp: new Date(Date.now() + 1000), // 1 second after question
        metadata: {
          category: item.category,
          source: 'training_dataset',
          aiAnalysis: {
            confidenceScore: 0.98,
            topics: [item.category]
          }
        }
      });
      
      await response.save();
      console.log(`Saved answer for: ${item.question.substring(0, 30)}...`);
    }
    
    console.log('SLL population complete!');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateDatabase();