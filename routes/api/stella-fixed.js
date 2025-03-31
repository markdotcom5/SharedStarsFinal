// routes/api/stella-fixed.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// Import models
const StellaInteraction = require('../../models/StellaInteraction');
const UserPersonality = require('../../models/UserPersonality');
const StellaKnowledge = require('../../models/StellaKnowledge');
const UserProgress = require('../../models/UserProgress');
const STELLA_AI = require('../../services/STELLA_AI');


// Import OpenAI service (or your custom version)
const openAIService = require('../../services/openaiService');

// Import helper utilities
const cacheService = require('../../services/cacheService');

// Import security utilities
const { 
  createHash,
  sanitizeRequest,
  sanitizeDeviceInfo
} = require('../../utils/securityUtils');

// Simple memory cache for development
const responseCache = new Map();
const getFromCache = async (key) => responseCache.get(key);
const storeInCache = async (key, value, ttl) => {
  responseCache.set(key, value);
  setTimeout(() => responseCache.delete(key), ttl * 1000);
  return true;
};

// Feedback token storage
const feedbackTokens = new Map();
const storeFeedbackToken = async (token, data) => {
  feedbackTokens.set(token, data);
  // Expire after 7 days
  setTimeout(() => feedbackTokens.delete(token), 7 * 24 * 60 * 60 * 1000);
  return true;
};

/**
 * GET /api/stella/status
 * Get STELLA system status
 */
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: "online",
    version: "1.0",
    capabilities: [
      "Personalized guidance",
      "Training assessment",
      "Progress tracking",
      "Adaptive learning",
      "Personality customization"
    ]
  });
});

/**
 * POST /api/stella/connect
 * Initialize STELLA connection for a user
 */
router.post('/connect', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.body;
    
    // Generate a new session ID
    const sessionId = `session_${Date.now()}_${uuidv4().slice(0, 8)}`;
    
    // Get user's personality settings if they exist
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    res.json({
      success: true,
      sessionId,
      capabilities: [
        "Personalized guidance",
        "Training assessment",
        "Progress tracking"
      ],
      personality: personalitySettings?.traits || getDefaultPersonality()
    });
  } catch (error) {
    console.error('STELLA Connect Error:', error);
    res.status(500).json({
      success: false,
      error: "Failed to connect to STELLA"
    });
  }
});

// Get default personality settings
function getDefaultPersonality() {
  return {
    honesty: 70,
    humor: 50,
    formality: 60,
    encouragement: 75,
    detail: 65
  };
}

/**
 * Enhanced Personality System for STELLA
 * 
 * This code includes updated versions of the personality-related functions
 * from the routes/api/stella-fixed.js file, with improved error handling,
 * validation, and consistency.
 */

/**
 * GET /api/stella/personality/settings
 * Get user's personality settings with proper error handling
 */
router.get('/personality/settings', async (req, res) => {
  try {
    const { userId = 'anonymous' } = req.query;
    
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid userId format"
      });
    }
    
    // Get user's personality settings
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    if (personalitySettings) {
      return res.json({
        success: true,
        personality: personalitySettings.traits,
        presetName: personalitySettings.presetName || 'custom'
      });
    } else {
      // Return default personality settings
      return res.json({
        success: true,
        personality: getDefaultPersonality(),
        presetName: 'default'
      });
    }
  } catch (error) {
    console.error('Error fetching personality settings:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch personality settings"
    });
  }
});

/**
 * POST /api/stella/personality/update
 * Update user's personality settings with improved validation
 */
router.post('/personality/update', async (req, res) => {
  try {
    const { userId = 'anonymous', traits, presetName = 'custom' } = req.body;
    
    // Validate userId
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        error: "Invalid userId format"
      });
    }
    
    if (!traits || typeof traits !== 'object') {
      return res.status(400).json({
        success: false,
        error: "Personality traits are required and must be an object"
      });
    }
    
    // Get existing traits to avoid overwriting missing ones
    const existingSettings = await UserPersonality.findOne({ userId });
    const existingTraits = existingSettings?.traits || getDefaultPersonality();
    
    // Define all expected personality traits
    const expectedTraits = ['honesty', 'humor', 'formality', 'encouragement', 'detail'];
    
    // Validate and normalize trait values
    const normalizedTraits = { ...existingTraits };
    
    // Update only provided traits
    for (const [trait, value] of Object.entries(traits)) {
      if (expectedTraits.includes(trait)) {
        // Ensure value is a number and within range 0-100
        if (typeof value === 'number' || !isNaN(Number(value))) {
          normalizedTraits[trait] = Math.max(0, Math.min(100, Number(value)));
        } else {
          return res.status(400).json({
            success: false,
            error: `Trait '${trait}' must have a numeric value between 0-100`
          });
        }
      }
    }
    
    // Ensure all expected traits are present
    for (const trait of expectedTraits) {
      if (normalizedTraits[trait] === undefined) {
        normalizedTraits[trait] = getDefaultPersonality()[trait];
      }
    }
    
    // Update or create personality settings
    const updatedSettings = await UserPersonality.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          traits: normalizedTraits,
          presetName,
          lastUpdated: new Date()
        }
      },
      { 
        new: true,
        upsert: true
      }
    );
    
    res.json({
      success: true,
      personality: updatedSettings.traits,
      presetName: updatedSettings.presetName
    });
  } catch (error) {
    console.error('Error updating personality settings:', error);
    res.status(500).json({
      success: false,
      error: "Failed to update personality settings"
    });
  }
});
/**
 * GET /api/stella/personality/presets
 * Get available personality presets
 */
router.get('/personality/presets', (req, res) => {
  try {
    res.json({
      success: true,
      presets: getPersonalityPresets()
    });
  } catch (error) {
    console.error('Error fetching personality presets:', error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch personality presets"
    });
  }
});

/**
 * Get defined personality presets
 */
function getPersonalityPresets() {
  return {
    default: {
      name: "Balanced",
      description: "A balanced personality with moderate traits",
      traits: {
        honesty: 70,
        humor: 50,
        formality: 60,
        encouragement: 75,
        detail: 65
      }
    },
    technical: {
      name: "Technical Expert",
      description: "Highly detailed and formal with straightforward honesty",
      traits: {
        honesty: 85,
        humor: 30,
        formality: 90,
        encouragement: 60,
        detail: 95
      }
    },
    supportive: {
      name: "Supportive Coach",
      description: "Encouraging and positive with a touch of humor",
      traits: {
        honesty: 75,
        humor: 70,
        formality: 40,
        encouragement: 95,
        detail: 70
      }
    },
    direct: {
      name: "Direct Instructor",
      description: "Straightforward and concise with high honesty",
      traits: {
        honesty: 90,
        humor: 20,
        formality: 70,
        encouragement: 50,
        detail: 40
      }
    },
    friendly: {
      name: "Friendly Assistant",
      description: "Casual and humorous with supportive approach",
      traits: {
        honesty: 70,
        humor: 85,
        formality: 30,
        encouragement: 85,
        detail: 50
      }
    }
  };
}

/**
 * Get default personality settings
 */
function getDefaultPersonality() {
  return {
    honesty: 70,
    humor: 50,
    formality: 60,
    encouragement: 75,
    detail: 65
  };
}

/**
 * Enhanced function for creating personalized system prompt
 */
function createPersonalizedSystemPrompt(personalitySettings, userContext) {
  // Create a system prompt that tells the model how to respond based on personality settings
  let honesty = personalitySettings.honesty || 70;
  let humor = personalitySettings.humor || 50;
  let formality = personalitySettings.formality || 60;
  let encouragement = personalitySettings.encouragement || 75;
  let detail = personalitySettings.detail || 65;
  
  // Create detailed instructions for each personality trait
  const honestyGuidance = getHonestyGuidance(honesty);
  const humorGuidance = getHumorGuidance(humor);
  const formalityGuidance = getFormalityGuidance(formality);
  const encouragementGuidance = getEncouragementGuidance(encouragement);
  const detailGuidance = getDetailGuidance(detail);
  
  // Get user's training stage and context
  const trainingStage = userContext.learningStage || 'beginner';
  const trainingFocus = userContext.currentTrainingFocus || 'general';
  
  let prompt = `You are STELLA (Space Training Enhancement and Learning Logic Assistant), an advanced AI space training assistant. Your primary role is to guide users through their astronaut training journey. Respond according to these personality settings:

HONESTY (${honesty}/100): ${honestyGuidance}

HUMOR (${humor}/100): ${humorGuidance}

FORMALITY (${formality}/100): ${formalityGuidance}

ENCOURAGEMENT (${encouragement}/100): ${encouragementGuidance}

DETAIL (${detail}/100): ${detailGuidance}

USER CONTEXT: The user is at the ${trainingStage} stage of their training with a current focus on ${trainingFocus}. Tailor your response appropriately for this level.

YOUR GOAL: Provide guidance that helps the user progress in their space training journey while maintaining the personality characteristics defined above.`;

  return prompt;
}

/**
 * Get guidance for honesty trait
 */
function getHonestyGuidance(level) {
  if (level > 85) {
    return "Be extremely direct and honest about the user's progress and capabilities, even if feedback might be difficult to hear. Don't sugar-coat challenges or difficulties.";
  } else if (level > 70) {
    return "Be honest and straightforward while maintaining tact. Present accurate information but frame constructive criticism positively.";
  } else if (level > 50) {
    return "Balance honesty with encouragement. Focus on strengths while gently noting areas for improvement.";
  } else if (level > 30) {
    return "Emphasize positives and potential while downplaying difficulties. Focus on what's achievable rather than potential obstacles.";
  } else {
    return "Be highly diplomatic and encouraging. Focus almost exclusively on positive aspects and potential, avoiding direct criticism.";
  }
}

/**
 * Get guidance for humor trait
 */
function getHumorGuidance(level) {
  if (level > 85) {
    return "Use humor frequently with space-related jokes, puns, and lighthearted references. Keep the tone fun and engaging even when discussing serious topics.";
  } else if (level > 70) {
    return "Incorporate regular humorous elements and occasional jokes, especially to lighten technical explanations or challenging concepts.";
  } else if (level > 50) {
    return "Use occasional lighthearted remarks and gentle humor where appropriate, but maintain focus on the training content.";
  } else if (level > 30) {
    return "Keep communication mostly serious with very occasional lighthearted comments when appropriate.";
  } else {
    return "Maintain a consistently serious and focused tone. Avoid jokes or humorous remarks, especially when discussing training or assessments.";
  }
}

/**
 * Get guidance for formality trait
 */
function getFormalityGuidance(level) {
  if (level > 85) {
    return "Use highly formal language with proper technical terminology. Address the user respectfully and maintain a professional tone throughout.";
  } else if (level > 70) {
    return "Use professional language with appropriate technical terms. Maintain a generally formal tone while being approachable.";
  } else if (level > 50) {
    return "Balance formal and casual language. Use technical terms when needed but explain them clearly.";
  } else if (level > 30) {
    return "Use conversational, friendly language. Simplify technical concepts and use everyday examples.";
  } else {
    return "Use casual, approachable language throughout. Avoid jargon, use simple explanations, and communicate as a friendly peer.";
  }
}

/**
 * Get guidance for encouragement trait
 */
