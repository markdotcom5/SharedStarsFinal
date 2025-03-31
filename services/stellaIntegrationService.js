// stellaIntegrationService.js
const SpaceCognitiveLoadBalancer = require('./cognitive/SpaceCognitiveLoadBalancer');
const UserProgress = require('../models/UserProgress');
const StellaConversation = require('../models/StellaConversation');
const { openai } = require('./openaiService');

/**
 * STELLA Integration Service
 * 
 * A comprehensive service that integrates the Space Cognitive Load Balancer with
 * STELLA AI to provide personalized, context-aware responses and recommendations
 * for space training.
 */
class StellaIntegrationService {
  constructor() {
    console.log('✅ STELLA Integration Service initialized');
    
    // Initialize cache for frequently accessed data
    this.cache = {
      userProfiles: new Map(),
      commonResponses: new Map()
    };
    
    // Clean up cache periodically
    setInterval(() => this.cleanCache(), 3600000); // Every hour
  }

  /**
   * Generate a cognitive profile for new applications using Space Cognitive Load Balancer
   * @param {Object} applicationData - Application data containing user background, skills, etc.
   * @param {String} applicationId - Unique identifier for the application
   * @returns {Object} Cognitive profile and STELLA insights
   */
  async generateCognitiveProfile(applicationData, applicationId) {
    try {
      const cognitiveBalancer = new SpaceCognitiveLoadBalancer(applicationId);
      const cognitiveProfile = cognitiveBalancer.generateInitialProfile(applicationData);
      const stellaInsight = cognitiveBalancer.generateInsights();
      
      // Store insights for future reference
      await this.storeCognitiveProfile(applicationId, cognitiveProfile);
      
      return {
        cognitiveProfile,
        stellaInsight,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error generating cognitive profile:', error);
      throw error;
    }
  }

  /**
   * Store cognitive profile in database
   * @private
   * @param {String} userId - User identifier
   * @param {Object} profile - Cognitive profile to store
   */
  async storeCognitiveProfile(userId, profile) {
    try {
      // Implementation depends on your data model
      // This is a placeholder for actual storage logic
      this.cache.userProfiles.set(userId, {
        profile,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('Error storing cognitive profile:', error);
      return false;
    }
  }

  /**
   * Store conversation in database for learning and future reference
   * @param {String} userId - User identifier
   * @param {String} question - User's question
   * @param {String} response - STELLA's response
   * @param {Object} context - Additional context (module, mission, etc.)
   * @returns {String|null} Conversation ID if successful, null otherwise
   */
  async storeConversation(userId, question, response, context = {}) {
    try {
      // Generate question embedding for future vector search
      let questionEmbedding = null;
      try {
        questionEmbedding = await this.generateEmbedding(question);
      } catch (err) {
        console.error('Error generating embedding for stored question:', err);
      }
      
      const conversation = new StellaConversation({
        userId,
        content: question,
        fromUser: true,
        metadata: context,
        timestamp: new Date(),
        embeddings: {
          questionVector: questionEmbedding
        }
      });
      
      await conversation.save();
      
      // Store STELLA's response
      const responseDoc = new StellaConversation({
        userId,
        content: response,
        fromUser: false,
        metadata: context,
        timestamp: new Date(),
        relatedToId: conversation._id
      });
      
      await responseDoc.save();
      
      return conversation._id;
    } catch (error) {
      console.error('Error storing conversation:', error);
      return null;
    }
  }

  /**
   * Find similar conversations using keyword-based search (fallback method)
   * @param {String} question - User's question
   * @param {Number} limit - Maximum number of results to return
   * @returns {Array} Similar conversations
   */
  async findSimilarConversations(question, limit = 5) {
    try {
      const keywords = question.toLowerCase()
        .split(' ')
        .filter(word => word.length > 3);
      
      // Simple keyword-based search
      const conversations = await StellaConversation.find({
        fromUser: true,
        $text: { $search: keywords.join(' ') }
      })
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();
      
      return conversations;
    } catch (error) {
      console.error('Error finding similar conversations:', error);
      return [];
    }
  }

  /**
   * Find similar conversations using vector similarity search (primary method)
   * @param {String} question - User's question
   * @param {Number} limit - Maximum number of results to return
   * @returns {Array} Similar conversations with vector similarity scores
   */
  async findSimilarConversationsWithVectors(question, limit = 5) {
    try {
      // Generate embedding for the question using OpenAI
      const embedding = await this.generateEmbedding(question);
      
      // Query MongoDB using vector search with the stella_embedding_index
      const conversations = await StellaConversation.aggregate([
        {
          $search: {
            index: "stella_embedding_index",
            knnBeta: {
              vector: embedding,
              path: "embeddings.questionVector",
              k: limit,
              similarity: 0.7 // Minimum similarity threshold
            }
          }
        },
        {
          $match: { fromUser: true } // Only match user questions
        },
        {
          $addFields: {
            similarity: { $meta: "searchScore" } // Add similarity score to results
          }
        },
        {
          $sort: { similarity: -1 } // Sort by similarity score
        },
        {
          $limit: limit 
        }
      ]);
      
      return conversations;
    } catch (error) {
      console.error('Error finding similar conversations with vectors:', error);
      // Fall back to keyword-based search if vector search fails
      return this.findSimilarConversations(question, limit);
    }
  }

  /**
   * Process user question and generate a personalized response
   * @param {String} userId - User identifier
   * @param {String} question - User's question
   * @param {Object} contextParams - Additional context parameters
   * @returns {Object} Response object with message, confidence, etc.
   */
  async processQuestion(userId, question, contextParams = {}) {
    try {
      // Calculate response start time
      const startTime = Date.now();
      
      // Store user question
      const userMessage = await StellaConversation.addMessage(
        userId,
        question,
        true,  // fromUser = true
        {
          context: contextParams.moduleType || 'general',
          moduleId: contextParams.moduleId,
          missionId: contextParams.missionId
        }
      );
      
      // Analyze the question to get intent and topics
      const questionAnalysis = this.analyzeQuestion(question);
      
      // Find similar questions using vector search
      const similarQuestions = await this.findSimilarConversationsWithVectors(question);
      
      let response;
      let confidenceScore = 0.7; // Default confidence
      let usedSimilarQuestionId = null;
      
      // If we have a similar question with high frequency, use its response
      if (similarQuestions.length > 0 && 
          similarQuestions[0].frequencyData && 
          similarQuestions[0].frequencyData.similarQuestionCount > 2 &&
          similarQuestions[0].similarity > 0.85) {
        // Get the corresponding AI response
        const previousResponses = await StellaConversation.find({
          userId: similarQuestions[0].userId,
          fromUser: false,
          timestamp: { $gt: similarQuestions[0].timestamp }
        })
        .sort({ timestamp: 1 })
        .limit(1)
        .lean();
        
        if (previousResponses.length > 0) {
          response = previousResponses[0].content;
          confidenceScore = 0.90; // Higher confidence for reused answers
          usedSimilarQuestionId = similarQuestions[0]._id;
          
          // Increment the question frequency
          await StellaConversation.incrementQuestionFrequency(similarQuestions[0]._id);
        }
      }
      
      // If no similar question found, generate a new response
      if (!response) {
        // Generate personalized response using context-aware OpenAI
        const { getOpenAIResponse } = require('./getOpenAIResponse');
        response = await getOpenAIResponse(question, userId, contextParams);
        confidenceScore = 0.85; // Lower confidence for new responses
      }
      
      // Calculate response time
      const responseTime = Date.now() - startTime;
      
      // Generate embedding for the question
      let questionEmbedding;
      try {
        questionEmbedding = await this.generateEmbedding(question);
      } catch (err) {
        console.error('Error generating embedding for question:', err);
        questionEmbedding = null;
      }
      
      // Store STELLA's response
      const stellaMessage = await StellaConversation.addMessage(
        userId,
        response,
        false, // fromUser = false (it's from STELLA)
        {
          context: contextParams.moduleType || 'general',
          moduleId: contextParams.moduleId,
          missionId: contextParams.missionId
        }
      );
      
      // Update the STELLA message with analysis data and embedding
      await StellaConversation.findByIdAndUpdate(
        stellaMessage._id,
        {
          $set: {
            'aiAnalysis.intent': questionAnalysis.intent,
            'aiAnalysis.topics': questionAnalysis.topics,
            'aiAnalysis.questionType': questionAnalysis.questionType,
            'aiAnalysis.keyEntities': questionAnalysis.keyEntities,
            'aiAnalysis.confidenceScore': confidenceScore,
            'frequencyData.responseTime': responseTime,
            'embeddings.questionVector': questionEmbedding,
            'relatedQuestionId': usedSimilarQuestionId
          }
        }
      );
      
      // Extract key action items or recommendations from the response
      const actionItems = this.extractActionItems(response);
      
      return {
        response,
        messageId: stellaMessage._id,
        confidenceScore,
        confidenceDisplay: this.getConfidenceDisplay(confidenceScore),
        responseTime,
        topics: questionAnalysis.topics,
        actionItems,
        similarQuestionFound: !!usedSimilarQuestionId
      };
    } catch (error) {
      console.error('Error processing question:', error);
      throw error;
    }
  }

  /**
   * Extract action items from STELLA's response
   * @private
   * @param {String} response - STELLA's response text
   * @returns {Array} Extracted action items
   */
  extractActionItems(response) {
    // Try to find bullet points or numbered lists
    const bulletMatch = response.match(/(\n[•\-*]\s[^\n]+)+/g);
    if (bulletMatch) {
      return bulletMatch[0]
        .split('\n')
        .filter(line => line.trim().match(/^[•\-*]\s/))
        .map(line => line.trim().replace(/^[•\-*]\s/, ''))
        .filter(item => item.length > 0);
    }
    
    // Try to find numbered items
    const numberedMatch = response.match(/(\n\d+\.\s[^\n]+)+/g);
    if (numberedMatch) {
      return numberedMatch[0]
        .split('\n')
        .filter(line => line.trim().match(/^\d+\.\s/))
        .map(line => line.trim().replace(/^\d+\.\s/, ''))
        .filter(item => item.length > 0);
    }
    
    // Default empty list if no action items found
    return [];
  }

  /**
   * Analyze a user question to extract intent, topics, and entities
   * @param {String} question - User's question
   * @returns {Object} Analysis results with intent, topics, and entities
   */
  analyzeQuestion(question) {
    const questionLower = question.toLowerCase();
    
    // Detect intent (enhanced version)
    let intent = 'information';
    
    if (questionLower.match(/^(how|what is|what are|explain|describe)/)) {
      intent = 'information';
    } else if (questionLower.match(/^(help|assist|support|aid)/)) {
      intent = 'help';
    } else if (questionLower.match(/^(can you|would you|could you|please)/)) {
      intent = 'request';
    } else if (questionLower.match(/^(why|reason)/)) {
      intent = 'explanation';
    } else if (questionLower.match(/^(compare|versus|vs|difference)/)) {
      intent = 'comparison';
    }
    
    // Detect question type (enhanced version)
    let questionType = 'informational';
    
    if (questionLower.includes('help') || questionLower.includes('stuck') || questionLower.includes('struggling')) {
      questionType = 'help';
    } else if (questionLower.includes('advice') || questionLower.includes('guidance') || questionLower.includes('suggest')) {
      questionType = 'guidance';
    } else if (questionLower.includes('feedback') || questionLower.includes('review') || questionLower.includes('evaluate')) {
      questionType = 'feedback';
    } else if (questionLower.includes('technical') || questionLower.includes('error') || questionLower.includes('bug')) {
      questionType = 'technical';
    } else if (questionLower.includes('test') || questionLower.includes('assessment') || questionLower.includes('exam')) {
      questionType = 'assessment';
    } else if (questionLower.includes('critical') || questionLower.includes('urgent') || questionLower.includes('emergency')) {
      questionType = 'critical';
    }
    
    // Extract topics (enhanced with space training specifics)
    const topicKeywords = {
      'physical training': ['physical', 'training', 'exercise', 'workout', 'fitness', 'strength', 'endurance', 'cardio'],
      'technical skills': ['technical', 'skill', 'technology', 'computer', 'software', 'hardware', 'system', 'module'],
      'space operations': ['space', 'operations', 'mission', 'astronaut', 'cosmonaut', 'procedure', 'protocol', 'safety'],
      'zero gravity': ['zero', 'gravity', 'weightless', 'microgravity', 'float', 'orbit', 'freefall'],
      'life support': ['life', 'support', 'oxygen', 'breathing', 'air', 'water', 'food', 'waste', 'recycle', 'system'],
      'medical': ['medical', 'health', 'doctor', 'emergency', 'first aid', 'injury', 'sick', 'medicine'],
      'psychology': ['psychology', 'mental', 'stress', 'isolation', 'confined', 'mind', 'emotional', 'psychological'],
      'communication': ['communication', 'radio', 'transmit', 'receive', 'signal', 'message', 'talk', 'speak'],
      'navigation': ['navigation', 'direction', 'map', 'coordinate', 'position', 'locate', 'orientation'],
      'docking': ['dock', 'docking', 'connect', 'port', 'attach', 'link', 'coupling'],
      'eva': ['eva', 'extravehicular', 'spacewalk', 'outside', 'suit', 'tether', 'airlock'],
      'reentry': ['reentry', 're-entry', 'return', 'atmosphere', 'descent', 'landing', 'touchdown']
    };
    
    const topics = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => questionLower.includes(keyword))) {
        topics.push(topic);
      }
    }
    
    // Extract key entities using regex patterns for better accuracy
    const entities = [];
    
    // Match potential spacecraft names
    const spacecraftMatch = question.match(/\b(ISS|Soyuz|Dragon|Starliner|Orion|Crew Dragon|Shenzhou|Tiangong|SpaceX)\b/g);
    if (spacecraftMatch) entities.push(...spacecraftMatch);
    
    // Match potential space agencies
    const agencyMatch = question.match(/\b(NASA|ESA|Roscosmos|CNSA|JAXA|CSA|ISRO)\b/g);
    if (agencyMatch) entities.push(...agencyMatch);
    
    // Match potential training modules (based on SharedStars naming)
    const moduleMatch = question.match(/\b(Module|Mission|Training|Exercise|Phase|Level|Stage)[-\s]?(\d+|[IV]+)\b/g);
    if (moduleMatch) entities.push(...moduleMatch);
    
    // Fall back to basic entity extraction for other words
    const basicEntities = question
      .split(/\s+/)
      .filter(word => word.length > 3 && word[0] === word[0].toUpperCase())
      .map(word => word.replace(/[.,;:!?]$/, ''));
    
    entities.push(...basicEntities);
    
    return {
      intent,
      topics: topics.length > 0 ? topics : ['general'],
      questionType,
      keyEntities: [...new Set(entities)] // Remove duplicates
    };
  }

