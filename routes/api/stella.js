const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { addDays, format } = require('date-fns');

// Import models
const UserProgress = require('../../models/UserProgress');
const { safeGetUserProgress, isValidObjectId } = require('../../utils/progressUtils');

// Import OpenAI service (fix the duplicate import)
const { openai } = require('../../services/openaiService');

// Get access to STELLA_AI instance (should be set in app.js)
const getStellaAI = (req) => req.app.get('stellaAI');

// Performance optimization: Add a simple in-memory cache
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Rate limiting
const userRateLimit = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

// Context management
const MAX_CONVERSATION_TOKENS = 2000;
const MAX_USER_CONTEXT_TOKENS = 1000;

/**
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ message: 'STELLA API is working' });
});

/**
 * POST /api/stella/initialize
 * Initialize STELLA AI system for the user's session
 */
router.post('/initialize', async (req, res) => {
  try {
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    res.json({
      success: true,
      message: "STELLA initialized successfully",
      version: stellaAI.version || "1.0",
      capabilities: stellaAI.getCapabilities()
    });
  } catch (error) {
    console.error('Error initializing STELLA:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize STELLA' });
  }
});

/**
 * POST /api/stella/connect
 * Connect user to STELLA services
 */
router.post('/connect', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessionId = `stella_${Date.now()}`;
    
    // Get STELLA instance and initialize user session
    const stellaAI = getStellaAI(req);
    const personalityTraits = await stellaAI.personalityService.getPersonalityForUser(userId);
    
    res.json({
      success: true,
      sessionId,
      personality: personalityTraits,
      message: "Connected to STELLA"
    });
  } catch (error) {
    console.error('Error connecting to STELLA:', error);
    res.status(500).json({ success: false, error: 'Failed to connect to STELLA' });
  }
});

/**
 * POST /api/stella/guidance
 * Get personalized guidance from STELLA
 */
router.post('/guidance', async (req, res) => {
  try {
    const { userId, question } = req.body;
    
    if (!userId || !question) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId and/or question"
      });
    }
    
    console.log(`Processing guidance request for userId ${userId} with question: ${question}`);
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Generate a session ID for this conversation
    const sessionId = `stella_${Date.now()}`;
    
    // Analyze question for context
    const questionAnalysis = await analyzeQuestion(question);
    
    // Store the user's question in MongoDB
    const userQuestion = new StellaConversation({
      userId,
      fromUser: true,
      content: question,
      timestamp: new Date(),
      metadata: {
        sessionId,
        context: 'general'
      },
      aiAnalysis: questionAnalysis
    });
    
    // Check if a similar question exists
    const similarQuestionResult = await findSimilarQuestion(userId, question);
    
    let responseContent;
    
    if (similarQuestionResult.found && similarQuestionResult.similarity > 0.8) {
      console.log('Using similar question response from SSL');
      responseContent = similarQuestionResult.response.content;
    } else {
      // Use the personalized response from STELLA_AI (which now uses PersonalityService)
      responseContent = await stellaAI.getPersonalizedResponse(userId, question, {
        questionAnalysis,
        sessionId
      });
    }
    
    // Store STELLA's response
    const stellaResponse = new StellaConversation({
      userId,
      fromUser: false,
      content: responseContent,
      timestamp: new Date(Date.now() + 1),
      metadata: {
        sessionId,
        context: 'general',
        source: similarQuestionResult.found ? 'ssl' : 'openai'
      },
      aiAnalysis: {
        actionItems: extractActionItems(responseContent),
        confidenceScore: similarQuestionResult.found ? 0.95 : 0.9
      }
    });
    
    // Save both to database
    try {
      await userQuestion.save();
      await stellaResponse.save();
      console.log('Conversation saved to database');
    } catch (dbError) {
      console.error('Error saving to database:', dbError);
      // Continue anyway - don't fail the response if DB save fails
    }
    
    res.json({
      success: true, 
      guidance: { 
        message: responseContent 
      }
    });
  } catch (error) {
    console.error("Error getting guidance:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error"
    });
  }
});

