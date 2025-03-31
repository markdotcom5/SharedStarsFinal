// populateStellaKnowledge.js
require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');

const openai = new OpenAI.OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Enhanced schema with additional metadata
const stellaKnowledgeSchema = new mongoose.Schema({
  title: String,
  content: String,
  embedding: [Number],
  category: String,
  topics: [String],
  confidenceScore: Number,
  lastUpdated: Date,
  sourceReliability: { type: Number, min: 0, max: 1 },
  contentType: { type: String, enum: ['factual', 'procedural', 'conceptual', 'advice'] },
  createdAt: { type: Date, default: Date.now }
});

const StellaKnowledge = mongoose.model('StellaKnowledge', stellaKnowledgeSchema, 'stellaknowledges');

// Organized by category for better knowledge structuring
const trainingData = [
  // Physical Training
  {
    title: "Core Strength Exercises for Astronauts",
    content: "Core strength significantly reduces injury risk during mission-critical operations. Astronauts should focus on exercises that target the transverse abdominis, multifidus, and pelvic floor muscles. Recommended exercises include planks (3 sets of 60 seconds), Russian twists (3 sets of 20), and hollow holds (3 sets of 30 seconds). These exercises should be performed at least 3 times per week, with progressive overload applied by increasing duration or adding resistance.",
    category: "Physical Training",
    topics: ["exercise", "core strength", "injury prevention"],
    confidenceScore: 0.95,
    contentType: "procedural"
  },
  {
    title: "Vestibular Adaptation Training",
    content: "Vestibular adaptation exercises improve astronaut performance during microgravity transitions. The vestibular system controls balance and spatial orientation, which becomes disrupted in microgravity. Training protocols include head movement exercises while focusing on fixed visual targets, virtual reality simulations with altered gravity parameters, and sensory organization tasks. Studies show that astronauts who complete at least 20 hours of vestibular training before missions report 40% fewer space adaptation syndrome symptoms.",
    category: "Physical Training",
    topics: ["vestibular", "adaptation", "microgravity", "balance"],
    confidenceScore: 0.93,
    contentType: "factual"
  },
  
  // EVA Procedures
  {
    title: "EVA Safety Protocols",
    content: "The optimal approach for EVA training involves regular simulations and safety drills. Each EVA candidate must complete a minimum of 30 hours in the Neutral Buoyancy Laboratory (NBL) to simulate microgravity conditions. Critical safety procedures include: constant communication with Mission Control, regular equipment checks at 30-minute intervals, buddy system protocols, and emergency response training for micrometeoroid impacts, suit depressurization, and tether failures. All EVA activities follow the 'three-barrier rule' where critical systems must have three independent protection mechanisms.",
    category: "EVA Procedures",
    topics: ["EVA", "safety", "protocols", "training"],
    confidenceScore: 0.97,
    contentType: "procedural"
  },
  
  // Nutrition
  {
    title: "Space Mission Nutrition Guidelines",
    content: "Nutrition during space missions should focus on high-calorie, low-volume foods. Astronauts require approximately 2500-3000 calories daily, with optimal macronutrient distribution of 50-55% carbohydrates, 15-20% protein, and 30% fats. Special attention must be paid to calcium intake (1000-1200mg daily) and vitamin D (800-1000 IU daily) to combat bone density loss. Food items are selected based on shelf stability, packaging efficiency, and minimal crumb production. Hydration requirements increase to 2-3 liters daily due to the fluid shifts experienced in microgravity.",
    category: "Nutrition",
    topics: ["food", "diet", "calories", "hydration"],
    confidenceScore: 0.96,
    contentType: "factual"
  },
  
  // Psychological Training
  {
    title: "Mental Resilience Techniques for Long-Duration Missions",
    content: "Mental resilience can be enhanced through mindfulness and focused psychological training. Recommended practices include daily meditation (10-15 minutes), cognitive-behavioral techniques for stress management, and regular crew cohesion activities. The SMART protocol (Stress Management and Resilience Training) shows 35% improvement in astronaut psychological outcomes. For missions exceeding 6 months, quarterly psychological evaluations are conducted using the Astronaut Psychological Evaluation Toolkit (APET), measuring stress tolerance, group dynamics, and cognitive function under isolation.",
    category: "Psychological Training",
    topics: ["mental health", "resilience", "stress management", "mindfulness"],
    confidenceScore: 0.92,
    contentType: "conceptual"
  },
  
  // Emergency Procedures
  {
    title: "Fire Emergency Protocols in Space Habitats",
    content: "Fire emergencies in space habitats require immediate action following the PRICE protocol: Pressurize (ensure proper compartment pressure), Report (alert all crew and mission control), Isolate (seal affected module), Contain (activate fire suppression systems), and Evacuate (move to safe haven if necessary). Unlike Earth fires, space fires spread spherically due to lack of convection currents in microgravity. Primary suppression uses CO2-based systems that reduce oxygen without harming electronics. Each crew member must demonstrate proficiency in locating and operating fire extinguishers blindfolded, simulating low-visibility conditions.",
    category: "Emergency Procedures",
    topics: ["fire", "emergency", "safety", "protocols"],
    confidenceScore: 0.98,
    contentType: "procedural"
  }
];

