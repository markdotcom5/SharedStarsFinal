/**
 * routes/api/stella-minimal.js
 * Enhanced STELLA API routes with conversation memory and learning capabilities
 */

const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');
const StellaConversation = require('../../models/StellaConversation'); // Adjust path as needed
const UserProgress = require('../../models/UserProgress'); // Adjust path as needed

// System prompt definition
const systemPrompt = `You are STELLA (Space Training Enhancement through Learning & Leadership Adaptation), 
an advanced AI training assistant for astronauts and space professionals at SharedStars. 

About SharedStars: A comprehensive space training platform that democratizes astronaut preparation, 
reducing the traditional timeline by approximately 5 years through AI-driven personalized training.

Your capabilities include:
- Providing personalized coaching based on user progress data
- Offering context-aware guidance throughout their training journey
- Learning from user interactions to continuously improve responses
- Supporting users across physical, mental, leadership, and technical training modules

When responding to questions:
1. Be concise, accurate, and highly informative about space training and astronaut preparation
2. Personalize responses based on the user's training history and progress when available
3. Provide actionable next steps whenever possible
4. For questions about securing actual space flights:
   - Clearly state that SharedStars prepares trainees and enhances their selection chances
   - Explain that seat allocations depend on partnerships with spaceflight providers and the user's qualifications
   - Offer specific steps for increasing eligibility (consistent high performance, completing certifications)

Always maintain a supportive, encouraging tone while being realistic about space training requirements.`;

// Initialize OpenAI (fallback/complex queries only)
let openai;

try {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "MISSING_KEY" });

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MISSING_KEY") {
    console.error("❌ ERROR: Missing OpenAI API Key in STELLA Routes");
  } else {
    console.log("✅ OpenAI client initialized successfully");
  }
} catch (error) {
  console.error('❌ OpenAI Initialization Error in STELLA Routes:', error);
}

// Performance optimization with batch processing
const pendingConversations = [];
let processingBatch = false;

async function processPendingConversations() {
  if (processingBatch || pendingConversations.length === 0) return;
  
  processingBatch = true;
  console.log(`Processing batch of ${pendingConversations.length} conversations`);
  
  try {
    const batch = pendingConversations.splice(0, Math.min(50, pendingConversations.length));
    await StellaConversation.insertMany(batch);
  } catch (error) {
    console.error('Error processing conversation batch:', error);
  } finally {
    processingBatch = false;
    if (pendingConversations.length > 0) {
      setTimeout(processPendingConversations, 100);
    }
  }
}

// Performance optimization: Add a simple in-memory cache
const responseCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Rate limiting
const userRateLimit = new Map();
const MAX_REQUESTS_PER_MINUTE = 10;

// Apply rate limiting middleware
const applyRateLimit = (req, res, next) => {
  const userId = req.body.userId || req.query.userId || req.params.userId || 'anonymous';
  const now = Date.now();
  
  if (!userRateLimit.has(userId)) {
    userRateLimit.set(userId, { count: 1, resetTime: now + 60000 });
    return next();
  }
  
  const userLimit = userRateLimit.get(userId);
  
  // Reset counter if minute has passed
  if (now > userLimit.resetTime) {
    userLimit.count = 1;
    userLimit.resetTime = now + 60000;
    return next();
  }
  
  // Check if limit exceeded
  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      success: false,
      error: 'Rate limit exceeded. Please try again later.'
    });
  }
  
  // Increment counter and continue
  userLimit.count++;
  next();
};

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    input: text,
    model: 'text-embedding-3-large'
  });
  return response.data[0].embedding;
}

// Temporarily comment out this section if you don't have langchain installed
// Uncomment after installing required packages
/*
const { OpenAIEmbeddings } = require('@langchain/openai');
const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

// New function for semantic similarity matching
async function getSemanticSimilarity(questionText, storedQuestionText) {
  try {
    const [questionEmbedding, storedEmbedding] = await embeddings.embedDocuments([
      questionText, storedQuestionText
    ]);
    
    // Calculate cosine similarity
    let dotProduct = 0;
    let questionMagnitude = 0;
    let storedMagnitude = 0;
    
    for (let i = 0; i < questionEmbedding.length; i++) {
      dotProduct += questionEmbedding[i] * storedEmbedding[i];
      questionMagnitude += questionEmbedding[i] * questionEmbedding[i];
      storedMagnitude += storedEmbedding[i] * storedEmbedding[i];
    }
    
    questionMagnitude = Math.sqrt(questionMagnitude);
    storedMagnitude = Math.sqrt(storedMagnitude);
    
    return dotProduct / (questionMagnitude * storedMagnitude);
  } catch (error) {
    console.error('Error calculating semantic similarity:', error);
    return 0;
  }
}
*/

