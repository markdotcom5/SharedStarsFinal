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

/**
 * POST /api/stella/guidance
 * Get real-time guidance from STELLA using OpenAI
 */
router.post('/guidance', async (req, res) => {
  const startTime = Date.now();
  try {
    // Ensure request body is properly parsed
    if (!req.body) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid request body',
        guidance: {
          message: "I received an empty request. Please try again with a question.",
          actionItems: []
        }
      });
    }

    c// Extract conversation history from request if provided
// Extract conversation history from request if provided
const { userId, exerciseId, metrics, question, conversationHistory = [] } = req.body;    
    // Ensure userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required',
        guidance: {
          message: "I need a user identifier to provide personalized guidance.",
          actionItems: ["Try refreshing the page", "Log in again if you were previously logged in"]
        }
      });
    }
    
    // Check rate limit
    const now = Date.now();
    const userRequests = userRateLimit.get(userId) || [];
    
    // Filter requests from last minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        guidance: {
          message: "You're asking questions too quickly. Please wait a moment before trying again.",
          actionItems: []
        }
      });
    }
    
    // Update rate limit tracker
    userRateLimit.set(userId, [...recentRequests, now]);
    
    if (!question) {
      return res.json({
        success: true,
        guidance: {
          message: "What would you like to know about your space training?",
          actionItems: ["Ask about modules", "Check your progress", "Get exercise guidance"]
        }
      });
    }
    
    // Generate a session ID for this conversation
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Check cache first
    const cacheKey = `${userId}_${question.toLowerCase().trim()}`;
    const cachedResponse = responseCache.get(cacheKey);
    if (cachedResponse && (Date.now() - cachedResponse.timestamp < CACHE_TTL)) {
      console.log('Using cached response');
      return res.json({
        success: true,
        guidance: cachedResponse.guidance,
        source: 'cache'
      });
    }
    
    // NEW: Analyze the question
    const questionAnalysis = await analyzeQuestion(question);
    
    // NEW: Check for similar questions in the database
    const similarQuestionResult = await findSimilarQuestion(userId, question);
    
    if (similarQuestionResult.found) {
      console.log('Found similar question, using existing response');
      
      // Extract guidance from the stored response
      const guidance = {
        message: similarQuestionResult.response.content.split('\n')[0] || similarQuestionResult.response.content,
        actionItems: extractActionItems(similarQuestionResult.response.content)
      };
      
      // Store this question for learning, but mark it as using an existing response
      await StellaConversation.create({
        userId,
        fromUser: true,
        content: question,
        timestamp: new Date(),
        metadata: {
          context: exerciseId ? 'training' : 'general',
          moduleId: exerciseId ? 'physical' : undefined,
          exerciseId: exerciseId || undefined,
          metrics: metrics || undefined,
          sessionId
        },
        aiAnalysis: {
          ...questionAnalysis,
          confidenceScore: 0.95  // Higher confidence since we've seen this before
        },
        frequencyData: {
          similarQuestionCount: 1,
          lastAsked: new Date(),
          responseTime: Date.now() - startTime
        }
      });
      
      // Store the reused response
      await StellaConversation.create({
        userId,
        fromUser: false,
        content: similarQuestionResult.response.content,
        timestamp: new Date(),
        metadata: {
          context: exerciseId ? 'training' : 'general',
          moduleId: exerciseId ? 'physical' : undefined,
          exerciseId: exerciseId || undefined,
          sessionId
        },
        aiAnalysis: {
          questionType: questionAnalysis.questionType,
          topics: questionAnalysis.topics,
          confidenceScore: 0.95
        },
        frequencyData: {
          similarQuestionCount: similarQuestionResult.question.frequencyData?.similarQuestionCount + 1 || 2,
          lastAsked: new Date(),
          responseTime: Date.now() - startTime
        }
      });
      
      // Store in cache
      responseCache.set(cacheKey, {
        guidance,
        timestamp: Date.now()
      });
      
      return res.json({
        success: true,
        guidance,
        source: 'similarity'
      });
    }
    
    // 1. FETCH USER PROGRESS DATA
