// adaptivePersonalityTrainer.js
require('dotenv').config();
const mongoose = require('mongoose');
const OpenAI = require('openai');
const fs = require('fs').promises;

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

// Define models
const UserPersonality = mongoose.model('UserPersonality', {}, 'userpersonalities');
const StellaInteraction = mongoose.model('StellaInteraction', {}, 'stellainteractions');
const PersonalityTemplate = mongoose.model('PersonalityTemplate', {
  traitType: String,
  intensity: Number,
  template: String,
  context: String,
  successCount: Number,
  feedbackScore: Number,
  lastUsed: Date,
  createdAt: Date
}, 'personalitytemplates');

async function adaptivePersonalityTrainer() {
  try {
    console.log("Starting adaptive personality training process...");
    
    // 1. Collect high-performing responses
    const highPerformingInteractions = await StellaInteraction.find({
      'feedbackData.rating': { $gte: 4 }
    }).limit(100).lean();
    
    console.log(`Found ${highPerformingInteractions.length} high-performing interactions for analysis`);
    
    // 2. Extract personality traits used in successful interactions
    const successfulPersonalitySettings = await extractSuccessfulPersonalitySettings(highPerformingInteractions);
    
    // 3. Analyze successful traits
    const traitAnalysis = analyzeSuccessfulTraits(successfulPersonalitySettings);
    console.log("Trait analysis complete:", traitAnalysis);
    
    // 4. Generate new templates based on successful patterns
    await generateNewTemplates(traitAnalysis);
    
    // 5. Adjust existing templates based on performance
    await adjustExistingTemplates();
    
    console.log("✅ Adaptive personality training complete!");
  } catch (error) {
    console.error("Error in adaptive personality training:", error);
  } finally {
    mongoose.disconnect();
  }
}

async function extractSuccessfulPersonalitySettings(interactions) {
  const successfulSettings = [];
  
  for (const interaction of interactions) {
    if (interaction.responseData && interaction.responseData.personalityFactors) {
      successfulSettings.push({
        interactionId: interaction._id,
        personalityFactors: interaction.responseData.personalityFactors,
        question: interaction.question,
        response: interaction.responseData.message,
        rating: interaction.feedbackData?.rating || 0,
        context: interaction.contextData?.page || 'unknown'
      });
    }
  }
  
  return successfulSettings;
}

function analyzeSuccessfulTraits(settings) {
  // Group by context and calculate average trait values
  const contextGroups = {};
  
  settings.forEach(setting => {
    if (!setting.personalityFactors) return;
    
    const context = setting.context;
    if (!contextGroups[context]) {
      contextGroups[context] = {
        count: 0,
        traits: {
          honesty: 0,
          humor: 0,
          formality: 0,
          encouragement: 0,
          detail: 0
        },
        examples: []
      };
    }
    
    const group = contextGroups[context];
    group.count++;
    
    // Add trait values
    Object.entries(setting.personalityFactors).forEach(([trait, value]) => {
      if (group.traits.hasOwnProperty(trait)) {
        group.traits[trait] += value;
      }
    });
    
    // Store example if it's highly rated
    if (setting.rating >= 4.5) {
      group.examples.push({
        question: setting.question,
        response: setting.response,
        personalityFactors: setting.personalityFactors,
        rating: setting.rating
      });
    }
  });
  
  // Calculate averages
  Object.keys(contextGroups).forEach(context => {
    const group = contextGroups[context];
    if (group.count > 0) {
      Object.keys(group.traits).forEach(trait => {
        group.traits[trait] = Math.round(group.traits[trait] / group.count);
      });
    }
  });
  
  return contextGroups;
}

async function generateNewTemplates(traitAnalysis) {
  const contexts = Object.keys(traitAnalysis);
  let templateCount = 0;
  
  for (const context of contexts) {
    const analysis = traitAnalysis[context];
    
    // Only generate for contexts with enough data
    if (analysis.count < 3 || analysis.examples.length === 0) continue;
    
    console.log(`Generating templates for context: ${context}`);
    
    // For each trait, generate templates at different intensity levels
    const traits = Object.keys(analysis.traits);
    
    for (const trait of traits) {
      // Get examples with strong presence of this trait
      const relevantExamples = analysis.examples.filter(ex => 
        ex.personalityFactors && ex.personalityFactors[trait] > 70);
      
      if (relevantExamples.length === 0) continue;
      
      // Generate templates for different intensities
      const intensities = [30, 50, 70, 90];
      
      for (const intensity of intensities) {
        try {
          // Use GPT to generate a template based on examples
          const templatePrompt = createTemplatePrompt(trait, intensity, relevantExamples);
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              { role: "system", content: "You are a personality template designer for an astronaut training AI called STELLA." },
              { role: "user", content: templatePrompt }
            ]
          });
          
          const template = response.choices[0].message.content.trim();
          
          // Save the template to the database
          const newTemplate = new PersonalityTemplate({
            traitType: trait,
            intensity: intensity,
            template: template,
            context: context,
            successCount: 0,
            feedbackScore: 0,
            lastUsed: null,
            createdAt: new Date()
          });
          
          await newTemplate.save();
          templateCount++;
          
          console.log(`✅ Created template for ${trait} at intensity ${intensity} for context ${context}`);
        } catch (error) {
          console.error(`Error generating template for ${trait}/${intensity}:`, error);
        }
      }
    }
  }
  
  console.log(`✅ Generated ${templateCount} new personality templates`);
}

function createTemplatePrompt(trait, intensity, examples) {
  const exampleText = examples.slice(0, 3).map(ex => 
    `Question: "${ex.question}"\nResponse: "${ex.response}"`).join("\n\n");
  
  return `Please create a response template for STELLA that exemplifies the personality trait "${trait}" at an intensity level of ${intensity}/100.

The template should be adaptable for different user questions but maintain a consistent personality style.

Here are some examples of successful responses with high ${trait}:

${exampleText}

Create a template that captures the essence of these responses but focused specifically on the "${trait}" trait at intensity ${intensity}/100. The template should include placeholders like [TOPIC] or [SPECIFIC_DETAIL] that can be filled in during actual use.`;
}

async function adjustExistingTemplates() {
  // Get templates with enough usage data
  const templates = await PersonalityTemplate.find({
    successCount: { $gte: 5 }
  });
  
  console.log(`Adjusting ${templates.length} existing templates based on performance`);
  
  for (const template of templates) {
    // Calculate performance score
    const performanceScore = template.feedbackScore / Math.max(1, template.successCount);
    
    if (performanceScore < 3) {
      // Underperforming template - attempt to improve it
      try {
        const improvedTemplate = await improveTemplate(template);
        
        template.template = improvedTemplate;
        template.feedbackScore = 0;
        template.successCount = 0;
        
        await template.save();
        console.log(`✅ Improved underperforming template for ${template.traitType} (intensity: ${template.intensity})`);
      } catch (error) {
        console.error(`Error improving template:`, error);
      }
    }
  }
}

async function improveTemplate(template) {
  const improvementPrompt = `This is an existing response template for an AI assistant named STELLA, focused on the personality trait "${template.traitType}" at intensity level ${template.intensity}/100:

"${template.template}"

This template has received below-average user ratings. Please improve it to better express the "${template.traitType}" trait at the specified intensity. Make it more engaging, natural, and effective. Maintain the same overall structure with placeholders like [TOPIC] or [SPECIFIC_DETAIL].`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are a personality template designer for an astronaut training AI called STELLA." },
      { role: "user", content: improvementPrompt }
    ]
  });
  
  return response.choices[0].message.content.trim();
}

// Run the trainer
adaptivePersonalityTrainer();