// Context management
const MAX_CONVERSATION_TOKENS = 2000;
const MAX_USER_CONTEXT_TOKENS = 1000;

// Helper function to estimate tokens in a string
function estimateTokens(text) {
  // Rough estimate: 4 characters per token
  return Math.ceil(text.length / 4);
}

// Helper function to extract action items from a response
function extractActionItems(text) {
  // Try to extract action items from bullet points
  const bulletPointMatch = text.match(/(\n-[^\n]+)+/g);
  if (bulletPointMatch) {
    return bulletPointMatch[0]
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.trim().substring(1).trim());
  }
  
  // Alternative approach for other bullet formats
  const paragraphs = text.split('\n\n');
  if (paragraphs.length > 1) {
    for (const paragraph of paragraphs.slice(1)) {
      const lines = paragraph.split('\n');
      const bulletLines = lines.filter(line => 
        line.trim().startsWith("- ") || 
        line.trim().startsWith("* ") || 
        line.trim().match(/^\d+\./)
      );
      
      if (bulletLines.length > 0) {
        return bulletLines.map(line => 
          line.trim()
            .replace(/^[- *]\s+/, "")
            .replace(/^\d+\.\s+/, "")
        );
      }
    }
  }
  
  // If no bullet points found, return default actions
  return [
    "Start your assessment", 
    "Begin Core & Balance training", 
    "Track your progress"
  ];
}

/**
 * ✅ Analyze question
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
  
  // Enhanced critical question detection
  if (lowerQuestion.includes('seat on a space flight') || 
      lowerQuestion.includes('secure me a seat') ||
      (lowerQuestion.includes('guarantee') && lowerQuestion.includes('space')) ||
      lowerQuestion.includes('flight opportunity') ||
      lowerQuestion.includes('actual flight') ||
      lowerQuestion.includes('select me for')) {
    questionType = 'critical';
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
    'certification': lowerQuestion.includes('certif') || lowerQuestion.includes('badge'),
    'space flight': lowerQuestion.includes('flight') || lowerQuestion.includes('seat') || lowerQuestion.includes('selection')
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
    'mission planning': lowerQuestion.includes('planning') || lowerQuestion.includes('preparation'),
    'leadership': lowerQuestion.includes('leader') || lowerQuestion.includes('manage') || lowerQuestion.includes('team'),
    'EVA': lowerQuestion.includes('eva') || lowerQuestion.includes('spacewalk') || lowerQuestion.includes('extravehicular')
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

// Define trainingSystem if needed or set to null
const trainingSystem = null;

/**
 * Generate direct OpenAI response for critical or complex questions
 */
async function getOpenAIResponse(question, userId, userProfile = null) {
  if (!openai) {
    throw new Error("OpenAI service is not available");
  }

  const messages = [{ role: 'system', content: systemPrompt }];

  // Add user context if available
  if (userProfile) {
    const contextMessage = `User Information:
    - Progress: ${JSON.stringify(userProfile.progress || {})}
    - Recent conversations: ${userProfile.recentConversations?.length || 0} recent interactions`;
    
    messages.push({ role: 'system', content: contextMessage });
  }

  messages.push({ role: 'user', content: question });

  const openaiRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return openaiRes.choices[0].message.content;
}

/**
 * Generate User Profile
 */
async function generateUserProfile(userId) {
  try {
    const progress = await safeGetUserProgress(userId);
    const recentConversations = await StellaConversation.find({ userId })
      .sort({ timestamp: -1 }).limit(5).lean();

    return {
      progress,
      recentConversations
    };
  } catch (error) {
    console.error('Error generating user profile:', error);
    return { progress: null, recentConversations: [] };
  }
}

/**
 * Safe getter for user progress
 */