// 1. FETCH USER PROGRESS DATA
let userContext = "";
try {
  // Use your safety utility instead of direct query
  const userProgress = await safeGetUserProgress(userId);
  
  if (userProgress) {
    // Extract meaningful data from UserProgress
    const physicalTraining = userProgress.physicalTraining || {};
    const moduleProgress = userProgress.moduleProgress || [];
    const physicalModule = moduleProgress.find(m => m.moduleId === 'physical') || {};
    
    // Format user progress data for the prompt
    userContext = ` USER PROGRESS: 
- Overall completion: ${physicalTraining.overallProgress || 0}%
- Completed missions: ${physicalTraining.completedMissions || 0} of ${physicalTraining.totalMissions || 10}
- Active mission: ${physicalTraining.activeMission || 'Not started'}
- Total training credits: ${userProgress.credits?.total || 0}
- Last activity: ${physicalTraining.lastActivity ? new Date(physicalTraining.lastActivity).toLocaleDateString() : 'No activity yet'}
`;
    
    // Truncate to token limit
    if (estimateTokens(userContext) > MAX_USER_CONTEXT_TOKENS) {
      // Prioritize essential information
      userContext = ` USER PROGRESS: 
- Overall completion: ${physicalTraining.overallProgress || 0}%
- Completed missions: ${physicalTraining.completedMissions || 0} of ${physicalTraining.totalMissions || 10}
- Active mission: ${physicalTraining.activeMission || 'Not started'}
- Total training credits: ${userProgress.credits?.total || 0}
`;
    }
  } else {
    // Handle anonymous or non-existent users
    userContext = ` USER PROGRESS: 
- New or anonymous user
- No training data available yet
- Recommend initial assessment
`;
  }
} catch (err) {
  console.error("Error fetching user progress:", err);
  // Continue with minimal context
  userContext = " USER PROGRESS: Unable to retrieve user data.";
}

// 2. PREPARE CONVERSATION CONTEXT
let conversationContext = "";

// Use provided conversation history if available, otherwise fetch from database
if (conversationHistory && conversationHistory.length > 0) {
  // Format provided conversation history
  conversationContext = "RECENT CONVERSATIONS:\n";
  for (const msg of conversationHistory) {
    const role = msg.fromUser ? "User" : "STELLA";
    conversationContext += `${role}: ${msg.content}\n`;
  }
} else {
  // Existing database fetch code...
  try {
    // Get recent conversations - use safe approach for userId here too
    const recentConversations = userId === 'anonymous' || !isValidObjectId(userId) 
      ? [] 
      : await StellaConversation.find({ userId }).sort({ timestamp: -1 }).limit(5);
    
    if (recentConversations && recentConversations.length > 0) {
      // Format conversation history
      conversationContext = "RECENT CONVERSATIONS:\n";
      
      // Track token count
      let tokenCount = estimateTokens(conversationContext);
      
      // Add conversations until token limit
      for (const msg of recentConversations) {
        const role = msg.fromUser ? "User" : "STELLA";
        const msgText = `${role}: ${msg.content}\n`;
        const msgTokens = estimateTokens(msgText);
        
        // Check if adding this would exceed token limit
        if (tokenCount + msgTokens > MAX_CONVERSATION_TOKENS) {
          break;
        }
        
        conversationContext += msgText;
        tokenCount += msgTokens;
      }
    } else {
      conversationContext = "RECENT CONVERSATIONS: No previous conversations found.\n";
    }
  } catch (err) {
    console.error("Error fetching conversation history:", err);
    // Continue with minimal context
    conversationContext = "RECENT CONVERSATIONS: Unable to retrieve conversation history.\n";
  }
}