// Enhanced embedding function with retry logic
async function createEmbedding(text, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await openai.embeddings.create({
        input: text,
        model: "text-embedding-3-large"
      });
      return response.data[0].embedding;
    } catch (err) {
      console.error(`Attempt ${attempt}/${retries} failed:`, err.message);
      if (attempt === retries) throw err;
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Process items in batches to avoid rate limiting
async function processBatch(items, batchSize = 3) {
  const results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(items.length/batchSize)}`);
    
    const batchPromises = batch.map(async (item) => {
      try {
        const embedding = await createEmbedding(item.content);
        return {
          ...item,
          embedding,
          lastUpdated: new Date(),
          sourceReliability: 0.9, // High reliability for our curated content
        };
      } catch (err) {
        console.error(`Failed to process item "${item.title}":`, err);
        return null;
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter(item => item !== null));
    
    // Rate limiting pause between batches
    if (i + batchSize < items.length) {
      console.log("Pausing between batches to avoid rate limits...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return results;
}

// Populate database and verify
async function populateDatabase() {
  try {
    // Check for existing entries to avoid duplicates
    const existingCount = await StellaKnowledge.countDocuments();
    console.log(`Found ${existingCount} existing entries in the database.`);
    
    if (existingCount > 0) {
      const proceed = await promptUser("Database already contains entries. Continue? (y/n): ");
      if (proceed.toLowerCase() !== 'y') {
        console.log("Operation cancelled.");
        return mongoose.disconnect();
      }
    }
    
    console.log(`Starting to process ${trainingData.length} knowledge entries...`);
    const processedItems = await processBatch(trainingData);
    
    // Save processed items to database
    let savedCount = 0;
    for (const item of processedItems) {
      const knowledgeItem = new StellaKnowledge(item);
      await knowledgeItem.save();
      savedCount++;
      console.log(`✅ Added: "${item.title}"`);
    }
    
    console.log(`🎉 Database populated successfully! Added ${savedCount} items.`);
    
    // Verify items were saved correctly
    const verificationCount = await StellaKnowledge.countDocuments();
    console.log(`Verification: Database now contains ${verificationCount} entries.`);
    
    // Check that vector search index is working
    console.log("Testing vector search functionality...");
    const testQuery = "physical training for astronauts";
    const testEmbedding = await createEmbedding(testQuery);
    
    try {
      const searchResults = await StellaKnowledge.aggregate([
        {
          $vectorSearch: {
            index: "stella_embedding_index",
            queryVector: testEmbedding,
            path: "embedding",
            numCandidates: 100,
            limit: 3
          }
        },
        {
          $project: {
            title: 1,
            score: { $meta: "vectorSearchScore" }
          }
        }
      ]);
      
      console.log("Vector search test results:", searchResults);
    } catch (err) {
      console.error("Vector search test failed:", err.message);
      console.log("You may need to create or verify your vector search index in MongoDB Atlas.");
    }
    
  } catch (err) {
    console.error("Error populating database:", err);
  } finally {
    mongoose.disconnect();
  }
}

// Helper function for user prompts
function promptUser(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(question, answer => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run the population script
populateDatabase();