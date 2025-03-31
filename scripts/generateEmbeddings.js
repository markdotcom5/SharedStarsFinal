// scripts/generateEmbeddings.js (explicit logging added)
require('dotenv').config();
const mongoose = require('mongoose');
const { openai } = require('../services/openaiService');

mongoose.connect(process.env.MONGO_URI);

const StellaKnowledge = mongoose.model('StellaKnowledge', new mongoose.Schema({
  text: String,
  embedding: [Number]
}));

const { openai } = require('../services/openaiService');

async function generateEmbeddings() {
  console.log('🔄 Fetching documents needing embeddings...');

  const docs = await StellaKnowledge.find({
    embedding: { $exists: false },
    text: { $exists: true, $ne: "" }
  });

  if (!docs.length) {
    console.log('✅ No new documents found to embed.');
    mongoose.disconnect();
    return;
  }

  console.log(`🔍 ${docs.length} documents found.`);

  for (const doc of docs) {
    if (!doc.text.trim()) {
      console.warn(`⚠️ Skipping document ID ${doc._id} due to empty text.`);
      continue;
    }

    try {
      const embeddingResponse = await openai.embeddings.create({
        input: doc.text,
        model: 'text-embedding-3-small'
      });

      doc.embedding = embeddingResponse.data[0].embedding;
      await doc.save();

      console.log(`✅ Embedded document ID: ${doc._id}`);
    } catch (error) {
      console.error(`❌ Error embedding document ID ${doc._id}:`, error.message);
    }
  }

  mongoose.disconnect();
}

generateEmbeddings().catch(console.error);