/**
 * POST /api/stella/feedback
 * Receive feedback on STELLA's responses for learning
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, messageId, sessionId, helpful, rating, feedbackText } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    // We need either messageId or sessionId
    if (!messageId && !sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Either messageId or sessionId is required'
      });
    }
    
    // Find the message to update
    let message;
    if (messageId) {
      message = await StellaConversation.findById(messageId);
    } else {
      // Find the most recent response in this session
      message = await StellaConversation.findOne({
        userId,
        fromUser: false,
        'metadata.sessionId': sessionId
      }).sort({ timestamp: -1 });
    }
    
    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    // Update the message with feedback
    message.userFeedback = {
      helpful,
      rating: rating || null,
      feedbackText: feedbackText || null,
      receivedAt: new Date()
    };
    
    // If it wasn't helpful, reduce the confidence score
    if (helpful === false) {
      message.aiAnalysis.confidenceScore = Math.max(0.5, (message.aiAnalysis.confidenceScore || 0.85) - 0.1);
    } else {
      message.aiAnalysis.confidenceScore = Math.min(1.0, (message.aiAnalysis.confidenceScore || 0.85) + 0.05);
    }
    
    await message.save();
    
    // Get STELLA instance to update learning
    const stellaAI = getStellaAI(req);
    await stellaAI.personalityService.processFeedback(userId, message, helpful);
    
    res.json({
      success: true,
      message: 'Feedback received and processed'
    });
  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process feedback: ' + error.message
    });
  }
});

/**
 * GET /api/stella/conversations/recent
 * Get recent conversations
 */
router.get('/conversations/recent', async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;
    
    const queryOptions = userId ? { userId } : {};
    
    const recentConversations = await StellaConversation.find(queryOptions)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));
    
    res.json({ 
      success: true, 
      conversations: recentConversations 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversations: ' + error.message
    });
  }
});

/**
 * GET /api/stella/common-questions
 * Get the most commonly asked questions
 */
router.get('/common-questions', async (req, res) => {
  try {
    const commonQuestions = await StellaConversation.getMostCommonQuestions(10);
    
    res.json({
      success: true,
      questions: commonQuestions.map(q => ({
        id: q._id,
        question: q.content,
        frequency: q.frequencyData?.similarQuestionCount || 1,
        lastAsked: q.frequencyData?.lastAsked
      }))
    });
  } catch (error) {
    console.error('Error fetching common questions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch common questions: ' + error.message
    });
  }
});

/**
 * GET /api/stella/status
 * Check STELLA system status
 */
// Simplified status endpoint for testing
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: "online",
    version: "1.0",
    capabilities: ["Training guidance", "Progress tracking", "Exercise analysis", "Learning engine"]
  });
});
/**
 * NEW! GET /api/stella/daily-briefing
 * Get the presidential space briefing for the day
 */
router.get('/daily-briefing', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Generate a daily briefing
    const briefingData = await stellaAI.generateDailyBriefing({
      userId,
      date: new Date()
    });
    
    res.json({
      success: true,
      briefing: briefingData
    });
  } catch (error) {
    console.error('Error generating daily briefing:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate daily briefing: ' + error.message
    });
  }
});

/**
 * NEW! POST /api/stella/countdown/start
 * Start a countdown for a user
 */
router.post('/countdown/start', async (req, res) => {
  try {
    const { userId, mission, duration } = req.body;
    
    if (!userId || !mission) {
      return res.status(400).json({
        success: false,
        error: 'userId and mission are required'
      });
    }
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Start the countdown
    const countdownData = await stellaAI.countdownService.startCountdown(userId, {
      mission,
      duration: duration || 604800 // Default to 1 week in seconds
    });
    
    res.json({
      success: true,
      countdown: countdownData
    });
  } catch (error) {
    console.error('Error starting countdown:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start countdown: ' + error.message
    });
  }
});