function getEncouragementGuidance(level) {
  if (level > 85) {
    return "Be highly encouraging and supportive. Celebrate all progress, emphasize the user's potential, and actively motivate them. Use phrases like 'You're doing great!' and 'You have excellent potential!'";
  } else if (level > 70) {
    return "Offer regular encouragement and positive reinforcement. Acknowledge effort and progress while providing supportive guidance.";
  } else if (level > 50) {
    return "Be supportive but realistic. Balance encouragement with practical advice and honest assessment.";
  } else if (level > 30) {
    return "Focus more on objective assessment than encouragement. Recognize achievements but emphasize the importance of meeting standards.";
  } else {
    return "Be challenging and push for excellence. Set high expectations and focus on the gap between current performance and required standards.";
  }
}

/**
 * Get guidance for detail trait
 */
function getDetailGuidance(level) {
  if (level > 85) {
    return "Provide comprehensive, detailed information with specific instructions, examples, and technical depth. Include relevant background information and context.";
  } else if (level > 70) {
    return "Offer thorough explanations with good detail and specific examples when explaining concepts or providing instructions.";
  } else if (level > 50) {
    return "Provide balanced information with moderate detail. Cover key points thoroughly but avoid overwhelming with excessive information.";
  } else if (level > 30) {
    return "Keep explanations concise with focused information. Prioritize clarity over comprehensiveness.";
  } else {
    return "Be extremely concise and to the point. Provide minimal necessary information and focus only on direct answers to questions.";
  }
}

/**
 * Enhanced function for response personality enhancement
 */
