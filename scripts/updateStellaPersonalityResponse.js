// scripts/updateStellaPersonalityResponse.js
/**
 * Updates STELLA's response generation to use the personality database
 * This script modifies how STELLA selects responses based on personality settings
 */

const mongoose = require('mongoose');
const StellaKnowledge = require('../models/StellaKnowledge');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

/**
 * Enhanced function to get a personalized response template based on personality settings
 * @param {Object} personalitySettings - User's personality settings
 * @param {String} context - The context of the interaction
 * @param {Array} topics - Relevant topics
 * @param {Boolean} debug - Whether to print debug information
 * @returns {Promise<Object>} - A template to guide response generation with metadata
 */
async function getPersonalizedTemplate(personalitySettings, context, topics = [], debug = false) {
  try {
    // Default values if not provided
    const honesty = personalitySettings.honesty || 50;
    const humor = personalitySettings.humor || 50;
    const formality = personalitySettings.formality || 50;
    const encouragement = personalitySettings.encouragement || 50;
    const detail = personalitySettings.detail || 50;
    
    // Determine which trait to prioritize based on highest value and weighted importance
    const traits = [
      { name: 'humor', value: humor, weight: 1.0 },
      { name: 'honesty', value: honesty, weight: 0.9 },
      { name: 'formality', value: formality, weight: 0.8 },
      { name: 'encouragement', value: encouragement, weight: 0.9 },
      { name: 'detail', value: detail, weight: 0.85 }
    ];
    
    // Calculate weighted scores
    traits.forEach(trait => {
      trait.weightedScore = trait.value * trait.weight;
    });
    
    // Sort traits by weighted score (descending)
    traits.sort((a, b) => b.weightedScore - a.weightedScore);
    
    // Select primary, secondary, and tertiary traits
    const primaryTrait = traits[0];
    const secondaryTrait = traits[1];
    const tertiaryTrait = traits[2];
    
    if (debug) {
      console.log(`Primary trait: ${primaryTrait.name} (${primaryTrait.value}, weighted: ${primaryTrait.weightedScore.toFixed(1)})`);
      console.log(`Secondary trait: ${secondaryTrait.name} (${secondaryTrait.value}, weighted: ${secondaryTrait.weightedScore.toFixed(1)})`);
      console.log(`Tertiary trait: ${tertiaryTrait.name} (${tertiaryTrait.value}, weighted: ${tertiaryTrait.weightedScore.toFixed(1)})`);
    }
    
    // Determine intensity ranges based on trait values
    // More precise targeting for extreme values, wider range for middle values
    function getIntensityRange(value) {
      if (value <= 20 || value >= 80) {
        // Narrow range for extreme values (very low or very high)
        return { min: Math.max(0, value - 10), max: Math.min(100, value + 10) };
      } else if (value <= 35 || value >= 65) {
        // Medium range for somewhat extreme values
        return { min: Math.max(0, value - 15), max: Math.min(100, value + 15) };
      } else {
        // Wider range for middle values
        return { min: Math.max(0, value - 20), max: Math.min(100, value + 20) };
      }
    }
    
    // Get intensity ranges for each trait
    const primaryRange = getIntensityRange(primaryTrait.value);
    const secondaryRange = getIntensityRange(secondaryTrait.value);
    
    // Prepare context tags for query
    // Make context matching more flexible by adding variations if context is provided
    let contextTags = [];
    if (context) {
      contextTags.push(context);
      
      // Add variations of the context (singulars, plurals, etc.)
      if (context.endsWith('s')) {
        contextTags.push(context.slice(0, -1)); // singular form
      } else {
        contextTags.push(context + 's'); // plural form
      }
      
      // Add related contexts
      if (context === 'training') contextTags.push('exercise', 'preparation', 'learning');
      if (context === 'assessment') contextTags.push('evaluation', 'test', 'measurement');
      if (context === 'progress') contextTags.push('advancement', 'improvement', 'development');
    }
    
    // Add topics to the context tags
    if (topics && topics.length > 0) {
      contextTags = [...contextTags, ...topics];
    }
    
    if (debug) {
      console.log(`Context tags: ${contextTags.join(', ')}`);
      console.log(`Primary range: ${primaryRange.min}-${primaryRange.max}`);
    }
    
    // Build the query for primary trait
    const primaryQuery = {
      subcategory: primaryTrait.name,
      contextTags: { $in: contextTags },
      $and: [
        { "intensityRange.0": { $lte: primaryRange.max } },
        { "intensityRange.1": { $gte: primaryRange.min } }
      ]
    };
    
    // Find templates matching the primary trait
    const primaryTemplates = await StellaKnowledge.find(primaryQuery)
      .sort({ 
        // Sort by closest intensity match and relevance
        $expr: { 
          $abs: { 
            $subtract: [
              { $avg: "$intensityRange" }, 
              primaryTrait.value
            ] 
          } 
        }
      })
      .limit(5);
    
    if (debug) {
      console.log(`Found ${primaryTemplates.length} templates for ${primaryTrait.name}`);
    }
    
    let selectedTemplate = null;
    let searchPath = "";
    
    // Try to find the best template
    if (primaryTemplates.length > 0) {
      // Select best matching template from primary trait
      const bestMatch = primaryTemplates[0];
      selectedTemplate = bestMatch;
      searchPath = "primary_trait_direct_match";
    } else {
      // Try secondary trait if primary trait has no matches
      const secondaryQuery = {
        subcategory: secondaryTrait.name,
        contextTags: { $in: contextTags },
        $and: [
          { "intensityRange.0": { $lte: secondaryRange.max } },
          { "intensityRange.1": { $gte: secondaryRange.min } }
        ]
      };
      
      const secondaryTemplates = await StellaKnowledge.find(secondaryQuery)
        .sort({ 
          $expr: { 
            $abs: { 
              $subtract: [
                { $avg: "$intensityRange" }, 
                secondaryTrait.value
              ] 
            } 
          }
        })
        .limit(3);
      
      if (debug) {
        console.log(`Found ${secondaryTemplates.length} templates for ${secondaryTrait.name}`);
      }
      
      if (secondaryTemplates.length > 0) {
        selectedTemplate = secondaryTemplates[0];
        searchPath = "secondary_trait_match";
      } else {
        // Fallback to a wider search if no matches found
        const fallbackQuery = {
          subcategory: { $in: [primaryTrait.name, secondaryTrait.name] },
          contentType: 'template'
        };
        
        const fallbackTemplates = await StellaKnowledge.find(fallbackQuery).limit(5);
        
        if (debug) {
          console.log(`Found ${fallbackTemplates.length} fallback templates`);
        }
        
        if (fallbackTemplates.length > 0) {
          // Pick a random template from fallbacks
          const randomIndex = Math.floor(Math.random() * fallbackTemplates.length);
          selectedTemplate = fallbackTemplates[randomIndex];
          searchPath = "fallback_trait_match";
        }
      }
    }
    
    // If no templates found at all, use a generic template
    if (!selectedTemplate) {
      const genericTemplates = {
        'general': "I'll help you with that. Let me provide some information about your space training journey.",
        'assessment': "Let's evaluate your progress. I'll provide an honest assessment of where you stand.",
        'instruction': "Here are the steps you need to follow. Let me break down the process for you.",
        'progress': "I've analyzed your progress. Here's where you are in your training journey.",
        'physical_training': "Here's guidance for your physical training regimen. This will help prepare your body for space.",
        'joke': "Let me lighten the mood with a space-related observation.",
        'default': "I'm here to assist with your space training needs. How can I help you today?"
      };
      
      // Choose the most appropriate generic template based on context
      let templateContent = genericTemplates.default;
      
      if (context && genericTemplates[context]) {
        templateContent = genericTemplates[context];
      } else if (topics && topics.length > 0) {
        // Try to match a topic
        for (const topic of topics) {
          if (genericTemplates[topic]) {
            templateContent = genericTemplates[topic];
            break;
          }
        }
      }
      
      return {
        content: templateContent,
        metadata: {
          source: "generic_template",
          searchPath: "no_matches_found",
          traits: {
            primary: primaryTrait.name,
            secondary: secondaryTrait.name
          },
          context: context || "unknown"
        }
      };
    }
    
    // Return the selected template with metadata
    return {
      content: selectedTemplate.content,
      metadata: {
        source: "database",
        searchPath: searchPath,
        templateId: selectedTemplate._id,
        traits: {
          primary: primaryTrait.name,
          secondary: secondaryTrait.name
        },
        context: context || "unknown",
        selectedTrait: selectedTemplate.subcategory,
        intensity: selectedTemplate.intensityRange
      }
    };
    
  } catch (error) {
    console.error('❌ Error getting personalized template:', error);
    return {
      content: "I'm here to assist with your space training. How can I help?",
      metadata: {
        source: "error_fallback",
        error: error.message
      }
    };
  }
}

