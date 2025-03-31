require('dotenv').config();
const mongoose = require('mongoose');
const { createChatCompletion, createEmbedding } = require('../services/openaiService');

async function testAll() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const completion = await createChatCompletion([
      { role: 'system', content: 'Say hello' },
      { role: 'user', content: 'Hello Stella!' }
    ]);

    console.log('✅ OpenAI Chat Completion Working:', completion);

    const embedding = await createEmbedding('Testing embeddings');
    console.log('✅ OpenAI Embedding Working (length):', embedding.length);

    mongoose.disconnect();
    console.log('✅ Everything is working perfectly!');
  } catch (error) {
    console.error('❌ Error:', error);
    mongoose.disconnect();
  }
}

testAll();