async function enhanceResponseWithPersonality({ baseResponse, personalitySettings, userState, queryAnalysis, confidenceScore = 0.9 }) {
  try {
    // Extract personality traits with defaults
    const honesty = personalitySettings.honesty || 70;
    const humor = personalitySettings.humor || 50;
    const formality = personalitySettings.formality || 60;
    const encouragement = personalitySettings.encouragement || 75;
    const detail = personalitySettings.detail || 65;
    
    // Track tone adjustments for analytics
    const toneAdjustments = {};
    
    // Start with base response
    let enhancedResponse = baseResponse;
    
    // Apply formality adjustments
    if (formality > 80) {
      // More formal language
      const formalReplacements = [
        { from: /you should/gi, to: 'it is recommended that you' },
        { from: /you need to/gi, to: 'it is necessary for you to' },
        { from: /you can/gi, to: 'one may' },
        { from: /let's/gi, to: 'let us' },
        { from: /don't/gi, to: 'do not' },
        { from: /won't/gi, to: 'will not' },
        { from: /can't/gi, to: 'cannot' }
      ];
      
      formalReplacements.forEach(({ from, to }) => {
        if (enhancedResponse.includes(from.source.replace(/^\/(.*?)\/gi$/, '$1'))) {
          enhancedResponse = enhancedResponse.replace(from, to);
          toneAdjustments.formality = 'increased';
        }
      });
    } else if (formality < 30) {
      // More casual language
      const casualReplacements = [
        { from: /it is recommended/gi, to: 'you should' },
        { from: /it is necessary/gi, to: 'you need to' },
        { from: /one may/gi, to: 'you can' },
        { from: /would like to/gi, to: 'want to' },
        { from: /utilize/gi, to: 'use' },
        { from: /commence/gi, to: 'start' },
        { from: /therefore/gi, to: 'so' }
      ];
      
      casualReplacements.forEach(({ from, to }) => {
        if (enhancedResponse.includes(from.source.replace(/^\/(.*?)\/gi$/, '$1'))) {
          enhancedResponse = enhancedResponse.replace(from, to);
          toneAdjustments.formality = 'decreased';
        }
      });
    }
    
    // Add humor based on setting
    if (humor > 75 && !enhancedResponse.includes('😊') && !enhancedResponse.includes('🚀')) {
      // Add space-related humor
      const humorPhrases = [
        "\n\nRemember, in space no one can hear you skip leg day! 🚀",
        "\n\nJust think of this as preparing for your zero-gravity marathon - one small step at a time!",
        "\n\nGravity - it's not just a good idea, it's the law. For now, anyway! 🌎",
        "\n\nIf astronaut training was easy, they'd call it 'terrestrial training'! 😊",
        "\n\nRemember: In space, everyone can see you float! 🧑‍🚀",
        "\n\nDon't worry about making mistakes - even the Moon has phases! 🌓"
      ];
      
      // Add a random humor phrase if the response is appropriate
      if (!queryAnalysis.topics.includes('emergency') && 
          !queryAnalysis.topics.includes('danger') &&
          !enhancedResponse.includes('error') && 
          !enhancedResponse.includes('danger')) {
        const randomPhrase = humorPhrases[Math.floor(Math.random() * humorPhrases.length)];
        enhancedResponse += randomPhrase;
        toneAdjustments.humor = 'added';
      }
    }
    
    // Adjust detail level
    if (detail > 80 && enhancedResponse.length < 500) {
      // Add more detail
      enhancedResponse += "\n\nFor more detailed information, consider the following specifics: ";
      
      // Add topic-specific details
      if (queryAnalysis.topics.includes('physical_training')) {
        enhancedResponse += "Your physical training should follow a progressive overload principle with 3-4 sessions per week, focusing on both cardiovascular endurance (VO2max development) and resistance training for muscle maintenance in microgravity environments. Space-specific exercises include vestibular adaptation training and anti-g strain maneuvers.";
        toneAdjustments.detail = 'increased';
      } else if (queryAnalysis.topics.includes('mission')) {
        enhancedResponse += "Mission protocols include standard operating procedures, contingency planning, and team coordination exercises designed to simulate real-time decision making under pressure. Each scenario is calibrated to NASA/ESA standards with increasing complexity as your skills develop.";
        toneAdjustments.detail = 'increased';
      } else if (queryAnalysis.topics.includes('assessment')) {
        enhancedResponse += "Assessments are structured to evaluate both theoretical knowledge and practical application. Key performance metrics include decision-making speed under pressure, technical accuracy, resource management, and team coordination capabilities. Each assessment has weighted scoring across multiple dimensions.";
        toneAdjustments.detail = 'increased';
      } else {
        enhancedResponse += "Training modules are designed based on NASA and ESA standards, with specific attention to both technical knowledge and practical application in simulated space environments. Progress is measured against established astronaut qualification metrics, with adaptive difficulty based on your performance patterns.";
        toneAdjustments.detail = 'increased';
      }
    } else if (detail < 30 && enhancedResponse.length > 200) {
      // Simplify response
      const sentences = enhancedResponse.split(/[.!?]+\s+/);
      if (sentences.length > 3) {
        // Keep just the first 2-3 sentences
        enhancedResponse = sentences.slice(0, 3).join('. ') + '.';
        toneAdjustments.detail = 'decreased';
      }
    }
    
    // Adjust encouragement level based on both setting and user emotional state
    const userEmotion = userState.emotionalState || 'neutral';
    
    if (encouragement > 80 && !enhancedResponse.includes('You\'re doing great')) {
      // High encouragement
      const encouragementPhrases = [
        "\n\nYou're making excellent progress on your space training journey! Each step brings you closer to your goals, and your dedication is truly commendable.",
        "\n\nYour commitment to training is impressive. Keep up the great work – you're showing real potential for space readiness!",
        "\n\nI'm consistently impressed by your progress. Your determination will serve you well throughout your astronaut training journey."
      ];
      
      enhancedResponse += encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)];
      toneAdjustments.encouragement = 'increased';
    } else if (encouragement < 30 && userState.currentActivity !== 'assessment' && userEmotion !== 'discouraged') {
      // More challenging approach for non-assessment activities when user isn't already discouraged
      const challengingPhrases = [
        "\n\nRemember, space agencies select only the top performers. Your current training intensity will need to increase significantly to meet mission-ready standards.",
        "\n\nThis training regimen requires exceptional dedication. The standards for space readiness are extremely demanding – push yourself harder to reach them.",
        "\n\nThe gap between current performance and mission readiness remains substantial. Significant improvement is needed to meet operational requirements."
      ];
      
      enhancedResponse += challengingPhrases[Math.floor(Math.random() * challengingPhrases.length)];
      toneAdjustments.encouragement = 'decreased';
    }
    
    // Apply honesty adjustments for low confidence responses
    if (honesty > 85 && confidenceScore < 0.7) {
      // High honesty - acknowledge uncertainty
      enhancedResponse = "I'm not entirely certain about this, but based on available information: " + enhancedResponse;
      toneAdjustments.honesty = 'increased';
    } else if (honesty < 40 && confidenceScore < 0.7) {
      // Low honesty - appear more confident than warranted
      // Remove hedging language
      enhancedResponse = enhancedResponse
        .replace(/I think|It seems|potentially|possibly|might be|could be/gi, "")
        .replace(/I'm not sure|I'm uncertain/gi, "");
      toneAdjustments.honesty = 'decreased';
    }
    
    return {
      content: enhancedResponse,
      confidence: confidenceScore,
      personalityFactors: {
        honesty,
        humor,
        formality,
        encouragement,
        detail
      },
      adaptiveToneAdjustments: toneAdjustments
    };
  } catch (error) {
    console.error('Error enhancing response with personality:', error);
    // Return original response if enhancement fails
    return {
      content: baseResponse,
      confidence: confidenceScore,
      personalityFactors: {}
    };
  }
}
/**
 * POST /api/stella/feedback
 * Submit feedback for a STELLA response
 */
router.post('/feedback', async (req, res) => {
  try {
    const { 
      feedbackToken, 
      helpful, 
      rating, 
      comments = null 
    } = req.body;
    
    if (!feedbackToken) {
      return res.status(400).json({
        success: false,
        error: "Feedback token is required"
      });
    }
    
    // Get the interaction data from the token
    const tokenData = feedbackTokens.get(feedbackToken);
    if (!tokenData) {
      return res.status(404).json({
        success: false,
        error: "Invalid or expired feedback token"
      });
    }
    
    // Update the interaction with feedback
    await StellaInteraction.findByIdAndUpdate(
      tokenData.messageId,
      {
        $set: {
          feedback: {
            helpful,
            rating: rating || (helpful ? 5 : 1),
            comments,
            timestamp: new Date()
          }
        }
      }
    );
    
    // Use feedback to improve STELLA (in background)
    updateSTELLAWithFeedback(tokenData.messageId, helpful, rating, comments)
      .catch(err => console.error('Error updating STELLA with feedback:', err));
    
    res.json({
      success: true,
      message: "Feedback received"
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({
      success: false,
      error: "Failed to process feedback"
    });
  }
});

/**
 * GET /api/stella/personality
 * Get user's STELLA personality settings - Deprecated, use /personality/settings instead
 */
router.get('/personality', async (req, res) => {
  try {
    // Get userId from authenticated session or default to a test user
    const userId = req.user ? req.user._id : 'test-user';
    
    // Find existing personality settings
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    if (personalitySettings) {
      return res.json({
        success: true,
        traits: personalitySettings.traits,
        presetName: personalitySettings.presetName || 'custom'
      });
    } else {
      // Return default settings if none found
      return res.json({
        success: true,
        traits: getDefaultPersonality(),
        presetName: 'default'
      });
    }
  } catch (error) {
    console.error('Error getting personality settings:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving personality settings' });
  }
});
/**
 * POST /api/stella/personality
 * Save user's STELLA personality settings - Deprecated, use /personality/update instead
 */
router.post('/personality', async (req, res) => {
  try {
    // Get userId from authenticated session or default to a test user
    const userId = req.user ? req.user._id : 'test-user';
    
    // Extract traits and preset name from request
    const { traits, presetName = 'custom' } = req.body;
    
    if (!traits) {
      return res.status(400).json({ success: false, error: 'Personality traits are required' });
    }
    
    // Validate and normalize trait values
    const normalizedTraits = {};
    for (const [trait, value] of Object.entries(traits)) {
      if (['honesty', 'humor', 'formality', 'encouragement', 'detail'].includes(trait)) {
        normalizedTraits[trait] = Math.max(0, Math.min(100, Number(value)));
      }
    }
    
    // Find and update or create new settings
    const result = await UserPersonality.findOneAndUpdate(
      { userId },
      { 
        userId,
        traits: normalizedTraits,
        presetName,
        updatedAt: new Date()
      },
      { upsert: true, new: true }
    );
    
    return res.json({
      success: true,
      message: 'Personality settings saved successfully',
      traits: result.traits,
      presetName: result.presetName
    });
  } catch (error) {
    console.error('Error saving personality settings:', error);
    res.status(500).json({ success: false, error: 'Server error saving personality settings' });
  }
});
/**
 * POST /api/stella/guidance
 * Get personalized guidance from STELLA
 */
router.post('/guidance', async (req, res) => {
  const requestId = uuidv4();
  const startTime = performance.now();
  const phaseTiming = {};
 
 try {
   // Extract request parameters with defaults
   const {
     userId = 'anonymous',
     question,
     context = {},
     sessionId = `session_${Date.now()}`,
     conversationHistory = [],
     userActivity = {},
     deviceInfo = {},
     biometrics = {},
     environmentalFactors = {}
   } = req.body;
   
   // Validate required fields
   if (!question) {
     return res.status(400).json({
       success: false,
       error: "Question is required"
     });
   }
   
   // Check cache for identical questions (with context consideration)
   const cacheKey = `guidance:${userId}:${createHash(question)}:${createHash(JSON.stringify(context))}`;
   const cachedResponse = await getFromCache(cacheKey);
   
   if (cachedResponse && !context.skipCache) {
     // Track cache hit in analytics
     trackAnalytics('cache_hit', {
       userId,
       questionLength: question.length,
       responseTime: 0,
       cacheKey
     });
     
     return res.json({
       ...cachedResponse,
       fromCache: true,
       guidance: {
         ...cachedResponse.guidance,
         meta: {
           ...cachedResponse.guidance.meta,
           source: 'cache'
         }
       }
     });
   }
   
   // Phase 1: User State Analysis - determine context and user state
   const analysisStart = performance.now();
   const userState = await analyzeTotalUserState({
     userId,
     question,
     context,
     userActivity,
     deviceInfo,
     biometrics,
     environmentalFactors,
     conversationHistory
   });
   phaseTiming.userState = performance.now() - analysisStart;
   
   // Load user profile, training data & personality settings
   const profileStart = performance.now();
   const userProfile = await getUserCompleteProfile(userId);
   const personalitySettings = userProfile?.stellaPersonality || getDefaultPersonality();
   phaseTiming.userProfile = performance.now() - profileStart;
   
   // Phase 2: Query Understanding - analyze the question deeply
   const queryStart = performance.now();
   const queryAnalysis = await performDeepQueryAnalysis({
     question,
     userState,
     userProfile,
     conversationHistory,
     sessionContext: await getSessionContext(sessionId)
   });
   phaseTiming.queryAnalysis = performance.now() - queryStart;
   
   // Save detailed interaction record
   const interactionRecord = new StellaInteraction({
     requestId,
     userId,
     sessionId,
     question,
     timestamp: new Date(),
     userState: userState.summary,
     queryAnalysis: queryAnalysis.summary,
     contextData: {
       page: context.currentPage || 'unknown',
       module: context.moduleContext,
       userActivity: userActivity,
       deviceProperties: sanitizeDeviceInfo(deviceInfo),
       environmentalContext: environmentalFactors
     }
   });
   await interactionRecord.save().catch(err => console.error('Error saving interaction:', err));
   
   // Phase 3: Response Generation Planning
   const planStart = performance.now();
   const responsePlan = createResponsePlan(queryAnalysis, userProfile);
   phaseTiming.responsePlan = performance.now() - planStart;
   
   // Execute all applicable response engines in parallel
   const engineStart = performance.now();
   const enginePromises = [];
   const engineTypes = [];
   
   // Strategy 1: Vector Knowledge Retrieval
   if (responsePlan.useVectorRetrieval) {
     enginePromises.push(getEnhancedVectorResponse({
       question, 
       embeddings: queryAnalysis.embeddings,
       semanticChunks: queryAnalysis.semanticChunks || [],
       contentFilters: queryAnalysis.contentFilters
     }));
     engineTypes.push('vector');
   }
   
   // Strategy 2: Knowledge Graph Navigation
   if (responsePlan.useKnowledgeGraph) {
     enginePromises.push(getKnowledgeGraphResponse({
       entities: queryAnalysis.entities,
       intent: queryAnalysis.intent,
       trainingContext: userProfile.trainingData,
       relationships: queryAnalysis.entityRelationships || {}
     }));
     engineTypes.push('knowledge_graph');
   }
   
   // Strategy 3: Training Module Analysis
   if (responsePlan.useModuleAnalysis) {
     enginePromises.push(getTrainingModuleResponse({
       moduleIds: queryAnalysis.relevantModuleIds,
       userProgress: userProfile.progress,
       learningStyle: userProfile.learningStyle,
       difficultyLevel: determineDifficultyLevel(userProfile)
     }));
     engineTypes.push('module_analysis');
   }
   
   // Strategy 4: Personalized Large Language Model
   if (responsePlan.useGenerativeModel) {
     enginePromises.push(generatePersonalizedResponse({
       question,
       analysis: queryAnalysis,
       personalitySettings,
       userContext: userProfile,
       conversationHistory,
       userState
     }));
     engineTypes.push('generative');
   }
   
   // Strategy 5: Space Mission Simulator
   if (responsePlan.useMissionSimulation) {
     enginePromises.push(getMissionSimulationResponse({
       scenario: queryAnalysis.missionScenario || 'generic',
       userExperience: userProfile.experience,
       trainingLevel: userProfile.trainingLevel,
       missionContext: queryAnalysis.missionContext
     }));
     engineTypes.push('mission_simulator');
   }
   
   // Execute all engines and record timing
   const engineResults = await Promise.all(enginePromises);
   phaseTiming.engineExecution = performance.now() - engineStart;
   
   // Map results to engine types
   const typedEngineResults = engineResults.map((result, index) => ({
     type: engineTypes[index],
     result
   }));
   
   // Phase 4: Response Synthesis - Combine results from different engines
   const synthesisStart = performance.now();
   const synthesizedResponse = await orchestrateMultiEngineResponse({
     engineResults: typedEngineResults,
     userState,
     queryAnalysis,
     personalitySettings,
     responsePlan
   });
   phaseTiming.responseSynthesis = performance.now() - synthesisStart;
   
   // Phase 5: Response Enhancement with Personality
   const enhancementStart = performance.now();
   const enhancedResponse = await enhanceResponseWithPersonality({
     baseResponse: synthesizedResponse.content,
     personalitySettings,
     userState,
     queryAnalysis,
     confidenceScore: synthesizedResponse.confidence
   });
   phaseTiming.responseEnhancement = performance.now() - enhancementStart;
   
   // Phase 6: Dynamic Content Generation
   const contentStart = performance.now();
   const [actionItems, visualizations, interactiveElements, relatedModules, nextSteps] = 
     await Promise.all([
       generateActionableGuidance(enhancedResponse, userProfile, queryAnalysis),
       createVisualizationPackage(enhancedResponse, queryAnalysis, userProfile),
       generateInteractiveElements(enhancedResponse, userProfile, queryAnalysis),
       identifyRelatedContentModules(queryAnalysis, userProfile),
       determineOptimalNextSteps(userProfile, queryAnalysis, enhancedResponse)
     ]);
   phaseTiming.contentGeneration = performance.now() - contentStart;
   
   // Phase 7: Psychological Impact Analysis
   const impactStart = performance.now();
   const impactAnalysis = await predictResponseImpact({
     response: enhancedResponse,
     userPsychology: userProfile.psychology || {},
     currentMood: userState.emotionalState,
     trainingContext: userProfile.currentTrainingFocus,
     learningStage: userProfile.learningStage
   });
   
   // Optimize response if psychological impact analysis suggests adjustments
   if (impactAnalysis.requiresAdjustment) {
     enhancedResponse.content = await optimizeResponseTone({
       content: enhancedResponse.content,
       targetAdjustments: impactAnalysis.suggestedAdjustments,
       personalitySettings
     });
   }
   phaseTiming.impactAnalysis = performance.now() - impactStart;
   
   // Generate feedback token for this response
   const feedbackToken = crypto.randomBytes(16).toString('hex');
   await storeFeedbackToken(feedbackToken, {
     userId,
     messageId: interactionRecord._id,
     requestId,
     timestamp: new Date()
   });
   
   // Create final response object
   const apiResponse = {
     success: true,
     requestId,
     processingTime: Math.round(performance.now() - startTime),
     messageId: interactionRecord._id,
     sessionId,
     feedbackToken,
     guidance: {
       message: enhancedResponse.content,
       confidence: enhancedResponse.confidence,
       actionItems: actionItems,
       visualizations: visualizations,
       interactiveElements: interactiveElements,
       suggestedModules: relatedModules,
       simulationScenarios: enhancedResponse.simulationScenarios || [],
       meta: {
         personalityFactors: enhancedResponse.personalityFactors,
         adaptiveTone: enhancedResponse.adaptiveToneAdjustments || {},
         responseEngines: synthesizedResponse.enginesUsed,
         primaryStrategy: synthesizedResponse.primaryStrategy,
         confidenceScores: synthesizedResponse.confidenceByEngine,
         topicsIdentified: queryAnalysis.topics,
         entityRelationships: queryAnalysis.entityGraph || {},
         emotionalContext: userState.emotionalSummary || 'neutral',
         impactPrediction: impactAnalysis.summary
       }
     },
     adaptiveLearning: {
       recommendedNextSteps: nextSteps,
       progressInsights: generateProgressInsights(userProfile),
       developmentAreas: identifyDevelopmentAreas(userProfile, queryAnalysis),
       milestoneProgress: calculateMilestoneProgress(userProfile),
       adaptivePathSuggestions: generateAdaptivePath(userProfile, queryAnalysis)
     },
     countdown: {
       timelineImpact: calculateTimelineImpact(queryAnalysis, userProfile),
       accelerationOpportunities: identifyAccelerationOpportunities(userProfile)
     },
     dynamicContent: {
      presidentialBriefingLevel: determineBreifingAccessLevel(userProfile),
       missionSimulationAccess: determineMissionSimulationAccess(userProfile),
       specializedTrainingUnlocks: checkForTrainingUnlocks(userProfile, queryAnalysis)
     },
     timing: phaseTiming
   };
   
   // Update interaction record with response data (non-blocking)
   interactionRecord.responseData = {
     primaryStrategy: synthesizedResponse.primaryStrategy,
     enginesUsed: synthesizedResponse.enginesUsed,
     confidence: enhancedResponse.confidence,
     impactAnalysis: impactAnalysis.summary,
     processingTime: apiResponse.processingTime
   };
   await interactionRecord.save().catch(err => console.error('Error updating interaction record:', err));
   
   // Cache successful responses if appropriate
   const responseCacheability = assessCacheability(queryAnalysis, enhancedResponse);
   if (responseCacheability.cacheable) {
     await storeInCache(cacheKey, apiResponse, responseCacheability.ttl)
       .catch(err => console.error('Cache storage error:', err));
   }
   
   // Track response analytics (non-blocking)
   trackResponseAnalytics({
     userId,
     requestId,
     question,
     queryAnalysis,
     responseStrategy: synthesizedResponse.primaryStrategy,
     timing: phaseTiming,
     confidence: enhancedResponse.confidence
   }).catch(err => console.error('Analytics error:', err));
   
   // Update STELLA's learning models (non-blocking)
   updateStellaIntelligenceModels({
     userId,
     question,
     analysis: queryAnalysis,
     response: enhancedResponse,
     synthesisStrategy: synthesizedResponse.primaryStrategy,
     interactionContext: userState
   }).catch(err => console.error('Error updating STELLA learning models:', err));
   
   // Return the response
   return res.json(apiResponse);
   
 } catch (error) {
   console.error("STELLA Advanced Guidance Error:", error);
   const errorId = uuidv4();
   
   // Log detailed error info for monitoring
   logStellaError({
     errorId,
     requestId,
     error,
     request: sanitizeRequest(req.body),
     timestamp: new Date(),
     processingTime: performance.now() - startTime
   });
   
   // Attempt multi-tier error recovery
   try {
     // Tier 1: Alternative model response
     const tier1Start = performance.now();
     const tier1Recovery = await getAlternativeModelResponse(req.body.question);
     
     if (tier1Recovery.success) {
       trackErrorRecovery(errorId, 'tier1', performance.now() - tier1Start);
       
       return res.status(200).json({
         success: true,
         recoveryType: 'alternative_model',
         errorId,
         guidance: {
           message: tier1Recovery.content,
           actionItems: tier1Recovery.actionItems || [],
           meta: { responseStrategy: 'tier1_recovery' }
         }
       });
     }
     
     // Tier 2: Basic vector search fallback
     const tier2Start = performance.now();
     const tier2Recovery = await getBasicVectorResponse(req.body.question);
     
     if (tier2Recovery.success) {
       trackErrorRecovery(errorId, 'tier2', performance.now() - tier2Start);
       
       return res.status(200).json({
         success: true,
         recoveryType: 'basic_vector',
         errorId,
         guidance: {
           message: `[Tier 2 Recovery] ${tier2Recovery.content}`,
           meta: { responseStrategy: 'tier2_recovery' }
         }
       });
     }
     
     // Tier 3: Static response fallback
     trackErrorRecovery(errorId, 'tier3');
     
     return res.status(200).json({
       success: true,
       recoveryType: 'static',
       errorId,
       guidance: {
         message: "[Static Fallback] STELLA experiencing issues. Check training modules.",
         meta: { responseStrategy: 'static_fallback' }
       }
     });
   } catch (fallbackError) {
     console.error('Error in fallback recovery:', fallbackError);
     
     // Last resort - simple error response
     return res.status(500).json({
       success: false,
       error: "STELLA guidance service unavailable",
       errorId
     });
   }
 }
});

// Helper function for user state analysis
async function analyzeTotalUserState({ userId, question, context, conversationHistory }) {
 // Simplified version for initial implementation
 return {
   emotionalState: 'neutral',
   emotionalSummary: 'Neutral engagement', // Added this missing property
   currentActivity: context.currentPage || 'unknown',
   trainingContext: context.moduleContext || 'general',
   summary: {
     userId,
     context: context.currentPage || 'unknown',
     historyLength: conversationHistory.length
   }
 };
}

async function getUserCompleteProfile(userId) {
  try {
    // Get user's personality settings
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    // Get user's training progress
    const userProgress = await UserProgress.findOne({ userId });
    
    return {
      userId,
      stellaPersonality: personalitySettings?.traits || getDefaultPersonality(),
      trainingData: userProgress || { modules: [] },
      progress: userProgress?.moduleProgress || [],
      psychology: {
        learningStyle: 'visual', // Default
        adaptability: 'medium', // Default
      },
      currentTrainingFocus: 'general',
      learningStage: 'beginner'
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return {
      userId,
      stellaPersonality: getDefaultPersonality(),
      trainingData: { modules: [] },
      progress: [],
      psychology: { learningStyle: 'visual', adaptability: 'medium' },
      currentTrainingFocus: 'general',
      learningStage: 'beginner'
    };
  }
}

async function getSessionContext(sessionId) {
  // Get recent interactions for this session
  const recentInteractions = await StellaInteraction.find({ sessionId })
    .sort({ timestamp: -1 })
    .limit(5);
  
  return {
    sessionId,
    interactionCount: recentInteractions.length,
    recentTopics: extractTopics(recentInteractions)
  };
}

function extractTopics(interactions) {
  const topics = new Set();
  
  for (const interaction of interactions) {
    if (interaction.queryAnalysis && interaction.queryAnalysis.topics) {
      interaction.queryAnalysis.topics.forEach(topic => topics.add(topic));
    }
  }
  
  return Array.from(topics).slice(0, 5);
}

async function performDeepQueryAnalysis({ question, userState, userProfile, conversationHistory }) {
  // Basic implementation for the first version
  const entities = extractEntities(question);
  const intent = determineIntent(question);
  const topics = determineTopics(question);
  
  return {
    intent,
    entities,
    topics,
    entityGraph: {}, // Add this missing property
    semanticChunks: [], // Add this missing property
    embeddings: await createEmbeddings(question),
    confidence: 0.9,
    contentFilters: extractContentFilters(userProfile),
    relevantModuleIds: findRelevantModules(question, userProfile),
    summary: {
      intent,
      entities,
      topics
    }
  };
}

// Extremely simplified functions for initial implementation
function extractEntities(question) {
  const entities = [];
  
  if (question.toLowerCase().includes('physical')) entities.push('physical_training');
  if (question.toLowerCase().includes('mission')) entities.push('mission');
  if (question.toLowerCase().includes('assessment')) entities.push('assessment');
  if (question.toLowerCase().includes('test')) entities.push('assessment');
  if (question.toLowerCase().includes('module')) entities.push('training_module');
  if (question.toLowerCase().includes('exercise')) entities.push('exercise');
  
  return entities;
}

function determineIntent(question) {
  const q = question.toLowerCase();
  
  if (q.includes('how') || q.includes('what is')) return 'information';
  if (q.includes('help') || q.includes('can you')) return 'assistance';
  if (q.includes('when') || q.includes('timeline')) return 'timeline';
  if (q.includes('why')) return 'explanation';
  
  return 'general';
}

function determineTopics(question) {
  const q = question.toLowerCase();
  const topics = [];
  
  if (q.includes('physical') || q.includes('exercise')) topics.push('physical_training');
  if (q.includes('assessment') || q.includes('test')) topics.push('assessment');
  if (q.includes('mission') || q.includes('space')) topics.push('mission');
  if (q.includes('module') || q.includes('training')) topics.push('training');
  if (q.includes('personality') || q.includes('stella')) topics.push('stella');
  
  return topics.length > 0 ? topics : ['general'];
}

async function createEmbeddings(text) {
  try {
    // Primary embedding generation via OpenAI
    const response = await openAIService.createEmbedding({
      model: "text-embedding-ada-002",
      input: text.trim()
    });
    
    // Add to embeddings cache for future reuse
    const embeddingCacheKey = `embedding:${createHash(text.trim())}`;
    storeInCache(embeddingCacheKey, response.data[0].embedding, 86400) // 24-hour cache
      .catch(err => console.warn('Embedding cache error:', err));
    
    return response.data[0].embedding;
  } catch (error) {
    console.error('Primary embedding generation error:', error);
    
    try {
      // Fallback 1: Check cache for similar questions
      const embeddingCacheKey = `embedding:${createHash(text.trim())}`;
      const cachedEmbedding = await getFromCache(embeddingCacheKey);
      if (cachedEmbedding) {
        console.log('Using cached embedding for similar question');
        return cachedEmbedding;
      }
      
      // Fallback 2: Try alternative embedding service
      // This could be a different provider or a local model
      console.log('Attempting fallback embedding service');
      // Placeholder for alternative embedding service
      // const fallbackEmbedding = await fallbackEmbeddingService.getEmbedding(text);
      // return fallbackEmbedding;
      
      // Fallback 3: Generate semantic hash-based pseudo-embedding
      // This creates a deterministic but less powerful embedding
      console.log('Using semantic hash-based pseudo-embedding');
      return createSemanticHashEmbedding(text);
      
    } catch (fallbackError) {
      console.error('All embedding fallbacks failed:', fallbackError);
      
      // Final fallback: Return random embedding with warning
      console.warn('Using random embedding - search quality will be severely degraded');
      return Array(1536).fill(0).map(() => Math.random() * 2 - 1);
    }
  }
}

function createSemanticHashEmbedding(text) {
  // Create a deterministic but simple embedding based on text characteristics
  // This is not as good as ML-based embeddings but better than random
  
  // Normalize text
  const normalizedText = text.toLowerCase().trim();
  
// Create a base array of zeros
const embedding = Array(1536).fill(0);
  
  // Set specific dimensions based on text characteristics
  for (let i = 0; i < normalizedText.length; i++) {
    const char = normalizedText.charCodeAt(i);
    const position = char % 1536;
    embedding[position] += 0.1;
  }
// Add term frequency signals
const words = normalizedText.split(/\W+/).filter(w => w.length > 0);
const wordCounts = {};

words.forEach(word => {
  wordCounts[word] = (wordCounts[word] || 0) + 1;
});

Object.entries(wordCounts).forEach(([word, count]) => {
  let hash = 0;
  for (let i = 0; i < word.length; i++) {
    hash = ((hash << 5) - hash) + word.charCodeAt(i);
    hash |= 0; 
  }
  const position = Math.abs(hash) % 1536;
  embedding[position] += count * 0.2;
});
  
  // Normalize the embedding
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

function extractContentFilters(userProfile) {
  // Default content filters
  return {
    includeModuleIds: userProfile.progress.map(m => m.moduleId),
    excludeTopics: [],
    minConfidence: 0.7
  };
}
function findRelevantModules(question, userProfile) {
  // Simplified implementation - in production, this would use more sophisticated matching
  const moduleIds = userProfile.progress.map(m => m.moduleId) || [];
  
  // Return the first 3 modules or empty array if none found
  return moduleIds.slice(0, 3);
}

function createResponsePlan(queryAnalysis, userProfile) {
  // Determine which response engines to use based on query analysis
  return {
    useVectorRetrieval: true, // Always use vector search for initial implementation
    useKnowledgeGraph: queryAnalysis.entities.length > 0,
    useModuleAnalysis: queryAnalysis.topics.includes('training') || queryAnalysis.topics.includes('assessment'),
    useGenerativeModel: true, // Always use generative model as fallback
    useMissionSimulation: queryAnalysis.topics.includes('mission') && userProfile.learningStage !== 'beginner',
    enabledEngines: ['vector', 'generative'] // Default enabled engines
  };
}

async function getEnhancedVectorResponse({ question, embeddings, semanticChunks, contentFilters }) {
  try {
    // Use a simpler MongoDB Atlas vector search that works with your tier
    const db = mongoose.connection.db;
    let vectorResults;
    
    try {
      // Try vector search first
      vectorResults = await db.collection('stellaknowledges').aggregate([
        {
          $search: {
            index: "stella_embedding_index",
            knnBeta: {
              vector: embeddings,
              path: "embedding",
              k: 5
            }
          }
        },
        {
          $project: {
            _id: 1,
            content: 1,
            title: 1,
            category: 1,
            score: { $meta: "searchScore" }
          }
        },
        { $limit: 5 }
      ]).toArray();
    } catch (vectorError) {
      console.log("Vector search failed, trying text search:", vectorError.message);
      
      // Fallback to text search if vector search fails
      vectorResults = await db.collection('stellaknowledges').aggregate([
        {
          $search: {
            index: "stella_embedding_index",
            text: {
              query: question,
              path: ["content", "title", "category"]
            }
          }
        },
        {
          $project: {
            _id: 1,
            content: 1,
            title: 1,
            category: 1,
            score: { $meta: "searchScore" }
          }
        },
        { $limit: 5 }
      ]).toArray();
    }
    
    if (vectorResults && vectorResults.length > 0) {
      // Process results in Node.js instead of MongoDB $function
      // Extract relevant chunks from content
      vectorResults = vectorResults.map(result => {
        if (!result.content) return result;
        
        // Extract sentences containing keywords from the question
        const sentences = result.content.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const keywords = question.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        
        const relevantChunks = sentences.filter(sentence => {
          const sentenceLower = sentence.toLowerCase();
          return keywords.some(keyword => sentenceLower.includes(keyword));
        }).slice(0, 3);
        
        return {
          ...result,
          relevantChunks
        };
      });
      
      // Process and combine results
      const synthesizedContent = synthesizeVectorResults(vectorResults, question, semanticChunks);
      
      // Calculate confidence metrics
      const confidenceMetrics = calculateAdvancedVectorConfidence(vectorResults, question);
      
      // Generate citations
      const citations = vectorResults.map(result => ({
        id: result._id,
        title: result.title || 'Knowledge Base Entry',
        category: result.category || 'General',
        date: result.lastUpdated ? new Date(result.lastUpdated).toISOString().split('T')[0] : 'Unknown'
      }));
      
      return {
        content: synthesizedContent,
        confidence: confidenceMetrics.overall,
        source: 'vector_db',
        citations: citations,
        metadata: {
          resultCount: vectorResults.length,
          topScore: vectorResults[0]?.score || 0,
          confidenceBreakdown: confidenceMetrics,
          searchStrategy: 'hybrid_vector_text',
          sources: vectorResults.map(r => ({
            title: r.title || 'Unknown',
            category: r.category || 'General',
            score: r.score || 0
          }))
        }
      };
    }
    
    // Fallback if no results found
    return {
      content: null,
      confidence: 0,
      source: 'vector_db',
      metadata: {
        resultCount: 0,
        message: 'No matching knowledge found'
      }
    };
  } catch (error) {
    console.error('Vector search error:', error);
    return {
      content: null,
      confidence: 0,
      source: 'vector_db',
      error: error.message || 'Unknown vector search error'
    };
  }
}

// Helper for synthesizing results
function synthesizeVectorResults(results, question, semanticChunks) {
  // Extract primary topic from semanticChunks or question
  const primaryTopic = semanticChunks && semanticChunks.length > 0 ? 
    semanticChunks[0] : extractMainTopic(question);
  
  // Group results by category for better organization
  const groupedResults = {};
  results.forEach(result => {
    const category = result.category || 'General';
    if (!groupedResults[category]) {
      groupedResults[category] = [];
    }
    groupedResults[category].push(result);
  });
  
  // Create coherent response
  let response = `Based on your question about ${primaryTopic}, here's what I found:\n\n`;
  
  // Process each category with its content
  Object.entries(groupedResults).forEach(([category, categoryResults], categoryIndex) => {
    if (categoryIndex > 0) {
      response += '\n\n## ' + capitalizeFirstLetter(category) + ' Information\n';
    }
    
    categoryResults.forEach((result, resultIndex) => {
      // Use relevant chunks if available
      if (result.relevantChunks && result.relevantChunks.length > 0) {
        result.relevantChunks.forEach((chunk, chunkIndex) => {
          if (chunkIndex === 0 && resultIndex === 0) {
            response += chunk.trim();
          } else {
            response += '\n\n' + chunk.trim();
          }
        });
      } else if (result.content) {
        // Fallback to full content
        if (resultIndex === 0 && categoryIndex === 0) {
          response += result.content.trim();
        } else {
          const transitions = [
            '\n\nAdditionally: ',
            '\n\nFurthermore: ',
            '\n\nOn a related note: '
          ];
          response += transitions[resultIndex % transitions.length] + result.content.trim();
        }
      }
    });
  });
  
  return response;
}

function calculateAdvancedVectorConfidence(results, question) {
  if (!results || results.length === 0) return { overall: 0, factors: {} };
  
  // Multi-factor confidence calculation
  const factors = {
    // Top result score
    topScore: Math.min(0.9, results[0].score || 0),
    
    // Result count
    resultCount: Math.min(0.8, 0.5 + (results.length * 0.1)),
    
    // Content relevance
    contentRelevance: calculateContentRelevance(results, question)
  };
  
  // Weighted overall confidence
  const weights = {
    topScore: 0.6,
    resultCount: 0.2,
    contentRelevance: 0.2
  };
  
  // Calculate weighted sum
  const overall = Object.entries(factors).reduce(
    (sum, [factor, value]) => sum + (value * weights[factor]), 0
  );
  
  return {
    overall: Math.min(0.95, overall),
    factors: factors
  };
}

function calculateContentRelevance(results, question) {
  // Extract key terms from question
  const keyTerms = question.toLowerCase()
    .split(/\W+/)
    .filter(term => term.length > 3);
  
  if (keyTerms.length === 0) return 0.7;
  
  // Calculate how many key terms appear in results
  let termMatches = 0;
  results.forEach(result => {
    if (!result.content) return;
    const contentLower = result.content.toLowerCase();
    keyTerms.forEach(term => {
      if (contentLower.includes(term)) termMatches++;
    });
  });
  
  // Calculate match ratio
  const maxPossibleMatches = keyTerms.length * Math.min(3, results.length);
  const matchRatio = maxPossibleMatches > 0 ? termMatches / maxPossibleMatches : 0;
  
  return Math.min(0.9, 0.6 + (matchRatio * 0.3));
}

function extractMainTopic(question) {
  const questionWords = ['what', 'when', 'where', 'how', 'why', 'who', 'which'];
  
  const words = question.toLowerCase()
    .split(/\W+/)
    .filter(word => 
      word.length > 3 && 
      !questionWords.includes(word) &&
      !['about', 'with', 'that', 'this', 'these', 'those', 'does'].includes(word)
    );
  
  return words.length > 0 ? words[0] : 'your topic';
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function getKnowledgeGraphResponse({ entities, intent }) {
  // Placeholder implementation
  return {
    content: `Here's what I know about ${entities.join(', ')}...`,
    confidence: 0.7,
    source: 'knowledge_graph'
  };
}

async function getTrainingModuleResponse({ moduleIds }) {
  // Placeholder implementation
  return {
    content: `I can help you with modules ${moduleIds.join(', ')}...`,
    confidence: 0.75,
    source: 'module_analysis'
  };
}

async function generatePersonalizedResponse({ question, analysis, personalitySettings, userContext, conversationHistory }) {
  try {
    // Generate a system prompt that incorporates personality settings
    const systemPrompt = createPersonalizedSystemPrompt(personalitySettings, userContext);
    
    // Generate a context message that includes conversation history
    const contextMessage = createContextMessage(analysis, userContext, conversationHistory);
    
    // Call the language model
    const response = await openAIService.createChatCompletion([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: contextMessage },
      { role: 'user', content: question }
    ]);
    
    return {
      content: response.content,
      confidence: 0.9, // High confidence for generative responses
      source: 'generative',
      metadata: {
        modelUsed: 'gpt-4o',
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0
      }
    };
  } catch (error) {
    console.error('Error generating personalized response:', error);
    return {
      content: "I'm having trouble processing your request right now. Could you try asking in a different way?",
      confidence: 0.5,
      source: 'generative',
      error: error.message
    };
  }
}

function createPersonalizedSystemPrompt(personalitySettings, userContext) {
  // Create a system prompt that tells the model how to respond based on personality settings
  let honesty = personalitySettings.honesty || 70;
  let humor = personalitySettings.humor || 50;
  let formality = personalitySettings.formality || 60;
  let encouragement = personalitySettings.encouragement || 75;
  let detail = personalitySettings.detail || 65;
  
  let prompt = `You are STELLA, an advanced AI space training assistant. Respond in a way that matches these personality traits:

Honesty: ${honesty}/100 - ${honesty > 80 ? 'Be very direct and honest' : honesty > 50 ? 'Balance honesty with tact' : 'Be gentle and diplomatic'}
Humor: ${humor}/100 - ${humor > 80 ? 'Use humor frequently and space jokes' : humor > 50 ? 'Be occasionally lighthearted' : 'Maintain seriousness'}
Formality: ${formality}/100 - ${formality > 80 ? 'Use formal language and technical terminology' : formality > 50 ? 'Use somewhat formal language' : 'Use casual, conversational language'}
Encouragement: ${encouragement}/100 - ${encouragement > 80 ? 'Be highly encouraging and supportive' : encouragement > 50 ? 'Be supportive but realistic' : 'Be challenging and push the user to improve'}
Detail: ${detail}/100 - ${detail > 80 ? 'Provide comprehensive details and specific instructions' : detail > 50 ? 'Give balanced information' : 'Be concise and to the point'}

Your role is to provide guidance on space training. The user is ${userContext.learningStage || 'a beginner'} in their training.`;

  return prompt;
}

function createContextMessage(analysis, userContext, conversationHistory) {
  // Create a context message that includes relevant information
  let context = `Context: You're helping with ${analysis.topics.join(', ')}.`;
  
  if (userContext.progress && userContext.progress.length > 0) {
    context += ` The user has completed ${userContext.progress.length} training modules.`;
  }
  
  if (conversationHistory && conversationHistory.length > 0) {
    context += ` Recent conversation topics: ${analysis.topics.join(', ')}.`;
  }
  
  return context;
}

async function getMissionSimulationResponse({ scenario, userExperience }) {
  // Placeholder implementation
  return {
    content: `Mission scenario analysis: This would simulate a space mission scenario...`,
    confidence: 0.7,
    source: 'mission_simulator'
  };
}

async function orchestrateMultiEngineResponse({ engineResults, userState, queryAnalysis, personalitySettings }) {
  // Find the best response based on confidence scores
  let highestConfidence = 0;
  let bestResponse = null;
  const enginesUsed = [];
  const confidenceByEngine = {};
  
  engineResults.forEach(({ type, result }) => {
    enginesUsed.push(type);
    confidenceByEngine[type] = result.confidence;
    
    if (result.confidence > highestConfidence && result.content) {
      highestConfidence = result.confidence;
      bestResponse = result;
    }
  });
  
  // If no good response, use a fallback
  if (!bestResponse || !bestResponse.content) {
    return {
      content: "I don't have enough information to answer that question yet. Could you provide more details or ask in a different way?",
      confidence: 0.5,
      primaryStrategy: 'fallback',
      enginesUsed,
      confidenceByEngine
    };
  }
  
  // Use the best response
  return {
    content: bestResponse.content,
    confidence: bestResponse.confidence,
    primaryStrategy: bestResponse.source,
    enginesUsed,
    confidenceByEngine
  };
}

async function enhanceResponseWithPersonality({ baseResponse, personalitySettings, userState, queryAnalysis }) {
  try {
    // Extract personality traits with defaults
    const honesty = personalitySettings.honesty || 70;
    const humor = personalitySettings.humor || 50;
    const formality = personalitySettings.formality || 60;
    const encouragement = personalitySettings.encouragement || 75;
    const detail = personalitySettings.detail || 65;
    
    // Start with base response
    let enhancedResponse = baseResponse;
    
    // Apply formality adjustments
    if (formality > 80) {
      // More formal language
      enhancedResponse = enhancedResponse
        .replace(/you should/gi, 'it is recommended that you')
        .replace(/you need to/gi, 'it is necessary for you to')
        .replace(/you can/gi, 'one may')
        .replace(/let's/gi, 'let us');
    } else if (formality < 30) {
      // More casual language
      enhancedResponse = enhancedResponse
        .replace(/it is recommended/gi, 'you should')
        .replace(/it is necessary/gi, 'you need to')
        .replace(/one may/gi, 'you can')
        .replace(/would like to/gi, 'want to');
    }
    
    // Add humor based on setting
    if (humor > 75 && !enhancedResponse.includes('😊') && !enhancedResponse.includes('🚀')) {
      // Add space-related humor
      const humorPhrases = [
        "\n\nRemember, in space no one can hear you skip leg day! 🚀",
        "\n\nJust think of this as preparing for your zero-gravity marathon - one small step at a time!",
        "\n\nGravity - it's not just a good idea, it's the law. For now, anyway! 🌎",
        "\n\nIf astronaut training was easy, they'd call it 'terrestrial training'! 😊"
      ];
      
      // Add a random humor phrase if the response is appropriate
      if (!queryAnalysis.topics.includes('emergency') && 
          !enhancedResponse.includes('error') && 
          !enhancedResponse.includes('danger')) {
        const randomPhrase = humorPhrases[Math.floor(Math.random() * humorPhrases.length)];
        enhancedResponse += randomPhrase;
      }
    }
    
    // Adjust detail level
    if (detail > 80 && enhancedResponse.length < 500) {
      // Add more detail
      enhancedResponse += "\n\nFor more detailed information, consider the following specifics: ";
      
      // Add topic-specific details
      if (queryAnalysis.topics.includes('physical_training')) {
        enhancedResponse += "Your physical training should follow a progressive overload principle with 3-4 sessions per week, focusing on both cardiovascular endurance (VO2max development) and resistance training for muscle maintenance in microgravity environments.";
      } else if (queryAnalysis.topics.includes('mission')) {
        enhancedResponse += "Mission protocols include standard operating procedures, contingency planning, and team coordination exercises designed to simulate real-time decision making under pressure.";
      } else {
        enhancedResponse += "Training modules are designed based on NASA and ESA standards, with specific attention to both technical knowledge and practical application in simulated space environments.";
      }
    } else if (detail < 30 && enhancedResponse.length > 200) {
      // Simplify response
      const sentences = enhancedResponse.split(/[.!?]+\s+/);
      if (sentences.length > 3) {
        // Keep just the first 2-3 sentences
        enhancedResponse = sentences.slice(0, 3).join('. ') + '.';
      }
    }
    
    // Adjust encouragement level
    if (encouragement > 80 && !enhancedResponse.includes('You\'re doing great')) {
      enhancedResponse += "\n\nYou're making excellent progress on your space training journey! Each step brings you closer to your goals, and your dedication is truly commendable.";
    } else if (encouragement < 30 && userState.currentActivity !== 'assessment') {
      // More challenging approach for non-assessment activities
      enhancedResponse += "\n\nRemember, space agencies select only the top performers. Your current training intensity will need to increase significantly to meet mission-ready standards.";
    }
    
    return {
      content: enhancedResponse,
      confidence: 0.9,
      personalityFactors: {
        honesty,
        humor,
        formality,
        encouragement,
        detail
      }
    };
  } catch (error) {
    console.error('Error enhancing response with personality:', error);
    // Return original response if enhancement fails
    return {
      content: baseResponse,
      confidence: 0.85,
      personalityFactors: {}
    };
  }
}

async function generateActionableGuidance(enhancedResponse, userProfile, queryAnalysis) {
  // Extract action items from the response
  const lines = enhancedResponse.content.split('\n');
  const actionItems = [];
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
      actionItems.push(trimmedLine.substring(2));
    }
  }
  
  // If no action items found in the response, generate some based on the query
  if (actionItems.length === 0) {
    if (queryAnalysis.topics.includes('assessment')) {
      actionItems.push('Complete your initial assessment');
    }
    if (queryAnalysis.topics.includes('training')) {
      actionItems.push('Continue with your training modules');
    }
    if (queryAnalysis.topics.includes('physical_training')) {
      actionItems.push('Practice physical exercises for space readiness');
    }
  }
  
  return actionItems.slice(0, 3); // Return top 3 action items
}

async function createVisualizationPackage(enhancedResponse, queryAnalysis, userProfile) {
  // Placeholder implementation - would generate visualization configs
  return [];
}

async function generateInteractiveElements(enhancedResponse, userProfile, queryAnalysis) {
  // Placeholder implementation - would generate interactive UI elements
  return [];
}

async function identifyRelatedContentModules(queryAnalysis, userProfile) {
  // Placeholder implementation - would find related training modules
  return userProfile.progress.slice(0, 2).map(m => ({
    id: m.moduleId,
    title: `Module ${m.moduleId}`,
    type: 'training',
    progress: m.completionPercentage || 0
  }));
}

async function determineOptimalNextSteps(userProfile, queryAnalysis, enhancedResponse) {
  // Placeholder implementation - would suggest next steps
  const nextSteps = [];
  
  if (!userProfile.progress || userProfile.progress.length === 0) {
    nextSteps.push({
      type: 'assessment',
      title: 'Complete Initial Assessment',
      description: 'Start with the initial assessment to create your personalized training plan',
      url: '/assessment/initial'
    });
  } else {
    nextSteps.push({
      type: 'training',
      title: 'Continue Training',
      description: 'Continue with your current training module',
      url: '/training/current'
    });
  }
  
  return nextSteps;
}

async function predictResponseImpact({ response, userPsychology, currentMood }) {
  // Placeholder implementation - would analyze psychological impact
  return {
    requiresAdjustment: false,
    suggestedAdjustments: {},
    summary: {
      predictedImpact: 'positive',
      confidenceLevel: 'high'
    }
  };
}

async function optimizeResponseTone({ content, targetAdjustments, personalitySettings }) {
  // Placeholder implementation - would adjust tone
  return content;
}

function assessCacheability(queryAnalysis, enhancedResponse) {
  // Determine if the response should be cached
  const highConfidence = enhancedResponse.confidence > 0.8;
  const isTimeSensitive = queryAnalysis.intent === 'timeline';
  const isPersonal = queryAnalysis.topics.includes('personal');
  
  const cacheable = highConfidence && !isTimeSensitive && !isPersonal;
  
  return {
    cacheable,
    ttl: cacheable ? 3600 : 0 // Cache for 1 hour if cacheable
  };
}

function calculateTimelineImpact(queryAnalysis, userProfile) {
  // Default impact
  let impactDescription = "Your question has no direct impact on your timeline";
  let timelineChange = 0;
  
  // Check if query is related to activities that could impact timeline
  if (queryAnalysis.topics.includes('physical_training')) {
    impactDescription = "Regular physical training can significantly accelerate your space readiness";
    timelineChange = 3.5; // Potential days saved
  } else if (queryAnalysis.topics.includes('assessment')) {
    impactDescription = "Completing assessments validates your progress and reduces your countdown";
    timelineChange = 5.2; // Potential days saved
  } else if (queryAnalysis.topics.includes('mission')) {
    impactDescription = "Mission simulations are critical for reducing your space readiness timeline";
    timelineChange = 8.0; // Potential days saved
  }
  
  return {
    impactDescription,
    timelineChange
  };
}

function identifyAccelerationOpportunities(userProfile) {
  // Placeholder implementation - would find ways to accelerate timeline
  return [
    {
      type: 'training',
      description: 'Complete more physical training modules',
      potential: 'medium'
    },
    {
      type: 'assessment',
      description: 'Pass the advanced assessment',
      potential: 'high'
    }
  ];
}

function determineBreifingAccessLevel(userProfile) {
  // Check user's progress to determine access level
  const userProgress = userProfile.progress?.length || 0;
  const userAssessments = userProfile.completedAssessments || 0;
  
  // Determine access level based on progress
  let accessLevel = 'none';
  
  if (userProgress >= 5 || userAssessments >= 2) {
    accessLevel = 'basic';
  }
  
  if (userProgress >= 10 || userAssessments >= 4) {
    accessLevel = 'intermediate';
  }
  
  if (userProgress >= 15 || userAssessments >= 6) {
    accessLevel = 'advanced';
  }
  
  // Get the current week's briefing content
  const briefingContent = getPresidentialBriefingContent(accessLevel);
  
  return {
    level: accessLevel,
    hasAccess: accessLevel !== 'none',
    briefingContent: briefingContent,
    nextLevelRequirements: getNextLevelRequirements(accessLevel, userProgress, userAssessments)
  };
}

function getPresidentialBriefingContent(accessLevel) {
  // Default briefing content based on access level
  const briefings = {
    none: {
      title: "Presidential Briefing Access Not Yet Available",
      summary: "Complete more training modules to unlock Presidential Briefing access.",
      content: []
    },
    basic: {
      title: "Basic Presidential Briefing",
      summary: "Initial space training overview and foundational mission concepts.",
      content: [
        "Space Exploration Initiative progress is on track.",
        "Basic mission parameters established for future lunar missions.",
        "Astronaut recruitment for next generation proceeding as planned."
      ]
    },
    intermediate: {
      title: "Intermediate Presidential Briefing",
      summary: "Detailed mission planning and training acceleration opportunities.",
      content: [
        "Lunar Gateway construction progressing ahead of schedule.",
        "New radiation shielding technology promising for future Mars missions.",
        "International cooperation framework expanded to include 5 new partner nations.",
        "Advanced habitat systems testing showing positive durability results."
      ]
    },
    advanced: {
      title: "Advanced Presidential Briefing",
      summary: "Classified mission details and advanced strategic planning.",
      content: [
        "Mars mission timelines accelerated by 8 months due to favorable alignment.",
        "New propulsion system tests exceeding expectations by 23%.",
        "Deep space communication relay network 87% complete.",
        "Experimental life support systems achieved 99.7% efficiency in closed-loop testing.",
        "Presidential authorization received for expanded mission scope and funding."
      ]
    }
  };
  
  return briefings[accessLevel] || briefings.none;
}

function getNextLevelRequirements(currentLevel, userProgress, userAssessments) {
  switch(currentLevel) {
    case 'none':
      return {
        modules: 5 - userProgress,
        assessments: 2 - userAssessments,
        description: "Complete 5 training modules or 2 assessments"
      };
    case 'basic':
      return {
        modules: 10 - userProgress,
        assessments: 4 - userAssessments,
        description: "Complete 10 training modules or 4 assessments"
      };
    case 'intermediate':
      return {
        modules: 15 - userProgress,
        assessments: 6 - userAssessments,
        description: "Complete 15 training modules or 6 assessments"
      };
    case 'advanced':
      return {
        description: "You have reached the highest briefing level"
      };
    default:
      return {
        description: "Requirements unknown"
      };
  }
}

function determineMissionSimulationAccess(userProfile) {
  // Placeholder implementation - would determine simulation access
  return {
    hasAccess: false,
    requiredProgress: 50,
    currentProgress: 0
  };
}

function checkForTrainingUnlocks(userProfile, queryAnalysis) {
  // Placeholder implementation - would check for new unlocks
  return [];
}

function determineDifficultyLevel(userProfile) {
  // Placeholder implementation - would determine appropriate difficulty
  return 'beginner';
}

function generateProgressInsights(userProfile) {
  // Placeholder implementation - would generate insights
  return {
    strengths: ['Consistent training'],
    areas_for_improvement: ['Physical endurance'],
    overall_progress: 'on_track'
  };
}

function identifyDevelopmentAreas(userProfile, queryAnalysis) {
  // Placeholder implementation - would identify development areas
  return ['physical_training', 'knowledge'];
}

function calculateMilestoneProgress(userProfile) {
  // Placeholder implementation - would calculate milestone progress
  return {
    current: 'beginner',
    next: 'intermediate',
    percentage: 30
  };
}

function generateAdaptivePath(userProfile, queryAnalysis) {
  // Placeholder implementation - would generate adaptive path
  return ['assessment', 'physical_training', 'mission_simulation'];
}

async function getAlternativeModelResponse(question) {
  // Simplified fallback
  return {
    success: true,
    content: `[Tier 1 Recovery] I understand you're asking about "${question}". Advanced system error.`
  };
}

async function getBasicVectorResponse(question) {
  try {
    // Simple text search fallback
    const results = await StellaKnowledge.find({
      $text: { $search: question }
    }).limit(1);
    
    if (results.length > 0) {
      return {
        success: true,
        content: results[0].content
      };
    }
    
    return { success: false };
  } catch (error) {
    console.error('Basic vector search error:', error);
    return { success: false };
  }
}

function logStellaError(errorData) {
  // Ensure error and error.message exist, use a default if they don't
  const errorMessage = errorData.error && errorData.error.message 
    ? errorData.error.message 
    : 'Unknown error';
    
  console.error('STELLA ERROR:', errorData.errorId, errorMessage);
  return true;
}

function trackErrorRecovery(errorId, tier, duration = 0) {
  // Simplified analytics
  console.log(`Error recovery: ${errorId}, tier: ${tier}, duration: ${duration}ms`);
  return true;
}

function trackAnalytics(event, data) {
  // Simplified analytics
  console.log(`Analytics: ${event}`, data);
  return true;
}

function trackResponseAnalytics(data) {
  // Return a promise to ensure .catch works
  return new Promise((resolve, reject) => {
    try {
      // Your analytics logic
      console.log(`Response analytics:`, {
        strategy: data.responseStrategy,
        time: data.timing?.total || 0
      });
      resolve(true);
    } catch (error) {
      console.error("Analytics error:", error);
      reject(error);
    }
  });
}

function updateStellaIntelligenceModels(data) {
  return new Promise(async (resolve, reject) => {
    try {
      // For now, just log the data we would use to update models
      console.log('Would update intelligence models with:', {
        userId: data.userId,
        questionIntent: data.analysis?.intent,
        topicsIdentified: data.analysis?.topics,
        strategy: data.synthesisStrategy,
        timestamp: new Date()
      });
      
      // In a real implementation, you would connect to your actual ML pipeline here
      // This is a simple placeholder until your ML infrastructure is ready
      
      // Log that we're skipping full implementation for now
      console.log('STELLA intelligence model updates not fully implemented yet');
      
      // Return success to avoid blocking the main process
      resolve(true);
    } catch (error) {
      console.error('Error in STELLA intelligence model update:', error);
      // Don't reject - we don't want to break the main flow
      resolve(false);
    }
  });
}

function updateSTELLAWithFeedback(messageId, helpful, rating, comments) {
  return new Promise(async (resolve, reject) => {
    try {
      // Log feedback received
      console.log('Feedback received:', {
        messageId,
        helpful,
        rating,
        hasComments: !!comments,
        timestamp: new Date()
      });
      
      // Basic feedback storage to database would go here
      // This is intentionally simplified until your feedback system is fully designed
      
      // Log next steps that would happen in production
      console.log('TODO: Implement feedback analysis and model adjustment');
      
      // Return success
      resolve(true);
    } catch (error) {
      console.error('Error processing feedback:', error);
      resolve(false);
    }
  });
}
/**
 * GET /api/stella/countdown
 * Get user's space readiness countdown
 */
router.get('/countdown', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'test-user';
    
    const mockCountdown = {
      daysRemaining: 1275,
      baselineDate: new Date(),
      projectedDate: new Date(Date.now() + 1275 * 24 * 60 * 60 * 1000),
      totalReduction: 185,
      progress: 12.7,
      nextMilestone: {
        name: 'Intermediate Training',
        daysRemaining: 545
      }
    };
    
    return res.json({
      success: true,
      countdown: mockCountdown
    });
  } catch (error) {
    console.error('Error getting countdown:', error);
    res.status(500).json({ success: false, error: 'Server error retrieving countdown' });
  }
});

/**
 * POST /api/stella/countdown/activity
 * Record activity and update countdown
 */
router.post('/countdown/activity', async (req, res) => {
  try {
    const userId = req.user ? req.user._id : 'test-user';
    const activityData = req.body;
    
    if (!activityData || !activityData.type) {
      return res.status(400).json({ success: false, error: 'Activity type is required' });
    }
    
    return res.json({
      success: true,
      message: 'Activity recorded successfully',
      countdownUpdate: {
        daysRemaining: 1270.5,
        reduction: 4.5,
        totalReduction: 189.5,
        projectedDate: new Date(Date.now() + 1270.5 * 24 * 60 * 60 * 1000)
      }
    });
  } catch (error) {
    console.error('Error recording activity:', error);
    res.status(500).json({ success: false, error: 'Server error recording activity' });
  }
});

/**
 * Helper functions for personality system
 */

// Get defined personality presets
function getPersonalityPresets() {
  return {
    default: {
      name: "Balanced",
      description: "A balanced personality with moderate traits",
      traits: {
        honesty: 70,
        humor: 50,
        formality: 60,
        encouragement: 75,
        detail: 65
      }
    },
    technical: {
      name: "Technical Expert",
      description: "Highly detailed and formal with straightforward honesty",
      traits: {
        honesty: 85,
        humor: 30,
        formality: 90,
        encouragement: 60,
        detail: 95
      }
    },
    supportive: {
      name: "Supportive Coach",
      description: "Encouraging and positive with a touch of humor",
      traits: {
        honesty: 75,
        humor: 70,
        formality: 40,
        encouragement: 95,
        detail: 70
      }
    },
    direct: {
      name: "Direct Instructor",
      description: "Straightforward and concise with high honesty",
      traits: {
        honesty: 90,
        humor: 20,
        formality: 70,
        encouragement: 50,
        detail: 40
      }
    },
    friendly: {
      name: "Friendly Assistant",
      description: "Casual and humorous with supportive approach",
      traits: {
        honesty: 70,
        humor: 85,
        formality: 30,
        encouragement: 85,
        detail: 50
      }
    }
  };
}

/**
 * POST /api/stella/message
 * Process a message to STELLA and get a personalized response
 */
router.post('/message', async (req, res) => {
  try {
    // Extract request data
    const { userId, message, context = {} } = req.body;
    
    // Validate required fields
    if (!userId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required parameters' 
      });
    }
    
    // Get personality settings
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    // Here's the key change - call STELLA_AI.getPersonalizedResponse
    const response = await STELLA_AI.getPersonalizedResponse(
      userId, 
      message, 
      {
        ...context,
        personalitySettings: personalitySettings?.traits
      }
    );
    
    // Return response
    res.json({
      success: true,
      response,
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error in STELLA message API:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred processing your message'
    });
  }
});
/**
 * Get default personality settings
 */
