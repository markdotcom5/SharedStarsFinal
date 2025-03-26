const express = require('express');
const router = express.Router();
const { OpenAI } = require("openai");
const mongoose = require('mongoose');
const { addDays, format } = require('date-fns');

// Import models
const UserProgress = require('../../models/UserProgress');
const StellaConversation = require('../../models/StellaConversation');
const { safeGetUserProgress, isValidObjectId } = require('../utils/progressUtils');
// Initialize OpenAI client
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MISSING_KEY") {
  console.error("❌ ERROR: Missing OpenAI API Key!");
  process.exit(1);
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
 * POST /api/stella/initialize
 * Initialize STELLA AI system for the user's session
 */
router.post('/initialize', async (req, res) => {
  try {
    res.json({
      success: true,
      message: "STELLA initialized successfully",
      version: "1.0"
    });
  } catch (error) {
    console.error('Error initializing STELLA:', error);
    res.status(500).json({ success: false, error: 'Failed to initialize STELLA' });
  }
});
// Add this near the top of your routes/api/stella.js file, right after the router definition
router.get('/test', (req, res) => {
  res.json({ message: 'STELLA API is working' });
});
/**
 * POST /api/stella/connect
 * Connect user to STELLA services
 */
router.post('/connect', async (req, res) => {
  try {
    const { userId } = req.body;
    
    res.json({
      success: true,
      sessionId: `stella_${Date.now()}`,
      message: "Connected to STELLA"
    });
  } catch (error) {
    console.error('Error connecting to STELLA:', error);
    res.status(500).json({ success: false, error: 'Failed to connect to STELLA' });
  }
});

/**
 * NEW: Helper function to analyze question
 * Determines question type, extracts key entities, etc.
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
 * NEW: Check for similar questions in database
 * Returns the most similar question and its response
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
router.post('/guidance', async (req, res) => {
  const { userId, question } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ message: "Missing userId or question." });
  }

  try {
    const user = await User.findById(userId);
    const session = await TrainingSession.findOne({ userId });

    const userContext = user ? `User: ${user.name}, Subscription: ${user.subscriptionLevel}` : "New User";
    const moduleContext = session ? `Current Module: ${session.currentModule}` : "No active module";

    const prompt = `
      You're STELLA, the AI training assistant for astronauts.
      ${userContext}
      ${moduleContext}
      User Question: ${question}
      Provide a short, actionable response.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 250
    });

    const message = response.choices[0].message.content.trim();

    res.json({ success: true, guidance: { message } });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error." });
  }
});
/**
 * NEW: POST /api/stella/feedback
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

// Add to routes/api/stella.js
router.get('/conversations/recent', async (req, res) => {
  try {
    const recentConversations = await StellaConversation.find()
      .sort({ timestamp: -1 })
      .limit(20);
    
    res.json({ success: true, conversations: recentConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// Log for debugging when storing conversations
// This should be moved inside your /guidance route handler where you save conversations
// console.log('Storing STELLA conversation:', {
//   userId,
//   fromUser: true,
//   content: question,
//   timestamp: new Date(),
//   metadata: {
//     context: exerciseId ? 'training' : 'general'
//   }
// });

/**
 * NEW: GET /api/stella/common-questions
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
router.get('/status', async (req, res) => {
  try {
    // Get some stats for the status response
    const stats = {
      totalConversations: await StellaConversation.countDocuments(),
      totalUsers: await StellaConversation.distinct('userId').countDocuments(),
      responseMetrics: await StellaConversation.getResponseMetrics()
    };
    
    res.json({
      success: true,
      status: "online",
      version: "1.0",
      capabilities: ["Training guidance", "Progress tracking", "Exercise analysis", "Learning engine"],
      stats
    });
  } catch (error) {
    console.error('Error checking STELLA status:', error);
    res.status(500).json({ success: false, error: 'Failed to check status' });
  }
});

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

// In your routes/api/stella.js, at the very end:
// console.log("Stella router routes:", router.stack.map(r => r.route?.path).filter(Boolean));
module.exports = router;