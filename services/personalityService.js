// services/personalityService.js
const mongoose = require('mongoose');
const StellaKnowledge = require('../models/StellaKnowledge');

/**
 * Enhanced function to get a personalized response template based on personality settings
 * This version is designed to work with the existing enhanceResponseWithPersonality function
 * 
 * @param {Object} personalitySettings - User's personality settings
 * @param {String} context - The context of the interaction
 * @param {Array} topics - Relevant topics
 * @returns {Promise<Object>} - A template to guide response generation with metadata
 */
async function getPersonalizedTemplate(personalitySettings, context, topics = []) {
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
    
    // Select primary and secondary traits
    const primaryTrait = traits[0];
    const secondaryTrait = traits[1];
    
    // Determine intensity ranges based on trait values
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
    
    // Prepare context tags for query
    let contextTags = [];
    if (context) {
      contextTags.push(context);
      
      // Add variations of the context
      if (context.endsWith('s')) {
        contextTags.push(context.slice(0, -1)); // singular form
      } else {
        contextTags.push(context + 's'); // plural form
      }
      
      // Add related contexts
      if (context === 'training') contextTags.push('exercise', 'preparation');
      if (context === 'assessment') contextTags.push('evaluation', 'test');
      if (context === 'progress') contextTags.push('advancement', 'improvement');
    }
    
    // Add topics to the context tags
    if (topics && topics.length > 0) {
      contextTags = [...contextTags, ...topics];
    }
    
    // Build the query for primary trait - FIXED FROM PREVIOUS VERSION
    const primaryQuery = {
      subcategory: primaryTrait.name,
      contextTags: { $in: contextTags }
    };
    
    // Add intensity range filtering - fixed to use standard MongoDB operators
    primaryQuery["intensityRange.0"] = { $lte: primaryRange.max };
    primaryQuery["intensityRange.1"] = { $gte: primaryRange.min };
    
    // Find templates matching the primary trait - NO SORT FOR NOW
    const primaryTemplates = await StellaKnowledge.find(primaryQuery).limit(5);
    
    let selectedTemplate = null;
    let searchPath = "";
    
    // Try to find the best template
    if (primaryTemplates.length > 0) {
      // Select best matching template from primary trait 
      // For now, just pick the first one (or random one)
      const randomIndex = Math.floor(Math.random() * primaryTemplates.length);
      selectedTemplate = primaryTemplates[randomIndex];
      searchPath = "primary_trait_direct_match";
    } else {
      // Try secondary trait if primary trait has no matches
      const secondaryQuery = {
        subcategory: secondaryTrait.name,
        contextTags: { $in: contextTags }
      };
      
      // Add intensity range query - fixed version
      const secondaryRange = getIntensityRange(secondaryTrait.value);
      secondaryQuery["intensityRange.0"] = { $lte: secondaryRange.max };
      secondaryQuery["intensityRange.1"] = { $gte: secondaryRange.min };
      
      const secondaryTemplates = await StellaKnowledge.find(secondaryQuery).limit(3);
      
      if (secondaryTemplates.length > 0) {
        const randomIndex = Math.floor(Math.random() * secondaryTemplates.length);
        selectedTemplate = secondaryTemplates[randomIndex];
        searchPath = "secondary_trait_match";
      } else {
        // Fallback to a wider search if no matches found
        const fallbackQuery = {
          subcategory: { $in: [primaryTrait.name, secondaryTrait.name] },
          contentType: 'template'
        };
        
        const fallbackTemplates = await StellaKnowledge.find(fallbackQuery).limit(5);
        
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
 * Adapter function to work with the existing enhanceResponseWithPersonality function
 * @param {string} baseResponse - The initial response content
 * @param {Object} personalitySettings - User's personality settings
 * @param {Object} userState - User's current state
 * @param {Object} queryAnalysis - Analysis of the user's query
 * @returns {Promise<Object>} - Personality-enhanced response with metadata
 */
async function enhanceResponseWithPersonality(baseResponse, personalitySettings, userState = {}, queryAnalysis = {}) {
  try {
    // Default queryAnalysis if not provided
    const topics = queryAnalysis.topics || [];
    const context = queryAnalysis.intent || 'general';
    
    // Get a template based on personality
    const templateResult = await getPersonalizedTemplate(personalitySettings, context, topics);
    const template = templateResult.content;
    
    // Prepare parameters for the existing enhanceResponseWithPersonality function
    // This assumes there's a global enhanceResponseWithPersonality function already defined
    const params = {
      baseResponse,
      personalitySettings,
      userState: userState || {
        emotionalState: 'neutral',
        currentActivity: 'browsing'
      },
      queryAnalysis: queryAnalysis || {
        topics: []
      },
      confidenceScore: 0.9
    };
    
    // Check if the global function exists
    if (typeof global.enhanceResponseWithPersonality === 'function') {
      // Use the global function
      return global.enhanceResponseWithPersonality(params);
    }
    
    // Otherwise, implement a simple version here
    // Apply the template style to the response
    let enhancedResponse = baseResponse;
    
    // If the template is very short, use it as a prefix
    if (template.length < 50) {
      enhancedResponse = `${template} ${baseResponse}`;
    } 
    // If the base response is short, adapt it to the template style
    else if (baseResponse.length < 100) {
      // Extract first sentence from template
      const templateSentence = template.split(/[.!?]/)[0] + '.';
      enhancedResponse = `${templateSentence} ${baseResponse}`;
    } 
    // For longer responses, try to blend the template style with the content
    else {
      const templateWords = template.split(' ');
      
      // Blend beginning from template (first 10-15 words)
      const beginningLength = Math.min(15, templateWords.length);
      const beginning = templateWords.slice(0, beginningLength).join(' ');
      
      // Use the original response content
      enhancedResponse = `${beginning} ${baseResponse}`;
    }
    
    return {
      content: enhancedResponse,
      confidence: 0.9,
      personalityFactors: personalitySettings,
      adaptiveToneAdjustments: {},
      metadata: templateResult.metadata
    };
  } catch (error) {
    console.error('❌ Error enhancing response with personality:', error);
    return {
      content: baseResponse,
      confidence: 0.9,
      personalityFactors: personalitySettings
    };
  }
}

module.exports = {
  getPersonalizedTemplate,
  enhanceResponseWithPersonality
};