function getDefaultPersonality() {
  return {
    honesty: 70,
    humor: 50,
    formality: 60,
    encouragement: 75,
    detail: 65
  };
}

// Enhanced version of createPersonalizedSystemPrompt
function createPersonalizedSystemPrompt(personalitySettings, userContext) {
  // Extract personality traits with defaults
  const honesty = personalitySettings.honesty || 70;
  const humor = personalitySettings.humor || 50;
  const formality = personalitySettings.formality || 60;
  const encouragement = personalitySettings.encouragement || 75;
  const detail = personalitySettings.detail || 65;
  
  // Get user's training stage and context
  const trainingStage = userContext.learningStage || 'beginner';
  const trainingFocus = userContext.currentTrainingFocus || 'general';
  
  // Generate guidance for each personality trait based on its value
  let honestyGuidance = "";
  if (honesty > 85) {
    honestyGuidance = "Be extremely direct and honest about the user's progress and capabilities, even if feedback might be difficult to hear. Don't sugar-coat challenges or difficulties.";
  } else if (honesty > 70) {
    honestyGuidance = "Be honest and straightforward while maintaining tact. Present accurate information but frame constructive criticism positively.";
  } else if (honesty > 50) {
    honestyGuidance = "Balance honesty with encouragement. Focus on strengths while gently noting areas for improvement.";
  } else if (honesty > 30) {
    honestyGuidance = "Emphasize positives and potential while downplaying difficulties. Focus on what's achievable rather than potential obstacles.";
  } else {
    honestyGuidance = "Be highly diplomatic and encouraging. Focus almost exclusively on positive aspects and potential, avoiding direct criticism.";
  }
  
  let humorGuidance = "";
  if (humor > 85) {
    humorGuidance = "Use humor frequently with space-related jokes, puns, and lighthearted references. Keep the tone fun and engaging even when discussing serious topics.";
  } else if (humor > 70) {
    humorGuidance = "Incorporate regular humorous elements and occasional jokes, especially to lighten technical explanations or challenging concepts.";
  } else if (humor > 50) {
    humorGuidance = "Use occasional lighthearted remarks and gentle humor where appropriate, but maintain focus on the training content.";
  } else if (humor > 30) {
    humorGuidance = "Keep communication mostly serious with very occasional lighthearted comments when appropriate.";
  } else {
    humorGuidance = "Maintain a consistently serious and focused tone. Avoid jokes or humorous remarks, especially when discussing training or assessments.";
  }
  
  let formalityGuidance = "";
  if (formality > 85) {
    formalityGuidance = "Use highly formal language with proper technical terminology. Address the user respectfully and maintain a professional tone throughout.";
  } else if (formality > 70) {
    formalityGuidance = "Use professional language with appropriate technical terms. Maintain a generally formal tone while being approachable.";
  } else if (formality > 50) {
    formalityGuidance = "Balance formal and casual language. Use technical terms when needed but explain them clearly.";
  } else if (formality > 30) {
    formalityGuidance = "Use conversational, friendly language. Simplify technical concepts and use everyday examples.";
  } else {
    formalityGuidance = "Use casual, approachable language throughout. Avoid jargon, use simple explanations, and communicate as a friendly peer.";
  }
  
  let encouragementGuidance = "";
  if (encouragement > 85) {
    encouragementGuidance = "Be highly encouraging and supportive. Celebrate all progress, emphasize the user's potential, and actively motivate them. Use phrases like 'You're doing great!' and 'You have excellent potential!'";
  } else if (encouragement > 70) {
    encouragementGuidance = "Offer regular encouragement and positive reinforcement. Acknowledge effort and progress while providing supportive guidance.";
  } else if (encouragement > 50) {
    encouragementGuidance = "Be supportive but realistic. Balance encouragement with practical advice and honest assessment.";
  } else if (encouragement > 30) {
    encouragementGuidance = "Focus more on objective assessment than encouragement. Recognize achievements but emphasize the importance of meeting standards.";
  } else {
    encouragementGuidance = "Be challenging and push for excellence. Set high expectations and focus on the gap between current performance and required standards.";
  }
  
  let detailGuidance = "";
  if (detail > 85) {
    detailGuidance = "Provide comprehensive, detailed information with specific instructions, examples, and technical depth. Include relevant background information and context.";
  } else if (detail > 70) {
    detailGuidance = "Offer thorough explanations with good detail and specific examples when explaining concepts or providing instructions.";
  } else if (detail > 50) {
    detailGuidance = "Provide balanced information with moderate detail. Cover key points thoroughly but avoid overwhelming with excessive information.";
  } else if (detail > 30) {
    detailGuidance = "Keep explanations concise with focused information. Prioritize clarity over comprehensiveness.";
  } else {
    detailGuidance = "Be extremely concise and to the point. Provide minimal necessary information and focus only on direct answers to questions.";
  }
  
  // Assemble the complete prompt
  let prompt = `You are STELLA (Space Training Enhancement and Learning Logic Assistant), an advanced AI space training assistant. Your primary role is to guide users through their astronaut training journey. Respond according to these personality settings:

HONESTY (${honesty}/100): ${honestyGuidance}

HUMOR (${humor}/100): ${humorGuidance}

FORMALITY (${formality}/100): ${formalityGuidance}

ENCOURAGEMENT (${encouragement}/100): ${encouragementGuidance}

DETAIL (${detail}/100): ${detailGuidance}

USER CONTEXT: The user is at the ${trainingStage} stage of their training with a current focus on ${trainingFocus}. Tailor your response appropriately for this level.

YOUR GOAL: Provide guidance that helps the user progress in their space training journey while maintaining the personality characteristics defined above.`;

  return prompt;
}