// 3. CREATE COMPREHENSIVE SYSTEM PROMPT
const systemPrompt = `You are STELLA, an AI assistant for space training on SharedStars. You help users prepare for space missions through guided training programs. Your name stands for Space Training Enhancement and Learning Logic Assistant.

When responding to users:
1. Be direct and action-oriented - don't just acknowledge their question
2. Provide specific next steps they can take, not just general suggestions
3. If they ask about starting training or assessments, give them clear options to click/select
4. When they express interest in a specific activity, guide them to start immediately
5. Format your response with a concise main message followed by 2-3 actionable suggestions

Example good response to "Can I start training?":
"Yes, you're ready to begin your training! Click one of these options to get started:
- Start Assessment - Begin with a personalized evaluation (recommended for new trainees)
- Physical Training - Jump straight into physical conditioning exercises
- Technical Skills - Start with technical knowledge modules"

SHAREDSTARS PLATFORM OVERVIEW:
SharedStars is a platform dedicated to preparing humanity for space exploration through AI-driven learning, mission-based readiness, and real-time progress tracking. The platform offers personalized journeys to space readiness with the goal of democratizing access to space training. The platform accelerates users' timeline to space readiness by approximately 5 years compared to traditional methods.

TRAINING METHODOLOGY:
- AI-driven assessment of background and skills before assigning modules
- Users can choose from available modules or follow AI's suggested path
- Pre-training assessment allows AI to adapt learning difficulty based on results
- Mission-based training with live AI coaching (you, STELLA)
- Progress tracking via leaderboard, with certifications awarded upon completion

TRAINING MODULES OVERVIEW:
1. Physical Training (Most Popular)
   - Core & Balance Foundation: Focuses on developing central body strength and stability for zero-gravity environments
   - Endurance Boost: Builds cardiovascular fitness and stamina for prolonged space missions
   - Strength Training: Develops muscle groups essential for EVA activities and movement in variable gravity
   - Flexibility & Mobility: Increases range of motion and joint health for confined space environments

2. Mental Fitness
   - Cognitive Resilience: Trains focus and decision-making under stress
   - Stress Management: Techniques for psychological adaptation to space
   - Team Dynamics: Communication and collaboration in isolated environments
   - Adaptation Training: Preparing for environmental and physiological changes
   - Mental Performance: Techniques for maintaining peak cognitive function during long-duration missions

3. Leadership Training
   - Crisis Management: Decision-making during emergencies
   - Team Coordination: Managing team dynamics in confined spaces
   - Deep Space Communication: Effective communication with significant time delays
   - Resource Management: Optimizing limited supplies and equipment

4. Technical Training (Premium)
   - Spacecraft Systems: Understanding life support, navigation, and power systems
   - Emergency Procedures: Protocols for handling various crisis scenarios
   - Technical Operations: Daily maintenance and operations in space environments
   - System Troubleshooting: Identifying and resolving technical issues
   - Communications: Operating and maintaining communications systems
   - Data Management: Collecting, storing, and transmitting mission data

5. EVA Training
   - Extravehicular Activity procedures for spacewalks
   - Safety protocols for operating outside spacecraft
   - Tool manipulation in pressurized suits
   - EVA mission planning and execution

PHYSICAL TRAINING DETAILS:
- Core & Balance Foundation: This mission focuses on developing core strength through planks, stability ball exercises, and single-leg balance drills. These exercises help astronauts maintain proper positioning in zero gravity.
- Endurance Boost: This mission improves cardiovascular fitness through interval training, sustained cardio exercises, and recovery techniques. Critical for long-duration space missions.
- Strength Training: Uses resistance training focused on key muscle groups needed for EVA operations, including chest, back, legs, and arms.
- Flexibility Training: Increases range of motion through dynamic and static stretching protocols, essential for movement in confined spaces.

SPACE CHALLENGES AND TRAINING FOCUS:
- Muscle atrophy is a significant challenge in spaceflight. Resistance training programs are designed to minimize muscle loss through targeted high-intensity exercises.
- Bone density loss in microgravity requires impact exercises and resistance training to maintain bone health.
- Vestibular adaptation is critical for astronauts to adapt quickly to changing gravitational environments.
- EVA operations require exceptional upper body strength, fine motor control, and cardiovascular endurance.

${userContext}

${conversationContext}

QUESTION ANALYSIS:
- Question type: ${questionAnalysis.questionType}
- Key entities: ${questionAnalysis.keyEntities.join(', ')}
- Topics: ${questionAnalysis.topics.join(', ')}

Respond as STELLA in a helpful, encouraging tone. Keep responses concise and practical.
Format your response with a main message followed by 2-3 actionable suggestions that are bulleted with "- " at the beginning of each line.`;

// 4. CALL OPENAI WITH ENHANCED CONTEXT
let messages = [{ role: "system", content: systemPrompt }];

// Add the current question
messages.push({ role: "user", content: question });

