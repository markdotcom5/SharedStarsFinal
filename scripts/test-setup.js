require('dotenv').config();
const mongoose = require('mongoose');
const openaiService = require('../services/openaiService');

async function runQuickCheck() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected Successfully');
    
    const response = await openaiService.createChatCompletion([
      { role: 'system', content: 'Respond clearly with "All systems go!"' }
    ]);
    console.log('✅ OpenAI Completion:', response);
    
    const embedding = await openaiService.createEmbedding('quick test');
    console.log('✅ Embedding Generated:', embedding.length, 'dimensions');
    
    mongoose.disconnect();
    console.log('🎉 Quick Check Passed!');
  } catch (error) {
    console.error('❌ Quick Check Error:', error);
    mongoose.disconnect();
  }
}

runQuickCheck();