  /**
   * Generate embeddings for text using OpenAI
   * @param {String} text - Text to generate embedding for
   * @returns {Array} Vector embedding
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        input: text,
        model: 'text-embedding-3-small'
      });
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Convert confidence score to user-friendly display text
   * @param {Number} score - Confidence score (0-1)
   * @returns {String} User-friendly confidence description
   */
  getConfidenceDisplay(score) {
    if (score > 0.9) return "Very High Confidence";
    if (score > 0.75) return "High Confidence";
    if (score > 0.5) return "Moderate Confidence";
    if (score > 0.25) return "Low Confidence";
    return "Very Low Confidence";
  }

  /**
   * Process user feedback on STELLA's responses
   * @param {String} messageId - Message ID to update
   * @param {Object} feedback - User feedback (helpful, rating, text)
   * @returns {Boolean} Success status
   */
  async processFeedback(messageId, feedback) {
    try {
      // Store the feedback
      await StellaConversation.storeUserFeedback(messageId, feedback);
      
      // Update the message's response quality
      let responseQuality = 3; // Default
      
      if (feedback.rating) {
        responseQuality = feedback.rating;
      } else if (feedback.helpful === true) {
        responseQuality = 4;
      } else if (feedback.helpful === false) {
        responseQuality = 2;
      }
      
      // Update the message
      const updatedMessage = await StellaConversation.findByIdAndUpdate(
        messageId,
        { 
          $set: { 
            'aiAnalysis.responseQuality': responseQuality,
            'userFeedback.feedbackText': feedback.feedbackText || '',
            'userFeedback.receivedAt': new Date()
          } 
        },
        { new: true }
      );
      
      // If this was a very good response (rating >= 4), add it to common responses
      if (responseQuality >= 4 && updatedMessage) {
        this.cache.commonResponses.set(updatedMessage.content, {
          responseQuality,
          count: (this.cache.commonResponses.get(updatedMessage.content)?.count || 0) + 1
        });
      }
      
      return true;
    } catch (error) {
      console.error('Error processing feedback:', error);
      return false;
    }
  }

