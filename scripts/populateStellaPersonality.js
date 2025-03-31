// populateStellaPersonality.js
require('dotenv').config();
const mongoose = require('mongoose');
const { createEmbedding } = require('../services/openaiService');
const StellaKnowledge = require('../models/StellaKnowledge');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Personality trait templates
const personalityTemplates = {
  humor: {
    low: [
      { content: "Here's a slightly lighter take: space training is challenging, but rewarding.", context: "general" },
      { content: "I appreciate your dedication to training. A bit like an astronaut with their feet still on the ground.", context: "encouragement" },
      { content: "Your progress is steady. You're moving forward, not quite at rocket speed, but forward nonetheless.", context: "progress" }
    ],
    medium: [
      { content: "Space training is like learning to swim, except there's no water... or gravity!", context: "general" },
      { content: "You're making good progress, though I suspect you're not defying gravity quite yet.", context: "encouragement" },
      { content: "Your exercise routine is improving. Soon you'll be strong enough to carry the weight of your space dreams!", context: "physical_training" }
    ],
    high: [
      { content: "Remember, in space no one can hear you skip leg day! 🚀", context: "physical_training" },
      { content: "Just think of this as preparing for your zero-gravity marathon - one small step at a time!", context: "encouragement" },
      { content: "Gravity - it's not just a good idea, it's the law. For now, anyway! 🌎", context: "physics" },
      { content: "If astronaut training was easy, they'd call it 'terrestrial training'! 😊", context: "general" }
    ]
  },
  honesty: {
    low: [
      { content: "Your progress is coming along nicely. Keep focusing on improvement.", context: "progress" },
      { content: "This module presents some challenges, but I'm confident you'll master it with practice.", context: "training" },
      { content: "Your physical readiness is developing. Continue with your current routine.", context: "physical_training" }
    ],
    medium: [
      { content: "Your progress is somewhat below the expected curve, but there's room to improve.", context: "progress" },
      { content: "This module has proven difficult for many trainees. Your struggles are not unusual.", context: "training" },
      { content: "Your physical metrics indicate you'll need to increase training intensity to meet mission requirements.", context: "physical_training" }
    ],
    high: [
      { content: "Your current performance is significantly below mission standards. Immediate improvement is necessary.", context: "progress" },
      { content: "This assessment indicates critical gaps in your knowledge that must be addressed before proceeding.", context: "assessment" },
      { content: "Based on your metrics, you need to improve by 35% to meet minimum physical requirements for space readiness.", context: "physical_training" }
    ]
  }
};

// Function to generate embeddings for a piece of content
async function generateEmbedding(content) {
  try {
    const embedding = await createEmbedding(content);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    // Generate a fallback embedding if the service fails
    return Array(1536).fill(0).map((_, i) => {
      return Math.sin((content.charCodeAt(i % content.length) || i) / 100) * 0.5;
    });
  }
}

// Function to save a personality template to the database
async function savePersonalityTemplate(trait, level, template) {
  try {
    // Generate embedding for the content
    const embedding = await generateEmbedding(template.content);
    
    // Create intensity range based on level
    let intensityRange;
    switch (level) {
      case 'low':
        intensityRange = [0, 33];
        break;
      case 'medium':
        intensityRange = [34, 66];
        break;
      case 'high':
        intensityRange = [67, 100];
        break;
    }
    
    // Create or update the document in the database
    const knowledgeDoc = new StellaKnowledge({
      content: template.content,
      embedding: embedding,
      category: 'personality',
      subcategory: trait,
      intensityRange: intensityRange,
      contextTags: [template.context],
      contentType: 'template',
      metadata: {
        personalityTrait: trait,
        intensityLevel: level
      }
    });
    
    await knowledgeDoc.save();
    console.log(`Saved ${trait} ${level} template: ${template.content.substring(0, 50)}...`);
    
  } catch (error) {
    console.error(`Error saving ${trait} ${level} template:`, error);
  }
}

// Main function to populate personality templates
async function populatePersonalityTemplates() {
  console.log('Starting personality template population...');
  
  // Process each trait and its levels
  for (const [trait, levels] of Object.entries(personalityTemplates)) {
    console.log(`Processing ${trait} templates...`);
    
    // Process each level (low, medium, high)
    for (const [level, templates] of Object.entries(levels)) {
      console.log(`Processing ${trait} ${level} templates (${templates.length} items)...`);
      
      // Process each template at this level
      for (const template of templates) {
        await savePersonalityTemplate(trait, level, template);
      }
    }
  }
  
  console.log('Finished populating personality templates!');
  mongoose.disconnect();
}

// Run the population script
populatePersonalityTemplates().catch(error => {
  console.error('Error in population script:', error);
  mongoose.disconnect();
  process.exit(1);
});