/**
 * NEW! GET /api/stella/countdown/status
 * Get current countdown status for a user
 */
router.get('/countdown/status', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Get countdown status
    const countdownStatus = await stellaAI.countdownService.getCountdownStatus(userId);
    
    res.json({
      success: true,
      status: countdownStatus
    });
  } catch (error) {
    console.error('Error getting countdown status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get countdown status: ' + error.message
    });
  }
});

/**
 * NEW! POST /api/stella/countdown/activity
 * Record user activity to potentially accelerate countdown
 */
router.post('/countdown/activity', async (req, res) => {
  try {
    const { userId, activityType, activityData } = req.body;
    
    if (!userId || !activityType) {
      return res.status(400).json({
        success: false,
        error: 'userId and activityType are required'
      });
    }
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Update countdown based on activity
    const updateResult = await stellaAI.calculateCountdownUpdate(userId, {
      type: activityType,
      data: activityData || {}
    });
    
    res.json({
      success: true,
      update: updateResult
    });
  } catch (error) {
    console.error('Error updating countdown with activity:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update countdown: ' + error.message
    });
  }
});

/**
 * NEW! POST /api/stella/personality/update
 * Update STELLA's personality for a user
 */
router.post('/personality/update', async (req, res) => {
  try {
    const { userId, traits } = req.body;
    
    if (!userId || !traits) {
      return res.status(400).json({
        success: false,
        error: 'userId and traits are required'
      });
    }
    
    // Get STELLA instance
    const stellaAI = getStellaAI(req);
    
    // Update personality traits
    const updatedTraits = await stellaAI.personalityService.updatePersonality(userId, traits);
    
    res.json({
      success: true,
      personality: updatedTraits
    });
  } catch (error) {
    console.error('Error updating personality:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update personality: ' + error.message
    });
  }
});

/**
 * Helper function to analyze question
 */
async function analyzeQuestion(question) {
  // In a full implementation, this could use a dedicated ML model
  // For now, we'll use pattern matching
  const lowerQuestion = question.toLowerCase();
  
  // Determine question type
  let questionType = 'other';
  if (lowerQuestion.includes('how') || lowerQuestion.includes('what')) {
    questionType = 'informational';
  } else if (lowerQuestion.includes('help') || lowerQuestion.includes('assist')) {
    questionType = 'help';
  } else if (lowerQuestion.includes('should') || lowerQuestion.includes('recommend')) {
    questionType = 'guidance';
  } else if (lowerQuestion.includes('feedback') || lowerQuestion.includes('review')) {
    questionType = 'feedback';
  } else if (lowerQuestion.includes('technical') || lowerQuestion.includes('system')) {
    questionType = 'technical';
  } else if (lowerQuestion.includes('assess') || lowerQuestion.includes('evaluate')) {
    questionType = 'assessment';
  }
  
  // Extract key entities
  const keyEntities = [];
  const entities = {
    'core balance': lowerQuestion.includes('core') || lowerQuestion.includes('balance'),
    'endurance': lowerQuestion.includes('endurance') || lowerQuestion.includes('cardio'),
    'strength': lowerQuestion.includes('strength') || lowerQuestion.includes('muscle'),
    'flexibility': lowerQuestion.includes('flex') || lowerQuestion.includes('mobility'),
    'mission': /mission\s*\d+/.test(lowerQuestion) || lowerQuestion.includes('mission'),
    'exercise': lowerQuestion.includes('exercise') || lowerQuestion.includes('workout'),
    'assessment': lowerQuestion.includes('assess') || lowerQuestion.includes('test'),
    'progress': lowerQuestion.includes('progress') || lowerQuestion.includes('improve'),
    'certification': lowerQuestion.includes('certif') || lowerQuestion.includes('badge')
  };
  
  for (const [entity, present] of Object.entries(entities)) {
    if (present) keyEntities.push(entity);
  }
  
  // Extract topics
  const topics = [];
  const topicPatterns = {
    'physical training': lowerQuestion.includes('physical') || lowerQuestion.includes('training'),
    'mental preparation': lowerQuestion.includes('mental') || lowerQuestion.includes('psych'),
    'technical skills': lowerQuestion.includes('technical') || lowerQuestion.includes('skills'),
    'space adaptation': lowerQuestion.includes('space') || lowerQuestion.includes('adapt'),
    'mission planning': lowerQuestion.includes('planning') || lowerQuestion.includes('preparation')
  };
  
  for (const [topic, present] of Object.entries(topicPatterns)) {
    if (present) topics.push(topic);
  }
  
  return {
    questionType,
    keyEntities,
    topics,
    // More analysis fields could be added here
  };
}