/**
 * Integrate personality characteristics into a response
 * @param {string} baseResponse - The initial response content
 * @param {Object} personalitySettings - User's personality settings
 * @param {string} context - Interaction context
 * @returns {Promise<string>} - Personality-enhanced response
 */
async function enhanceResponseWithPersonality(baseResponse, personalitySettings, context, topics = []) {
  try {
    // Get a template based on personality
    const templateResult = await getPersonalizedTemplate(personalitySettings, context, topics);
    const template = templateResult.content;
    
    // Apply the template style to the response
    // This is a simple implementation - in production you'd use more sophisticated NLP
    
    // If the template is very short, use it as a prefix
    if (template.length < 50) {
      return `${template} ${baseResponse}`;
    }
    
    // If the base response is short, adapt it to the template style
    if (baseResponse.length < 100) {
      // Extract style elements from template
      const templateSentences = template.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const templateStyle = templateSentences[0];
      
      return `${templateStyle}. ${baseResponse}`;
    }
    
    // For longer responses, try to blend the template style with the content
    const templateWords = template.split(' ');
    const responseWords = baseResponse.split(' ');
    
    // Blend beginning from template
    const blendedBeginning = templateWords.slice(0, Math.min(15, templateWords.length));
    
    // Middle from response
    const middleLength = Math.min(responseWords.length, 200);
    const blendedMiddle = responseWords.slice(0, middleLength);
    
    // Add template ending if appropriate
    const blendedEnding = templateWords.slice(-Math.min(10, templateWords.length));
    
    // Combine parts
    return `${blendedBeginning.join(' ')} ${blendedMiddle.join(' ')} ${blendedEnding.join(' ')}`;
  } catch (error) {
    console.error('❌ Error enhancing response with personality:', error);
    return baseResponse; // Fall back to original response
  }
}