  /**
   * Get trending topics from recent conversations
   * @param {Number} days - Number of days to look back
   * @param {Number} limit - Maximum number of topics to return
   * @returns {Array} Trending topics with counts
   */
  async getTrendingTopics(days = 7, limit = 5) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const topicAggregation = await StellaConversation.aggregate([
        {
          $match: {
            timestamp: { $gte: startDate },
            'aiAnalysis.topics': { $exists: true, $ne: [] }
          }
        },
        { $unwind: '$aiAnalysis.topics' },
        {
          $group: {
            _id: '$aiAnalysis.topics',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: limit }
      ]);
      
      return topicAggregation.map(item => ({
        topic: item._id,
        count: item.count
      }));
    } catch (error) {
      console.error('Error getting trending topics:', error);
      return [];
    }
  }

  /**
   * Update user's cognitive profile based on training performance
   * @param {String} userId - User identifier
   * @param {Object} trainingData - Training performance data
   * @returns {Object} Updated cognitive profile
   */
  async updateCognitiveProfile(userId, trainingData) {
    try {
      // Fetch current profile
      const userProgress = await UserProgress.findOne({ userId });
      if (!userProgress || !userProgress.cognitiveProfile) {
        throw new Error('User cognitive profile not found');
      }
      
      // Update cache
      this.cache.userProfiles.set(userId, {
        profile: userProgress.cognitiveProfile,
        timestamp: Date.now()
      });
      
      return userProgress.cognitiveProfile;
    } catch (error) {
      console.error('Error updating cognitive profile:', error);
      throw error;
    }
  }

  /**
   * Clean expired items from cache
   * @private
   */
  cleanCache() {
    const now = Date.now();
    const expiry = 3600000; // 1 hour in milliseconds
    
    // Clean user profiles
    for (const [userId, data] of this.cache.userProfiles.entries()) {
      if (now - data.timestamp > expiry) {
        this.cache.userProfiles.delete(userId);
      }
    }
    
    // Limit common responses to most recent 100
    if (this.cache.commonResponses.size > 100) {
      const entries = [...this.cache.commonResponses.entries()];
      entries.sort((a, b) => b[1].count - a[1].count);
      
      this.cache.commonResponses.clear();
      entries.slice(0, 100).forEach(([key, value]) => {
        this.cache.commonResponses.set(key, value);
      });
    }
  }
}

module.exports = new StellaIntegrationService();