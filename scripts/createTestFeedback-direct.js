/**
 * createTestFeedback-direct.js
 * 
 * This script creates test feedback data for STELLA interactions
 * to help test the personality system and feedback processing.
 * 
 * Usage: node scripts/createTestFeedback-direct.js [--count=10]
 */

require('dotenv').config();
const mongoose = require('mongoose');
const StellaInteraction = require('../models/StellaInteraction');
const StellaKnowledge = require('../models/StellaKnowledge');
const UserPersonality = require('../models/UserPersonality');

// CLI arguments
const args = process.argv.slice(2);
const count = args.find(arg => arg.startsWith('--count=')) ? 
  parseInt(args.find(arg => arg.startsWith('--count=')).split('=')[1]) : 10;

// Connect directly to MongoDB (bypassing connectDB.js)
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/sharedstars';

mongoose.connect(mongoURI)
  .then(() => {
    console.log('✅ MongoDB connected');
    createTestData();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Create test feedback data
 */
async function createTestData() {
  try {
    console.log(`🔄 Creating ${count} test interactions with feedback...`);
    
    // Create test users if they don't exist
    const testUsers = ['test-user-1', 'test-user-2', 'test-user-3'];
    
    for (const userId of testUsers) {
      const existing = await UserPersonality.findOne({ userId });
      
      if (!existing) {
        await createTestUser(userId);
      }
    }
    
    // Get or create StellaKnowledge templates
    const templates = await getOrCreateTemplates();
    
    // Create test interactions with feedback
    const interactions = [];
    
    for (let i = 0; i < count; i++) {
      // Random selection of parameters
      const userId = testUsers[Math.floor(Math.random() * testUsers.length)];
      const personalityTraits = await getUserPersonality(userId);
      const templateIndex = Math.floor(Math.random() * templates.length);
      const template = templates[templateIndex];
      const rating = Math.floor(Math.random() * 5) + 1;
      const isHelpful = rating >= 4;
      
      // Random date in the last 30 days
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
      
      // Create test message
      const messages = [
        "How do I prepare for zero-g training?",
        "What is the most important physical exercise for astronauts?",
        "Can you explain emergency procedures?",
        "How long does it take to complete basic training?",
        "What skills are most important for space missions?",
        "Tell me about the psychological challenges of space travel",
        "How do astronauts sleep in space?",
        "What's the hardest part of astronaut training?",
        "How do I improve my space readiness score?",
        "What training modules should I focus on next?"
      ];
      
      const message = messages[Math.floor(Math.random() * messages.length)];
      
      // Generate a response based on the template
      const response = generateResponse(template, message);
      
      // Create the interaction
      // When creating the interaction, update to include all required fields
const interaction = new StellaInteraction({
  userId,
  message,
  question: message, // Add the question field with the same value as message
  response,
  personalitySettings: personalityTraits,
  timestamp,
  sessionId: `session_${Date.now()}_${userId}`, // Generate a session ID
  requestId: `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`, // Generate a request ID
  metadata: {
    templateId: template._id,
    source: "database",
    searchPath: "primary_trait_direct_match",
    context: "training"
  },
  feedback: {
    helpful: isHelpful,
    rating,
    comments: isHelpful ? 
      "This was really helpful information" : 
      "I was hoping for more specific guidance",
    timestamp: new Date(timestamp.getTime() + 30000) // 30 seconds later
  }
});
      
      await interaction.save();
      interactions.push(interaction);
    }
    
    console.log(`✅ Created ${interactions.length} test interactions with feedback`);
    console.log('💡 You can now process this feedback with:');
    console.log('node scripts/personalityFeedbackProcessor.js');
    
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  }
}

/**
 * Create a test user with personality settings
 */
async function createTestUser(userId) {
  const personalityPresets = [
    {
      honesty: 70,
      humor: 50,
      formality: 60,
      encouragement: 75,
      detail: 65
    },
    {
      honesty: 90,
      humor: 20,
      formality: 80,
      encouragement: 50,
      detail: 85
    },
    {
      honesty: 60,
      humor: 85,
      formality: 30,
      encouragement: 90,
      detail: 40
    }
  ];
  
  const randomPreset = personalityPresets[Math.floor(Math.random() * personalityPresets.length)];
  
  const userPersonality = new UserPersonality({
    userId,
    traits: randomPreset,
    presetName: 'custom',
    lastUpdated: new Date()
  });
  
  await userPersonality.save();
  console.log(`✅ Created test user: ${userId}`);
}

/**
 * Get user's personality traits
 */
async function getUserPersonality(userId) {
  const personality = await UserPersonality.findOne({ userId });
  
  if (personality && personality.traits) {
    return personality.traits;
  }
  
  return {
    honesty: 70,
    humor: 50,
    formality: 60,
    encouragement: 75,
    detail: 65
  };
}

/**
 * Get or create StellaKnowledge templates
 */
async function getOrCreateTemplates() {
  // Check if we have templates
  const templateCount = await StellaKnowledge.countDocuments();
  
  if (templateCount > 0) {
    return StellaKnowledge.find().limit(20);
  }
  
  // Create test templates
  const templates = [];
  
  const templateData = [
    {
      category: 'personality',
      subcategory: 'honesty',
      content: "I'll be direct with you. The results of your training session show significant room for improvement. Let's focus on where you need to strengthen your skills:",
      contextTags: ['assessment', 'feedback', 'training'],
      intensityRange: [80, 100]
    },
    {
      category: 'personality',
      subcategory: 'honesty',
      content: "Your performance in this module was below the expected standard. I recommend focusing intensively on these areas before proceeding.",
      contextTags: ['assessment', 'feedback', 'evaluation'],
      intensityRange: [75, 95]
    },
    {
      category: 'personality',
      subcategory: 'humor',
      content: "Houston, we have a... learning opportunity! 🚀 Remember, even astronauts float before they walk!",
      contextTags: ['training', 'learning', 'challenge'],
      intensityRange: [80, 100]
    },
    {
      category: 'personality',
      subcategory: 'humor',
      content: "Gravity might be optional in space, but unfortunately, these training requirements aren't! Let's make sure you're prepared for all forces of nature.",
      contextTags: ['requirements', 'training', 'preparation'],
      intensityRange: [75, 95]
    },
    {
      category: 'personality',
      subcategory: 'formality',
      content: "In accordance with Space Training Protocol 7.3, a comprehensive assessment of your current performance has been conducted. The findings indicate:",
      contextTags: ['assessment', 'evaluation', 'formal'],
      intensityRange: [80, 100]
    },
    {
      category: 'personality',
      subcategory: 'formality',
      content: "Formal notification: Your progress in the designated training modules has been evaluated with the following determinations:",
      contextTags: ['notification', 'evaluation', 'progress'],
      intensityRange: [75, 95]
    },
    {
      category: 'personality',
      subcategory: 'encouragement',
      content: "You're making incredible progress! Every step you take brings you closer to your goals. Keep up this amazing momentum!",
      contextTags: ['progress', 'motivation', 'encouragement'],
      intensityRange: [80, 100]
    },
    {
      category: 'personality',
      subcategory: 'encouragement',
      content: "I'm genuinely impressed by your dedication to mastering these challenging concepts. Your perseverance will definitely pay off in your space career!",
      contextTags: ['dedication', 'challenge', 'mastery'],
      intensityRange: [75, 95]
    },
    {
      category: 'personality',
      subcategory: 'detail',
      content: "Let me break this down comprehensively for you with all relevant factors considered. Additionally, the supplementary data indicates correlation patterns between these variables that impact your overall performance trajectory.",
      contextTags: ['breakdown', 'comprehensive', 'analysis'],
      intensityRange: [80, 100]
    },
    {
      category: 'personality',
      subcategory: 'detail',
      content: "A detailed analysis of your performance reveals multiple interconnected factors. When we examine the granular data, several significant patterns emerge that warrant attention.",
      contextTags: ['analysis', 'data', 'patterns'],
      intensityRange: [75, 95]
    }
  ];
  
  for (const data of templateData) {
    const template = new StellaKnowledge({
      ...data,
      contentType: 'template',
      source: 'internal',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await template.save();
    templates.push(template);
  }
  
  console.log(`✅ Created ${templates.length} test templates`);
  return templates;
}

/**
 * Generate a response based on a template and message
 */
/**
 * Generate a response based on a template and message
 */
function generateResponse(template, message) {
  // Base responses for different topics
  const responses = {
    "zero-g": "Zero-gravity training is a critical component of astronaut preparation...",
    "physical": "Astronaut physical training focuses on cardiovascular endurance...",
    "emergency": "Emergency procedures for space missions are extensively rehearsed and fall into several categories: medical emergencies, depressurization events, fire, toxic atmosphere, and collision threats. Each procedure has a specific protocol that must be memorized and practiced until responses become automatic.",
    "training": "The complete astronaut training program typically takes 2-3 years to complete. This includes theoretical knowledge, physical conditioning, survival training, spacecraft systems familiarity, and mission-specific preparation. The timeline varies based on mission requirements and individual progress.",
    "skills": "The most critical skills for astronauts include technical knowledge, physical fitness, communication abilities, teamwork, problem-solving under pressure, and psychological resilience. Different mission roles may emphasize certain skills over others, but all astronauts need a strong foundation across these areas.",
    "psychological": "The psychological challenges of space travel include isolation, confinement, altered sleep patterns, distance from loved ones, and the stress of living in a dangerous environment. Astronauts undergo extensive psychological screening and training to develop coping mechanisms for these stressors.",
    "sleep": "Astronauts in space typically sleep in sleeping bags attached to the wall. Without gravity, there's no sensation of 'lying down' - you simply float in place. Most astronauts report sleeping 6-7 hours per day, often with the aid of circadian lighting to maintain Earth-like day/night cycles.",
    "hardest": "Many astronauts report that the hardest part of training is mastering the combination of technical knowledge with physical demands, particularly during EVA (spacewalk) training in the Neutral Buoyancy Lab. These underwater sessions in spacesuits are physically exhausting while requiring precise technical execution.",
    "readiness": "To improve your space readiness score, focus on consistent progress across all training modules, particularly in areas where your score is lowest. Regular physical training, completing technical assessments with high accuracy, and demonstrating teamwork in group exercises all contribute significantly to your overall readiness.",
    "modules": "Based on typical training progression, you should focus on mastering the fundamentals of spacecraft systems, space physiology, and EVA procedures before moving to more specialized modules. Ensuring a strong foundation in these core areas will maximize your success in later, more complex training scenarios."
  };
  
   // Determine which response to use based on the message
   let baseResponse = responses.training; // Default
  
   const messageLC = message.toLowerCase();
   for (const [keyword, response] of Object.entries(responses)) {
     if (messageLC.includes(keyword)) {
       baseResponse = response;
       break;
     }
   }
   
   // Safe check for template content
   const templateContent = template && template.content ? template.content : '';
   
   // Apply template at beginning of response
   if (templateContent.length > 0) {
     return templateContent + " " + baseResponse;
   }
}

// If this script is run directly
if (require.main === module) {
  // Already handled above
}