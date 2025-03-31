// scripts/populateEmbeddings.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { openai } = require('../services/openaiService');  // ✅ corrected path
const StellaConversation = require('../models/StellaConversation');

dotenv.config();
mongoose.connect(process.env.MONGODB_URI).then(() => console.log('✅ MongoDB Connected'));

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-large'
  });
  return response.data[0].embedding;
}


async function populateEmbeddings() {
  const conversations = await StellaConversation.find({ 'embeddings.questionVector': { $size: 0 } }).limit(100);
  
  for (const conv of conversations) {
    const questionVector = await generateEmbedding(conv.content);
    await StellaConversation.updateOne(
      { _id: conv._id },
      { $set: { 'embeddings.questionVector': questionVector } }
    );
    console.log(`Embedding generated for conversation ${conv._id}`);
  }

  console.log("✅ Embedding population completed.");
  process.exit();
}

populateEmbeddings().catch(err => console.error(err));