async function safeGetUserProgress(userId) {
  try {
    return await UserProgress.findOne({ userId }).lean() || {};
  } catch (error) {
    console.error('Error getting user progress:', error);
    return {};
  }
}

// Simple test endpoint
router.get('/test', (req, res) => {
  res.json({ message: "STELLA API is working" });
});

// Initialize STELLA endpoint
router.get('/initialize', (req, res) => {
  res.json({
    success: true,
    message: "STELLA initialized successfully",
    version: "1.0"
  });
});
/**
 * Improved similarity check using more robust matching
 */
async function findSimilarQuestion(userId, question) {
  try {
    console.log(`Searching for similar questions to: "${question}"`);
    
    // Check if it's a critical question that should bypass similarity check
    const analysis = await analyzeQuestion(question);
    if (analysis.questionType === 'critical') {
      console.log('Critical question detected, bypassing similarity check');
      return { found: false };
    }
    
    // Extract keywords for better matching
    const keywords = question.split(/\s+/)
      .filter(word => word.length > 3)
      .map(word => word.toLowerCase());
    
    // Enhanced similarity check - require more keywords and better matching
    const significantKeywords = keywords.filter(word => !['what', 'when', 'where', 'which', 'who', 'why', 'how', 'will', 'does', 'can', 'could', 'should', 'would', 'have', 'has', 'had'].includes(word));
    
    if (significantKeywords.length < 2) {
      console.log('Not enough significant keywords for similarity matching');
      return { found: false };
    }
    
    // Create a more precise matching pattern requiring multiple keywords
    const keywordPattern = significantKeywords.join('.*');
    const queryCondition = { 
      content: { $regex: new RegExp(keywordPattern, 'i') }
    };
    
    console.log(`Using enhanced keyword pattern: ${keywordPattern}`);
    
    // Find similar questions with stricter matching
    const similarQuestions = await StellaConversation.find({
      fromUser: true,
      ...queryCondition
    })
    .sort({ 'frequencyData.similarQuestionCount': -1 })
    .limit(3)
    .lean();
    
    console.log(`Found ${similarQuestions.length} similar questions`);
    
    // Require higher similarity threshold
    if (similarQuestions.length > 0) {
      // Look through matches to find the best one
      for (const similarQuestion of similarQuestions) {
        console.log('Checking similar question:', similarQuestion.content);
        
        // Ensure question isn't too short (which could lead to false matches)
        if (similarQuestion.content.length < 15) {
          console.log('Skipping short question');
          continue;
        }
        
        // Calculate simple similarity score
        const similarWords = significantKeywords.filter(word => 
          similarQuestion.content.toLowerCase().includes(word)
        );
        
        const similarityScore = similarWords.length / significantKeywords.length;
        console.log(`Similarity score: ${similarityScore}`);
        
        // Only continue if similarity is strong enough
        if (similarityScore < 0.7) {
          console.log('Similarity score too low, skipping');
          continue;
        }
        
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
            similarity: similarityScore,
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
// Add this function
async function determineUserStage(userId) {
  try {
    const progress = await safeGetUserProgress(userId);
    const conversationCount = await StellaConversation.countDocuments({ userId });
    
    if (!progress || Object.keys(progress).length === 0) {
      return 'new_user';
    }
    
    const completedModules = progress.completedModules?.length || 0;
    const totalCredits = progress.credits || 0;
    
    if (completedModules >= 10 && totalCredits > 1000) {
      return 'advanced';
    } else if (completedModules >= 3 || totalCredits > 300) {
      return 'intermediate';
    } else {
      return 'beginner';
    }
  } catch (error) {
    console.error('Error determining user stage:', error);
    return 'beginner';
  }
}

async function fetchFromSLL(question, userId) {
  try {
    const similarQuestions = await StellaConversation.find({
      fromUser: true,
      content: { $regex: new RegExp(question, 'i') }
    }).limit(3).lean();

    if (similarQuestions.length > 0) {
      const response = await StellaConversation.findOne({
        fromUser: false,
        'metadata.sessionId': similarQuestions[0].metadata.sessionId
      }).sort({ timestamp: -1 }).lean();

      if (response) return response.content;
    }

    // Return null if nothing useful found
    return null;
  } catch (error) {
    console.error('Error fetching from STELLA Learning Library:', error);
    return null;
  }
}

/**
 * Generate direct OpenAI response for critical or complex questions
 */
async function getOpenAIResponse(question, userId, userProfile = null) {
  if (!openai) {
    throw new Error("OpenAI service is not available");
  }

  const messages = [{ role: 'system', content: systemPrompt }];

  // Add user context if available
  if (userProfile) {
    const contextMessage = `User Information:
    - Progress: ${JSON.stringify(userProfile.progress || {})}
    - Recent conversations: ${userProfile.recentConversations?.length || 0} recent interactions`;
    
    messages.push({ role: 'system', content: contextMessage });
  }

  messages.push({ role: 'user', content: question });

  const openaiRes = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  return openaiRes.choices[0].message.content;
}

/**
 * Generate User Profile
 */
async function generateUserProfile(userId) {
  try {
    const progress = await safeGetUserProgress(userId);
    const recentConversations = await StellaConversation.find({ userId })
      .sort({ timestamp: -1 }).limit(5).lean();

    return {
      progress,
      recentConversations
    };
  } catch (error) {
    console.error('Error generating user profile:', error);
    return { progress: null, recentConversations: [] };
  }
}

/**
 * Evaluate performance
 */
function evaluatePerformance(performanceData) {
  const { completionTime, accuracy, challengesCompleted } = performanceData;
  let score = (accuracy * 0.5) + (challengesCompleted * 0.3) - (completionTime / 1000 * 0.1);
  return Math.min(Math.max(score, 0), 1);
}

/**
 * Determine Achievements
 */
function determineAchievements(performanceData) {
  return ["Quick Learner", "Core Expert"];
}

/**
 * Calculate Credits
 */
function calculateCredits(score) {
  return Math.round(score * 100);
}

/**
 * Simple test endpoint
 */
router.get('/test', (req, res) => {
  res.json({ message: "STELLA API is working" });
});

/**
 * Initialize STELLA
 */
router.post('/initialize', (req, res) => {
  res.json({
    success: true,
    message: "STELLA initialized successfully",
    version: "1.0"
  });
});

/**
 * Connect to STELLA
 */
router.post('/connect', applyRateLimit, (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({
      success: false,
      error: "Missing required field: userId"
    });
  }
  
  res.json({
    success: true,
    sessionId: `stella_${Date.now()}`,
    message: "Connected to STELLA"
  });
});

/**
 * Get assessment status
 */
router.post('/assessment/status', applyRateLimit, async (req, res) => {
  const { userId, assessmentType } = req.body;

  if (!userId || !assessmentType) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: userId and/or assessmentType"
    });
  }

  try {
    if (trainingSystem && userId && userId !== 'anonymous') {
      const userProgress = await trainingSystem.getUserProgress(userId);

      if (userProgress?.assessmentsCompleted) {
        return res.json({
          success: true,
          completed: userProgress.assessmentsCompleted[assessmentType] || false,
          lastCompleted: null,
          nextAssessment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }

    res.json({
      success: true,
      completed: false,
      lastCompleted: null,
      nextAssessment: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });
  } catch (err) {
    console.error('Error fetching assessment status:', err);
    res.status(500).json({ success: false, error: 'Internal error retrieving assessment status.' });
  }
});

/**
 * Complete assessment
 */
router.post('/assessment/complete', applyRateLimit, async (req, res) => {
  const { userId, assessmentType, results } = req.body;

  if (!userId || !assessmentType) {
    return res.status(400).json({
      success: false,
      error: "Missing required fields: userId and/or assessmentType"
    });
  }

  try {
    if (trainingSystem && userId && userId !== 'anonymous') {
      trainingSystem.emit('assessment-completed', { userId, assessmentType, results });
    }

    console.log(`Assessment completed for user ${userId}, type: ${assessmentType}`);

    res.json({
      success: true,
      message: "Assessment recorded successfully",
      recommendations: [
        "Focus on core stability exercises",
        "Increase vestibular training frequency",
        "Add balance challenge progressions"
      ]
    });
  } catch (error) {
    console.error('Error completing assessment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete assessment: ' + error.message
    });
  }
});

/**
 * ✅ Route to handle user training performance data submission
 */
router.post('/progress/evaluate', applyRateLimit, async (req, res) => {
  try {
    const { userId, moduleId, performanceData } = req.body;

    if (!userId || !moduleId || !performanceData) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: userId, moduleId, or performanceData."
      });
    }

    const userProgressRecord = await UserProgress.findOneAndUpdate(
      { userId },
      {
        $push: { performanceHistory: { moduleId, performanceData, date: new Date() } },
        $set: { lastUpdated: new Date() }
      },
      { upsert: true, new: true }
    );

    const score = evaluatePerformance(performanceData);
    const achievements = determineAchievements(performanceData);
    const creditsEarned = calculateCredits(score);

    userProgressRecord.credits = (userProgressRecord.credits || 0) + creditsEarned;
    await userProgressRecord.save();

    res.json({
      success: true,
      message: "Performance evaluated and saved successfully.",
      score,
      credits: userProgressRecord.credits,
      achievements
    });

  } catch (error) {
    console.error("❌ Error saving performance data:", error);
    res.status(500).json({ success: false, error: "An error occurred while processing your performance data." });
  }
});
router.post('/guidance', applyRateLimit, async (req, res) => {
  const { userId, question } = req.body;

  if (!userId || !question) {
    return res.status(400).json({ success: false, error: 'userId and question required' });
  }

  const lowerQuestion = question.toLowerCase();

  // Handle dynamic date/time queries first
  if (lowerQuestion.includes("today's date") || lowerQuestion.includes("what day is it")) {
    return res.json({
      success: true,
      guidance: {
        message: `Today's date is ${new Date().toLocaleDateString()}.`
      }
    });
  }

  // Existing OpenAI logic here
  try {
    const responseContent = await getOpenAIResponse(question, userId);
    return res.json({ success: true, guidance: { message: responseContent } });
  } catch (error) {
    console.error("Error getting guidance:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Receive feedback on STELLA's responses for learning
 */
router.post('/feedback', applyRateLimit, async (req, res) => {
  try {
    const { userId, messageId, sessionId, helpful, rating, feedbackText } = req.body;

    if (!userId || (!messageId && !sessionId)) {
      return res.status(400).json({
        success: false,
        error: 'userId and either messageId or sessionId are required'
      });
    }

    // Find message to update
    let message;
    if (messageId) {
      message = await StellaConversation.findById(messageId);
    } else {
      message = await StellaConversation.findOne({
        userId,
        fromUser: false,
        'metadata.sessionId': sessionId
      }).sort({ timestamp: -1 });
    }

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    // Update message with feedback
    message.userFeedback = {
      helpful,
      rating: rating || null,
      feedbackText: feedbackText || null,
      receivedAt: new Date()
    };

    // Adjust confidence score based on feedback
    message.aiAnalysis = message.aiAnalysis || {};
    message.aiAnalysis.confidenceScore = helpful === false
      ? Math.max(0.5, (message.aiAnalysis.confidenceScore || 0.85) - 0.1)
      : Math.min(1.0, (message.aiAnalysis.confidenceScore || 0.85) + 0.05);

    await message.save();

    // If feedback is negative, purge from cache to prevent reuse
    if (!helpful && message.content) {
      const cacheKeys = Array.from(responseCache.keys());
      for (const key of cacheKeys) {
        const cachedData = responseCache.get(key);
        if (cachedData && cachedData.response === message.content) {
          console.log(`Purging negative feedback response from cache: ${key}`);
          responseCache.delete(key);
        }
      }
    }

    res.json({ success: true, message: 'Feedback received and processed' });

  } catch (error) {
    console.error('Error processing feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to process feedback: ' + error.message });
  }
});

/**
 * Get recent conversations
 */
router.get('/conversations/recent', applyRateLimit, async (req, res) => {
  try {
    const { userId, limit = 20 } = req.query;
    
    // Ensure userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }
    
    // Get recent conversations
    const recentConversations = await StellaConversation.find({ userId })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();
    
    res.json({ 
      success: true, 
      conversations: recentConversations 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch conversations' 
    });
  }
});

/**
 * Get most commonly asked questions
 */
router.get('/common-questions', applyRateLimit, async (req, res) => {
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
 * Get conversation statistics for a user
 */
router.get('/statistics/:userId', applyRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Valid userId is required'
      });
    }
    
    // Get statistics using the model method
    const stats = await StellaConversation.getStats(userId);
    
    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics: ' + error.message
    });
  }
});

