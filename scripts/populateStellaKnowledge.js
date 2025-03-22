require('dotenv').config(); // fix environment variables loading
const mongoose = require('mongoose');
const StellaKnowledge = require('../models/StellaKnowledge');

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

const initialInsights = [
  { summary: "Physical training reduces muscle atrophy in microgravity." },
  { summary: "Cognitive resilience improves performance under stress." },
  { summary: "Flexibility training is essential for confined space movements." },
  { summary: "Consistent cardiovascular exercises enhance endurance in space." }
];

async function populateInsights() {
  try {
    await StellaKnowledge.insertMany(initialInsights);
    console.log('✅ StellaKnowledge Collection Populated!');
  } catch (error) {
    console.error('❌ Error populating StellaKnowledge:', error);
  } finally {
    mongoose.disconnect();
  }
}

populateInsights();