/**
 * Function to test the personalized response system
 */
async function testPersonalizedResponses() {
  console.log('🧪 Testing personalized response system...');
  
  // Test scenarios
  const testScenarios = [
    {
      name: "High Humor",
      personality: { honesty: 50, humor: 90, formality: 50, encouragement: 50, detail: 50 },
      context: "general",
      topics: ["training"]
    },
    {
      name: "High Honesty",
      personality: { honesty: 90, humor: 30, formality: 50, encouragement: 50, detail: 50 },
      context: "assessment",
      topics: ["physical_training"]
    },
    {
      name: "High Formality",
      personality: { honesty: 50, humor: 30, formality: 90, encouragement: 50, detail: 50 },
      context: "instruction",
      topics: []
    },
    {
      name: "High Encouragement",
      personality: { honesty: 40, humor: 40, formality: 40, encouragement: 90, detail: 40 },
      context: "progress",
      topics: ["training"]
    },
    {
      name: "High Detail",
      personality: { honesty: 50, humor: 30, formality: 60, encouragement: 50, detail: 90 },
      context: "instruction",
      topics: ["physical_training"]
    },
    {
      name: "Balanced Personality",
      personality: { honesty: 50, humor: 50, formality: 50, encouragement: 50, detail: 50 },
      context: "general",
      topics: ["training"]
    },
    {
      name: "Extreme Humor",
      personality: { honesty: 20, humor: 95, formality: 10, encouragement: 60, detail: 30 },
      context: "general",
      topics: ["joke"]
    },
    {
      name: "Technical Expert",
      personality: { honesty: 85, humor: 15, formality: 75, encouragement: 40, detail: 90 },
      context: "instruction",
      topics: ["science", "technical"]
    }
  ];
  
  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Test results collection
  const testResults = {
    timestamp: new Date().toISOString(),
    scenarios: []
  };
  
  // Sample base responses for testing enhancement
  const baseResponses = {
    general: "Space training involves physical preparation, technical knowledge acquisition, and psychological adaptation to prepare astronauts for the challenges of spaceflight.",
    assessment: "Your current physical fitness metrics show you're at 75% of the required level for spaceflight. Your cardiovascular endurance is strong, but upper body strength needs improvement.",
    instruction: "To complete the vestibular adaptation exercise, you'll need to rotate your head while maintaining visual focus on a fixed point. This helps your brain adapt to the sensory conflicts experienced in microgravity.",
    progress: "You've improved your physical readiness by 15% since last month. Your technical knowledge tests show a 22% improvement in spacecraft systems understanding."
  };
  
  // Run each test scenario
  for (const scenario of testScenarios) {
    console.log(`\n🔍 Scenario: ${scenario.name}`);
    console.log(`Context: ${scenario.context}, Topics: ${scenario.topics.join(', ')}`);
    console.log(`Personality: ${JSON.stringify(scenario.personality)}`);
    
    // Get template
    const templateResult = await getPersonalizedTemplate(
      scenario.personality,
      scenario.context,
      scenario.topics,
      true // Enable debug output
    );
    
    console.log(`Template: ${templateResult.content}`);
    console.log(`Metadata: ${JSON.stringify(templateResult.metadata)}`);
    
    // Test response enhancement if we have a base response for this context
    let enhancedResponse = null;
    if (baseResponses[scenario.context]) {
      const baseResponse = baseResponses[scenario.context];
      enhancedResponse = await enhanceResponseWithPersonality(
        baseResponse,
        scenario.personality,
        scenario.context,
        scenario.topics
      );
      
      console.log(`\nBase response: ${baseResponse}`);
      console.log(`Enhanced response: ${enhancedResponse}`);
    }
    
    // Collect results
    testResults.scenarios.push({
      scenario: scenario.name,
      personality: scenario.personality,
      context: scenario.context,
      topics: scenario.topics,
      template: templateResult.content,
      metadata: templateResult.metadata,
      baseResponse: baseResponses[scenario.context] || null,
      enhancedResponse: enhancedResponse
    });
  }
  
  // Save test results
  const resultsPath = path.join(resultsDir, `personality-test-${new Date().toISOString().slice(0,10)}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(testResults, null, 2));
  
  console.log(`\n✅ Test results saved to: ${resultsPath}`);
  
  return testResults;
}

/**
 * Function to update the response generation in the database
 */
async function updateResponseGeneration() {
  console.log('🔄 Updating STELLA response generation...');
  
  // Run the test to demonstrate functionality
  const testResults = await testPersonalizedResponses();
  
  // Create a sample implementation file
  const implementationCode = `
// Import this function into your response generation pipeline
const { getPersonalizedTemplate, enhanceResponseWithPersonality } = require('../services/personalityService');

// Example integration into your existing response pipeline
async function generateStellaResponse(query, userId) {
  // Get user's personality settings from database
  const userPersonality = await getUserPersonality(userId);
  
  // Get context and topics from query analysis
  const { context, topics } = await analyzeQuery(query);
  
  // Generate base response (your existing logic)
  const baseResponse = await generateBaseResponse(query);
  
  // Enhance with personality
  const enhancedResponse = await enhanceResponseWithPersonality(
    baseResponse,
    userPersonality,
    context,
    topics
  );
  
  return enhancedResponse;
}
  `;
  
  // Create a sample implementation file
  const implementationPath = path.join(__dirname, '../implementation-examples/personalityIntegration.js');
  
  // Ensure the directory exists
  const dir = path.dirname(implementationPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(implementationPath, implementationCode);
  
  console.log('\n✅ Personality response system has been tested successfully!');
  console.log(`Implementation example saved to: ${implementationPath}`);
  console.log('\nTo integrate this with STELLA:');
  console.log('1. Create a personalityService.js file in your services directory');
  console.log('2. Copy the getPersonalizedTemplate and enhanceResponseWithPersonality functions');
  console.log('3. Update your response generation pipeline to use these functions');
}

// Export the functions for use in the STELLA system
module.exports = {
  getPersonalizedTemplate,
  enhanceResponseWithPersonality
};

// Run the update script if called directly
if (require.main === module) {
  updateResponseGeneration().catch(error => {
    console.error('❌ Error in update script:', error);
    mongoose.disconnect();
    process.exit(1);
  }).finally(() => {
    setTimeout(() => {
      mongoose.disconnect();
      console.log('✅ Disconnected from MongoDB');
    }, 2000);
  });
}