/**
 * Check for similar questions in database
 */
async function findSimilarQuestion(userId, question) {
  try {
    console.log(`Searching for similar questions to: "${question}"`);
    
    // Extract keywords for better matching
    const keywords = question.split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase());
    
    // Create a more flexible matching pattern
    let queryCondition;
    if (keywords.length >= 2) {
      // If we have enough keywords, create a regex pattern that matches any of them
      const keywordPattern = keywords.join('|');
      queryCondition = { 
        content: { $regex: new RegExp(keywordPattern, 'i') }
      };
      console.log(`Using keyword pattern: ${keywordPattern}`);
    } else {
      // Fall back to simple prefix matching if not enough keywords
      queryCondition = { 
        content: { $regex: new RegExp(question.substring(0, 20), 'i') }
      };
      console.log(`Using prefix pattern: ${question.substring(0, 20)}`);
    }
    
    // Find similar questions with more flexible matching
    const similarQuestions = await StellaConversation.find({
      fromUser: true,
      ...queryCondition
    })
    .sort({ 'frequencyData.similarQuestionCount': -1 })
    .limit(3) // Get top 3 matches instead of just 1
    .lean();
    
    console.log(`Found ${similarQuestions.length} similar questions`);
    
    // If we found similar questions, try to find the most relevant one
    if (similarQuestions.length > 0) {
      // Look through matches to find the best one
      for (const similarQuestion of similarQuestions) {
        console.log('Checking similar question:', similarQuestion.content);
        
        // Find STELLA's response to this question
        const stellaResponse = await StellaConversation.findOne({
          fromUser: false,
          'metadata.sessionId': similarQuestion.metadata?.sessionId
        })
        .sort({ timestamp: 1 })
        .limit(1)
        .lean();
        
        if (stellaResponse) {
          console.log('Found matching STELLA response:', stellaResponse.content.substring(0, 50) + '...');
          
          // Increment the question frequency counter
          try {
            await StellaConversation.incrementQuestionFrequency(similarQuestion._id);
            console.log('Incremented question frequency for ID:', similarQuestion._id);
          } catch (incrementError) {
            console.error('Error incrementing frequency:', incrementError);
            // Continue even if increment fails
          }
          
          return {
            found: true,
            similarity: 0.85, // Estimate similarity score
            question: similarQuestion,
            response: stellaResponse
          };
        }
      }
    }
    
    return { found: false };
  } catch (err) {
    console.error("Error finding similar question:", err);
    return { found: false };
  }
}

/**
 * Helper function to extract action items from text
 */
function extractActionItems(text) {
  const lines = text.split('\n');
  const actionItems = [];
  
  for (const line of lines) {
    if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      actionItems.push(line.trim().substring(2));
    }
  }
  
  if (actionItems.length === 0) {
    // Try to extract sentences if no bullet points
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 1) {
      return sentences.slice(1, 4).map(s => s.trim());
    }
    
    return ['Start your assessment', 'Begin Core & Balance training', 'Track your progress'];
  }
  
  return actionItems.slice(0, 3);
}

/**
 * Helper function to estimate tokens (rough calculation)
 */
function estimateTokens(text) {
  return Math.ceil((text || '').split(/\s+/).length * 1.3);
}

// Import StellaConversation model
const StellaConversation = mongoose.model('StellaConversation');

module.exports = router;