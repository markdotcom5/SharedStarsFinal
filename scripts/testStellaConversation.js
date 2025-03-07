// scripts/testStellaConversation.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import the model (adjust path if necessary)
const StellaConversation = require('../models/StellaConversation');

async function testStellaStorage() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB');
    
    // Create a test conversation entry
    const testConversation = new StellaConversation({
      userId: 'test-user-123',
      fromUser: true,
      content: 'This is a test question to verify storage is working',
      timestamp: new Date(),
      metadata: {
        context: 'testing',
        sessionId: `test_${Date.now()}`
      },
      aiAnalysis: {
        questionType: 'test',
        confidenceScore: 0.9
      }
    });
    
    // Save to database
    await testConversation.save();
    console.log('✅ Test conversation saved:', testConversation._id);
    
    // Verify we can read it back
    const retrieved = await StellaConversation.findById(testConversation._id);
    console.log('✅ Retrieved conversation:', retrieved);
    
    // Get count
    const count = await StellaConversation.countDocuments();
    console.log(`✅ Total conversations in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  }
}

// Run the test
testStellaStorage();