try {
  // Save user's question in the database with the session ID
  const userQuestion = await StellaConversation.create({
    userId,
    fromUser: true,
    content: question,
    timestamp: new Date(),
    metadata: {
      context: exerciseId ? 'training' : 'general',
      moduleId: exerciseId ? 'physical' : undefined,
      exerciseId: exerciseId || undefined,
      metrics: metrics || undefined,
      sessionId
    },
    aiAnalysis: questionAnalysis
  });
  
  // Call OpenAI API
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    max_tokens: 500,
    temperature: 0.7,
    presence_penalty: 0.6,
    frequency_penalty: 0.3
  });
  
  // Extract the assistant's response
  const assistantResponse = response.choices[0].message.content;
  const responseEndTime = Date.now();
  const responseTime = responseEndTime - startTime;
  
  // Store STELLA's response with session ID linkage and timing info
  const stellaResponse = await StellaConversation.create({
    userId,
    fromUser: false,
    content: assistantResponse,
    timestamp: new Date(),
    metadata: {
      context: exerciseId ? 'training' : 'general',
      moduleId: exerciseId ? 'physical' : undefined,
      exerciseId: exerciseId || undefined,
      sessionId
    },
    aiAnalysis: {
      questionType: questionAnalysis.questionType,
      topics: questionAnalysis.topics,
      confidenceScore: 0.85 // Default confidence score
    },
    frequencyData: {
      similarQuestionCount: 1,
      lastAsked: new Date(),
      responseTime
    }
  });
  
  // Extract action items from the response
  let message = assistantResponse;
  let actionItems = [];
  
  // Try to extract action items from bullet points
  const bulletPointMatch = assistantResponse.match(/(\n-[^\n]+)+/g);
  if (bulletPointMatch) {
    // Extract main message (everything before first bullet point)
    const firstBulletIndex = assistantResponse.indexOf("\n-");
    if (firstBulletIndex > 0) {
      message = assistantResponse.substring(0, firstBulletIndex).trim();
    }
    // Add conversation history if available
if (conversationHistory && conversationHistory.length > 0) {
  conversationHistory.forEach(msg => {
    messages.push({
      role: msg.fromUser ? "user" : "assistant",
      content: msg.content
    });
  });
}

// Add the current question
messages.push({ role: "user", content: question });
    // Extract action items from bullet points
    actionItems = bulletPointMatch[0]
      .split("\n")
      .filter(line => line.trim().startsWith("-"))
      .map(line => line.trim().substring(1).trim());
  } else {
    // Alternative approach for other bullet formats
    const paragraphs = assistantResponse.split('\n\n');
    if (paragraphs.length > 1) {
      message = paragraphs[0];
      
      for (const paragraph of paragraphs.slice(1)) {
        const lines = paragraph.split('\n');
        const bulletLines = lines.filter(line => 
          line.trim().startsWith("- ") || 
          line.trim().startsWith("* ") || 
          line.trim().match(/^\d+\./)
        );
        
        if (bulletLines.length > 0) {
          actionItems = bulletLines.map(line => 
            line.trim()
              .replace(/^[- *]\s+/, "")
              .replace(/^\d+\.\s+/, "")
          );
          break;
        }
      }
    }
  }
  
  // If no action items found, extract sentences
  if (actionItems.length === 0) {
    const sentences = assistantResponse.match(/[^.!?]+[.!?]+/g) || [];
    if (sentences.length > 1) {
      message = sentences[0].trim();
      actionItems = sentences.slice(1, 4).map(s => s.trim());
    } else {
      // Default action items if extraction fails
      actionItems = [
        "Start your assessment", 
        "Begin Core & Balance training", 
        "Track your progress"
      ];
    }
  }
  
  // Prepare final response
  const finalResponse = {
    message: message,
    actionItems: actionItems.slice(0, 3) // Limit to top 3 action items
  };
  
  // Store in cache
  responseCache.set(cacheKey, {
    guidance: finalResponse,
    timestamp: Date.now()
  });
  
  // Return response with timing information
  return res.json({
    success: true,
    guidance: finalResponse,
    metadata: {
      responseTime: responseTime,
      source: 'openai'
    }
  });
} catch (error) {
  console.error('Error with OpenAI API:', error);
  
  // For errors, return a helpful message
  res.status(500).json({ 
    success: false, 
    error: 'Failed to get guidance: ' + error.message,
    guidance: {
      message: "I'm having trouble accessing my knowledge base right now. Please try again in a moment.",
      actionItems: [
        "Try refreshing the page",
        "Check your internet connection",
        "Try a more specific question"
      ]
    }
  });
}


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