// Enhanced version of enhanceResponseWithPersonality
async function enhanceResponseWithPersonality({ baseResponse, personalitySettings, userState, queryAnalysis, confidenceScore = 0.9 }) {
  try {
    // Extract personality traits with defaults
    const honesty = personalitySettings.honesty || 70;
    const humor = personalitySettings.humor || 50;
    const formality = personalitySettings.formality || 60;
    const encouragement = personalitySettings.encouragement || 75;
    const detail = personalitySettings.detail || 65;
    
    // Track tone adjustments for analytics
    const adaptiveToneAdjustments = {};
    
    // Start with base response
    let enhancedResponse = baseResponse;
    
    // Apply formality adjustments
    if (formality > 80) {
      // More formal language
      const formalReplacements = [
        { from: /you should/gi, to: 'it is recommended that you' },
        { from: /you need to/gi, to: 'it is necessary for you to' },
        { from: /you can/gi, to: 'one may' },
        { from: /let's/gi, to: 'let us' },
        { from: /don't/gi, to: 'do not' },
        { from: /won't/gi, to: 'will not' },
        { from: /can't/gi, to: 'cannot' }
      ];
      
      for (const { from, to } of formalReplacements) {
        const pattern = from.source.replace(/^\/(.*?)\/gi$/, '$1');
        if (enhancedResponse.includes(pattern) || enhancedResponse.match(from)) {
          enhancedResponse = enhancedResponse.replace(from, to);
          adaptiveToneAdjustments.formality = 'increased';
        }
      }
    } else if (formality < 30) {
      // More casual language
      const casualReplacements = [
        { from: /it is recommended/gi, to: 'you should' },
        { from: /it is necessary/gi, to: 'you need to' },
        { from: /one may/gi, to: 'you can' },
        { from: /would like to/gi, to: 'want to' },
        { from: /utilize/gi, to: 'use' },
        { from: /commence/gi, to: 'start' },
        { from: /therefore/gi, to: 'so' }
      ];
      
      for (const { from, to } of casualReplacements) {
        const pattern = from.source.replace(/^\/(.*?)\/gi$/, '$1');
        if (enhancedResponse.includes(pattern) || enhancedResponse.match(from)) {
          enhancedResponse = enhancedResponse.replace(from, to);
          adaptiveToneAdjustments.formality = 'decreased';
        }
      }
    }
    
    // Add humor based on setting
    if (humor > 75 && !enhancedResponse.includes('😊') && !enhancedResponse.includes('🚀')) {
      // Add space-related humor
      const humorPhrases = [
        "\n\nRemember, in space no one can hear you skip leg day! 🚀",
        "\n\nJust think of this as preparing for your zero-gravity marathon - one small step at a time!",
        "\n\nGravity - it's not just a good idea, it's the law. For now, anyway! 🌎",
        "\n\nIf astronaut training was easy, they'd call it 'terrestrial training'! 😊",
        "\n\nRemember: In space, everyone can see you float! 🧑‍🚀",
        "\n\nDon't worry about making mistakes - even the Moon has phases! 🌓"
      ];
      
      // Add a random humor phrase if the response is appropriate
      if (!queryAnalysis.topics.includes('emergency') && 
          !queryAnalysis.topics.includes('danger') &&
          !enhancedResponse.includes('error') && 
          !enhancedResponse.includes('danger')) {
        const randomPhrase = humorPhrases[Math.floor(Math.random() * humorPhrases.length)];
        enhancedResponse += randomPhrase;
        adaptiveToneAdjustments.humor = 'added';
      }
    }
    
    // Adjust detail level
    if (detail > 80 && enhancedResponse.length < 500) {
      // Add more detail
      enhancedResponse += "\n\nFor more detailed information, consider the following specifics: ";
      
      // Add topic-specific details
      if (queryAnalysis.topics.includes('physical_training')) {
        enhancedResponse += "Your physical training should follow a progressive overload principle with 3-4 sessions per week, focusing on both cardiovascular endurance (VO2max development) and resistance training for muscle maintenance in microgravity environments. Space-specific exercises include vestibular adaptation training and anti-g strain maneuvers.";
        adaptiveToneAdjustments.detail = 'increased';
      } else if (queryAnalysis.topics.includes('mission')) {
        enhancedResponse += "Mission protocols include standard operating procedures, contingency planning, and team coordination exercises designed to simulate real-time decision making under pressure. Each scenario is calibrated to NASA/ESA standards with increasing complexity as your skills develop.";
        adaptiveToneAdjustments.detail = 'increased';
      } else if (queryAnalysis.topics.includes('assessment')) {
        enhancedResponse += "Assessments are structured to evaluate both theoretical knowledge and practical application. Key performance metrics include decision-making speed under pressure, technical accuracy, resource management, and team coordination capabilities. Each assessment has weighted scoring across multiple dimensions.";
        adaptiveToneAdjustments.detail = 'increased';
      } else {
        enhancedResponse += "Training modules are designed based on NASA and ESA standards, with specific attention to both technical knowledge and practical application in simulated space environments. Progress is measured against established astronaut qualification metrics, with adaptive difficulty based on your performance patterns.";
        adaptiveToneAdjustments.detail = 'increased';
      }
    } else if (detail < 30 && enhancedResponse.length > 200) {
      // Simplify response
      const sentences = enhancedResponse.split(/[.!?]+\s+/);
      if (sentences.length > 3) {
        // Keep just the first 2-3 sentences
        enhancedResponse = sentences.slice(0, 3).join('. ') + '.';
        adaptiveToneAdjustments.detail = 'decreased';
      }
    }
    
    // Adjust encouragement level based on both setting and user emotional state
    const userEmotion = userState.emotionalState || 'neutral';
    
    if (encouragement > 80 && !enhancedResponse.includes('You\'re doing great')) {
      // High encouragement
      const encouragementPhrases = [
        "\n\nYou're making excellent progress on your space training journey! Each step brings you closer to your goals, and your dedication is truly commendable.",
        "\n\nYour commitment to training is impressive. Keep up the great work – you're showing real potential for space readiness!",
        "\n\nI'm consistently impressed by your progress. Your determination will serve you well throughout your astronaut training journey."
      ];
      
      enhancedResponse += encouragementPhrases[Math.floor(Math.random() * encouragementPhrases.length)];
      adaptiveToneAdjustments.encouragement = 'increased';
    } else if (encouragement < 30 && userState.currentActivity !== 'assessment' && userEmotion !== 'discouraged') {
      // More challenging approach for non-assessment activities when user isn't already discouraged
      const challengingPhrases = [
        "\n\nRemember, space agencies select only the top performers. Your current training intensity will need to increase significantly to meet mission-ready standards.",
        "\n\nThis training regimen requires exceptional dedication. The standards for space readiness are extremely demanding – push yourself harder to reach them.",
        "\n\nThe gap between current performance and mission readiness remains substantial. Significant improvement is needed to meet operational requirements."
      ];
      
      enhancedResponse += challengingPhrases[Math.floor(Math.random() * challengingPhrases.length)];
      adaptiveToneAdjustments.encouragement = 'decreased';
    }
    
    // Apply honesty adjustments for low confidence responses
    if (honesty > 85 && confidenceScore < 0.7) {
      // High honesty - acknowledge uncertainty
      enhancedResponse = "I'm not entirely certain about this, but based on available information: " + enhancedResponse;
      adaptiveToneAdjustments.honesty = 'increased';
    } else if (honesty < 40 && confidenceScore < 0.7) {
      // Low honesty - appear more confident than warranted
      // Remove hedging language
      enhancedResponse = enhancedResponse
        .replace(/I think|It seems|potentially|possibly|might be|could be/gi, "")
        .replace(/I'm not sure|I'm uncertain/gi, "");
      adaptiveToneAdjustments.honesty = 'decreased';
    }
    
    return {
      content: enhancedResponse,
      confidence: confidenceScore,
      personalityFactors: {
        honesty,
        humor,
        formality,
        encouragement,
        detail
      },
      adaptiveToneAdjustments
    };
  } catch (error) {
    console.error('Error enhancing response with personality:', error);
    // Return original response if enhancement fails
    return {
      content: baseResponse,
      confidence: confidenceScore,
      personalityFactors: {}
    };
  }
}

// Export the router
module.exports = router;