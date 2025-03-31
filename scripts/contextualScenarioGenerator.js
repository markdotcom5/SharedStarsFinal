// contextualScenarioGenerator.js
require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("✅ MongoDB Connected");
}).catch(err => {
  console.error("❌ MongoDB connection error:", err);
  process.exit(1);
});

// Define scenario model or use existing
const Scenario = mongoose.model('Scenario', {
  title: String,
  description: String,
  difficulty: String,
  type: String,
  skills: [String],
  objectives: [String],
  constraints: [String],
  emergencyFactors: [Object],
  createdAt: { type: Date, default: Date.now }
}, 'scenarios');

// Scenario types to generate
const scenarioTypes = [
  'EVA Repair',
  'Medical Emergency',
  'System Malfunction',
  'Resource Management',
  'Crew Conflict',
  'Scientific Discovery',
  'Navigation Challenge',
  'Communication Failure',
  'Psychological Challenge',
  'Physical Endurance Test'
];

// Difficulty levels
const difficultyLevels = ['beginner', 'intermediate', 'advanced', 'expert'];

async function generateScenario(type, difficulty) {
  const prompt = `Create a detailed, realistic space mission scenario for astronaut training.
Type: ${type}
Difficulty: ${difficulty}

Format the response as a JSON object with these fields:
- title: A brief, descriptive title
- description: Detailed scenario background (200-300 words)
- objectives: Array of 3-5 specific trainee objectives
- constraints: Array of 2-4 limitations or challenges
- skills: Array of key skills being tested
- emergencyFactors: Object with potential emergency variations

Make the scenario challenging, scientifically accurate, and psychologically realistic.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user", 
        content: prompt
      }],
      response_format: { type: "json_object" }
    });

    const scenarioData = JSON.parse(response.choices[0].message.content);
    return {
      ...scenarioData,
      type,
      difficulty
    };
  } catch (error) {
    console.error(`Error generating ${type} scenario:`, error);
    return null;
  }
}

async function generateBatch(count = 5) {
  console.log(`Generating ${count} new training scenarios...`);
  const scenarios = [];

  for (let i = 0; i < count; i++) {
    // Select random type and difficulty
    const type = scenarioTypes[Math.floor(Math.random() * scenarioTypes.length)];
    const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];
    
    console.log(`Generating scenario ${i+1}/${count}: ${type} (${difficulty})`);
    const scenario = await generateScenario(type, difficulty);
    
    if (scenario) {
      // Save to database
      const newScenario = new Scenario(scenario);
      await newScenario.save();
      scenarios.push(scenario);
      console.log(`✅ Saved: "${scenario.title}"`);
    }
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return scenarios;
}

// CLI interface
const args = process.argv.slice(2);
const count = args[0] ? parseInt(args[0]) : 5;

generateBatch(count)
  .then(scenarios => {
    console.log(`🎉 Successfully generated ${scenarios.length} scenarios`);
    mongoose.disconnect();
  })
  .catch(error => {
    console.error('Error in scenario generation:', error);
    mongoose.disconnect(1);
  });