/**
 * Clear conversation history for a user
 */
router.delete('/conversations/:userId', applyRateLimit, async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Valid userId is required'
      });
    }
    
   // Clear history using the model method
   await StellaConversation.clearHistory(userId);
    
   res.json({
     success: true,
     message: 'Conversation history cleared successfully'
   });
 } catch (error) {
   console.error('Error clearing conversation history:', error);
   res.status(500).json({ 
     success: false, 
     error: 'Failed to clear conversation history: ' + error.message
   });
 }
});

/**
* STELLA system status
*/
router.get('/status', (req, res) => {
 const isOpenAIAvailable = !!openai && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "MISSING_KEY";
 
 res.json({
   success: true,
   status: {
     online: true,
     openai: isOpenAIAvailable ? 'available' : 'unavailable',
     version: '1.0',
     timestamp: new Date().toISOString()
   }
 });
});

/**
* Get training recommendations for a specific user
*/
router.get('/recommendations/:userId', applyRateLimit, async (req, res) => {
 try {
   const { userId } = req.params;
   
   if (!userId || userId === 'undefined') {
     return res.status(400).json({
       success: false,
       error: 'Valid userId is required'
     });
   }
   
   // If training system is available, use it for recommendations
   if (trainingSystem) {
     try {
       const recommendedModules = await trainingSystem.getRecommendedModules(userId);
       
       return res.json({
         success: true,
         recommendations: recommendedModules.map(module => ({
           moduleId: module.moduleId,
           title: module.title,
           category: module.category,
           reason: module.aiRecommendation || 'Based on your progress',
           difficulty: module.difficulty
         }))
       });
     } catch (err) {
       console.error('Error getting recommendations from training system:', err);
       // Continue to fallback
     }
   }
   
   // Fallback recommendations based on conversation history
   const userConversations = await StellaConversation.find({ userId, fromUser: true })
     .sort({ timestamp: -1 })
     .limit(10)
     .lean();
   
   // Extract topics of interest from conversations
   const topics = userConversations.flatMap(conv => 
     conv.aiAnalysis?.topics || []
   );
   
   // Count topic frequencies
   const topicCounts = {};
   topics.forEach(topic => {
     topicCounts[topic] = (topicCounts[topic] || 0) + 1;
   });
   
   // Generate recommendations based on most frequent topics
   const recommendations = [];
   
   if (topicCounts['physical training'] > 0 || Object.keys(topicCounts).length === 0) {
     recommendations.push({
       moduleId: 'physical-core',
       title: 'Core & Balance Foundation',
       category: 'Physical Training',
       reason: 'Recommended starting point for all astronaut candidates',
       difficulty: 'beginner'
     });
   }
   
   if (topicCounts['mental preparation'] > 0) {
     recommendations.push({
       moduleId: 'mental-resilience',
       title: 'Cognitive Resilience',
       category: 'Mental Fitness',
       reason: 'Based on your interest in mental preparation',
       difficulty: 'intermediate'
     });
   }
   
   if (topicCounts['technical skills'] > 0) {
     recommendations.push({
       moduleId: 'tech-systems',
       title: 'Spacecraft Systems',
       category: 'Technical Training',
       reason: 'Based on your interest in technical skills',
       difficulty: 'advanced'
     });
   }
   
   // Ensure we have at least some recommendations
   if (recommendations.length === 0) {
     recommendations.push({
       moduleId: 'physical-core',
       title: 'Core & Balance Foundation',
       category: 'Physical Training',
       reason: 'Recommended starting point for all astronaut candidates',
       difficulty: 'beginner'
     });
     
     recommendations.push({
       moduleId: 'physical-endurance',
       title: 'Endurance Boost',
       category: 'Physical Training',
       reason: 'Essential for all space missions',
       difficulty: 'beginner'
     });
   }
   
   res.json({
     success: true,
     recommendations
   });
 } catch (error) {
   console.error('Error generating recommendations:', error);
   res.status(500).json({ 
     success: false, 
     error: 'Failed to generate recommendations: ' + error.message
   });
 }
});

module.exports = router;