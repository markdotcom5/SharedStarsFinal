/**
 * CoreAIServices.js
 * 
 * Consolidated AI core services providing foundational AI functionality
 * for the space training platform. This module integrates functionality from:
 * - AICore.js
 * - AIService.js 
 * - AIServiceIntegrator.js
 * - AIOrchestrator.js
 */

const { EventEmitter } = require('events');
const mongoose = require('mongoose');
const openai = require('./openaiService');  // ✅ Correct unified import

// Import required models
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const TrainingSession = require('../models/TrainingSession');
const Module = require('../models/Module');
const Subscription = require('../models/Subscription');

class CoreAIServices extends EventEmitter {
  constructor() {
    super();

    // Initialize OpenAI correctly
    this.openai = this.initializeOpenAI();

    if (!this.openai) {
      console.error("❌ OpenAI client failed to initialize.");
      throw new Error("OpenAI initialization failed");
    } else {
      console.log("✅ OpenAI client initialized successfully");
    }

    // AI config (existing code)
    this.config = {
      model: process.env.OPENAI_MODEL || "gpt-4-turbo",
      temperature: 0.7,
      languages: ['en'],
      subscriptionMultipliers: {
        premium: 1.5,
        individual: 1,
        family: 1.2,
        galactic: 2.0,
        custom: (amount) => (amount >= 100 ? 1.5 : 1)
      }
    };

    // AI subsystems registration (existing code)
    this.subsystems = new Map();

    // Integrated subsystems
    this.learningSystem = null;
    this.guidanceSystem = null;
    this.spaceCoach = null;
    this.webController = null;
    this.socialIntegrator = null;

    // Queue for AI requests
    this.requestQueue = [];
    this.isProcessing = false;

    // Performance tracking
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastResponseTime: 0,
      requestHistory: []
    };

    // Initialize the service
    this.initialize();  // ✅ Ensure this call remains here
  }

  /**
   * Initialize OpenAI API client
   */
  initializeOpenAI() {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('❌ OpenAI API key not found in environment variables');
        throw new Error('Missing OpenAI API Key');
      }
      return openai;
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI client:', error);
      return null;
    }
  }

 /**
 * Initialize the AI service and set up event listeners
 */
initialize() {
  // Set up event listeners
  this.on('ai-request', this.handleAIRequest.bind(this));
  this.on('ai-response', this.trackPerformance.bind(this));
  this.on('ai-error', this.handleError.bind(this));

  // Initialize systems monitoring
  this.startMonitoring();

  // Register built-in subsystems
  this.registerCoreSubsystems();

  // Initialize integration with other AI services
  this.initializeServiceIntegration();
}

  async initializeServiceIntegration() {
    try {
      // We'll dynamically import these to avoid circular dependencies
      // and to make the system more flexible
      console.log('🔄 Initializing AI service integration...');
      
      // Try to load the subsystems if they exist
      try {
        // These will be replaced with actual dynamic requires in production
        // For now, we'll just check if they exist and log appropriately
        
        const learningSystemPath = './TrainingLearningSystem';
        const guidanceSystemPath = './AIGuidanceSystem';
        const spaceCoachPath = './AISpaceCoach';
        const webControllerPath = './AIWebController';
        const socialIntegratorPath = './SocialPlatformIntegrator';
        
        // Learning System
        try {
          this.learningSystem = require(learningSystemPath);
          this.registerSubsystem('learning', this.learningSystem);
          console.log('✅ AI Learning System integrated');
        } catch (error) {
          console.warn('⚠️ AI Learning System not available:', error.message);
        }
        
        // Guidance System
        try {
          this.guidanceSystem = require(guidanceSystemPath);
          this.registerSubsystem('guidance', this.guidanceSystem);
          console.log('✅ AI Guidance System integrated');
        } catch (error) {
          console.warn('⚠️ AI Guidance System not available:', error.message);
        }
        
        // Space Coach
        try {
          this.spaceCoach = require(spaceCoachPath);
          this.registerSubsystem('coach', this.spaceCoach);
          
          // Forward events from space coach
          if (this.spaceCoach instanceof EventEmitter) {
            this.spaceCoach.on('coaching-recommendation', (data) => {
              this.emit('coaching-recommendation', data);
            });
            
            this.spaceCoach.on('achievement-unlocked', (data) => {
              this.emit('achievement-unlocked', data);
            });
          }
          
          console.log('✅ AI Space Coach integrated');
        } catch (error) {
          console.warn('⚠️ AI Space Coach not available:', error.message);
        }
        
        // Web Controller
        try {
          this.webController = require(webControllerPath);
          this.registerSubsystem('web', this.webController);
          console.log('✅ AI Web Controller integrated');
        } catch (error) {
          console.warn('⚠️ AI Web Controller not available:', error.message);
        }
        
        // Social Platform Integrator
        try {
          this.socialIntegrator = require(socialIntegratorPath);
          this.registerSubsystem('social', this.socialIntegrator);
          console.log('✅ Social Platform Integrator integrated');
        } catch (error) {
          console.warn('⚠️ Social Platform Integrator not available:', error.message);
        }
      
      } catch (error) {
        console.error('❌ Error during service integration:', error);
      }
      
      // Setup cross-service communications
      this.setupCrossServiceCommunication();
      
      console.log('✅ AI service integration complete');
    } catch (error) {
      console.error('❌ Service integration failed:', error);
    }
  }
  
  /**
   * Setup communication between integrated services
   */
  setupCrossServiceCommunication() {
    // Forward key events between systems
    if (this.learningSystem instanceof EventEmitter) {
      this.learningSystem.on('learning-insight', (data) => {
        this.emit('learning-insight', data);
        // Forward to guidance system if available
        if (this.guidanceSystem && typeof this.guidanceSystem.processLearningInsight === 'function') {
          this.guidanceSystem.processLearningInsight(data);
        }
      });
    }
    
    if (this.guidanceSystem instanceof EventEmitter) {
      this.guidanceSystem.on('guidance-generated', (data) => {
        this.emit('guidance-generated', data);
        // Forward to web controller if available
        if (this.webController && typeof this.webController.deliverGuidance === 'function') {
          this.webController.deliverGuidance(data);
        }
      });
    }
    
    // Listen for subscription changes to update AI capabilities
    this.on('subscription-updated', async (data) => {
      try {
        const subscription = await Subscription.findOne({ 
          userId: data.userId, 
          status: 'active' 
        });
        
        if (subscription) {
          const aiQualityMultiplier = this.config.subscriptionMultipliers[subscription.plan] || 1;
          console.log(`🔄 Updating AI quality for user ${data.userId} with multiplier ${aiQualityMultiplier}`);
          
          // Update AI settings for this user
          this.updateUserAISettings(data.userId, { 
            qualityMultiplier: aiQualityMultiplier,
            subscriptionTier: subscription.plan
          });
        }
      } catch (error) {
        console.error('❌ Error processing subscription update:', error);
      }
    });
  }
  
  /**
   * Update AI settings for a specific user
   * @param {String} userId - User ID
   * @param {Object} settings - AI settings to update
   */
  updateUserAISettings(userId, settings) {
    // Update settings in each subsystem
    for (const [name, system] of this.subsystems.entries()) {
      if (system && typeof system.updateUserSettings === 'function') {
        try {
          system.updateUserSettings(userId, settings);
          console.log(`✅ Updated AI settings in ${name} subsystem for user ${userId}`);
        } catch (error) {
          console.error(`❌ Error updating AI settings in ${name} subsystem:`, error);
        }
      }
    }
  }
  
  /**
   * Register a new AI subsystem
   * @param {String} name - Name of the subsystem
   * @param {Object} system - The subsystem object
   */
  registerSubsystem(name, system) {
    if (this.subsystems.has(name)) {
      console.warn(`⚠️ Subsystem '${name}' already registered. Overwriting.`);
    }
    
    this.subsystems.set(name, system);
    console.log(`✅ Registered AI subsystem: ${name}`);
    
    // Emit event for subsystem registration
    this.emit('subsystem-registered', { name, system });
  }
  
  /**
   * Register core subsystems that are built into the main service
   */
  registerCoreSubsystems() {
    // Guidance subsystem
    this.registerSubsystem('guidance', {
      generateGuidance: this.generatePersonalizedGuidance.bind(this),
      analyzePerformance: this.analyzePerformance.bind(this)
    });
    
    // Learning subsystem
    this.registerSubsystem('learning', {
      recommendContent: this.recommendLearningContent.bind(this),
      assessSkills: this.assessUserSkills.bind(this)
    });
    
    // Feedback subsystem
    this.registerSubsystem('feedback', {
      generateFeedback: this.generatePersonalizedFeedback.bind(this),
      createSummary: this.createSessionSummary.bind(this)
    });
  }
  
  /**
   * Get a registered subsystem
   * @param {String} name - Name of the subsystem to retrieve
   * @returns {Object} The requested subsystem or null if not found
   */
  getSubsystem(name) {
    if (!this.subsystems.has(name)) {
      console.warn(`⚠️ Subsystem '${name}' not found`);
      return null;
    }
    
    return this.subsystems.get(name);
  }
  
  /**
   * Start monitoring AI service performance
   */
  startMonitoring() {
    this.monitoringInterval = setInterval(() => {
      const totalRequests = this.metrics.totalRequests;
      if (totalRequests > 0) {
        const successRate = (this.metrics.successfulRequests / totalRequests) * 100;
        console.log(`🔍 AI Service Monitoring: ${successRate.toFixed(2)}% success rate, ${this.metrics.averageResponseTime.toFixed(2)}ms avg response time`);
      }
    }, 60000); // Monitor every minute
  }
  
  /**
   * Track performance metrics for AI requests
   * @param {Object} data - Performance data to track
   */
  trackPerformance(data) {
    const { requestId, startTime, endTime } = data;
    const responseTime = endTime - startTime;
    
    // Update metrics
    this.metrics.lastResponseTime = responseTime;
    this.metrics.averageResponseTime = 
      ((this.metrics.averageResponseTime * this.metrics.successfulRequests) + responseTime) / 
      (this.metrics.successfulRequests + 1);
    
    this.metrics.successfulRequests++;
    
    // Add to history (keeping last 100 entries)
    this.metrics.requestHistory.push({
      requestId,
      timestamp: new Date(),
      responseTime,
      success: true
    });
    
    if (this.metrics.requestHistory.length > 100) {
      this.metrics.requestHistory.shift();
    }
  }
  
  /**
   * Handle AI request errors
   * @param {Object} error - Error information
   */
  handleError(error) {
    console.error('❌ AI Service Error:', error.message);
    
    this.metrics.failedRequests++;
    
    // Add to history (keeping last 100 entries)
    this.metrics.requestHistory.push({
      requestId: error.requestId,
      timestamp: new Date(),
      error: error.message,
      success: false
    });
    
    if (this.metrics.requestHistory.length > 100) {
      this.metrics.requestHistory.shift();
    }
  }
  
  /**
   * Handle AI request and add to queue
   * @param {Object} request - AI request data
   */
  handleAIRequest(request) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const enhancedRequest = { ...request, requestId, startTime: Date.now() };
    
    this.metrics.totalRequests++;
    
    // Add to queue
    this.requestQueue.push(enhancedRequest);
    
    // Process queue if not already processing
    if (!this.isProcessing) {
      this.processRequestQueue();
    }
  }
  
  /**
   * Process the request queue (one at a time to manage rate limits)
   */
  async processRequestQueue() {
    if (this.requestQueue.length === 0) {
      this.isProcessing = false;
      return;
    }
    
    this.isProcessing = true;
    const request = this.requestQueue.shift();
    
    try {
      // Process based on request type
      let result;
      switch (request.type) {
        case 'completion':
          result = await this.generateCompletion(request.prompt, request.options);
          break;
        case 'chat':
          result = await this.generateChatResponse(request.messages, request.options);
          break;
        case 'embedding':
          result = await this.generateEmbedding(request.input, request.options);
          break;
        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }
      
      // Emit success event
      this.emit('ai-response', {
        requestId: request.requestId,
        startTime: request.startTime,
        endTime: Date.now(),
        result
      });
      
      // Call callback if provided
      if (request.callback && typeof request.callback === 'function') {
        request.callback(null, result);
      }
    } catch (error) {
      // Emit error event
      this.emit('ai-error', {
        requestId: request.requestId,
        message: error.message,
        error
      });
      
      // Call callback with error if provided
      if (request.callback && typeof request.callback === 'function') {
        request.callback(error);
      }
    }
    
    // Small delay to avoid rate limits
    setTimeout(() => {
      this.processRequestQueue();
    }, 50);
  }
  
  /**
   * Generate text completion
   * @param {String} prompt - The prompt for completion
   * @param {Object} options - Additional options for the completion
   * @returns {Object} Completion result
   */
  async generateCompletion(prompt, options = {}) {
    try {
      const completion = await this.openai.completions.create({
        model: options.model || this.config.model,
        prompt,
        max_tokens: options.maxTokens || 500,
        temperature: options.temperature || this.config.temperature,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      });
      
      return {
        text: completion.choices[0]?.text || '',
        usage: completion.usage
      };
    } catch (error) {
      console.error('❌ Completion generation error:', error);
      throw error;
    }
  }
  
  /**
   * Generate chat response
   * @param {Array} messages - Array of messages for the conversation
   * @param {Object} options - Additional options for the chat response
   * @returns {Object} Chat response result
   */
  async generateChatResponse(messages, options = {}) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: options.model || this.config.model,
        messages,
        max_tokens: options.maxTokens,
        temperature: options.temperature || this.config.temperature,
        top_p: options.topP || 1,
        frequency_penalty: options.frequencyPenalty || 0,
        presence_penalty: options.presencePenalty || 0
      });
      
      return {
        message: completion.choices[0]?.message || { role: 'assistant', content: '' },
        usage: completion.usage
      };
    } catch (error) {
      console.error('❌ Chat response generation error:', error);
      throw error;
    }
  }
  
  /**
   * Generate embedding for text
   * @param {String} input - Text to embed
   * @param {Object} options - Additional options for embedding
   * @returns {Object} Embedding result
   */
  async generateEmbedding(input, options = {}) {
    try {
      const response = await this.openai.embeddings.create({
        model: options.model || 'text-embedding-ada-002',
        input
      });
      
      return {
        embedding: response.data[0]?.embedding || [],
        usage: response.usage
      };
    } catch (error) {
      console.error('❌ Embedding generation error:', error);
      throw error;
    }
  }
  
  /**
   * Generate personalized guidance for user
   * @param {String} userId - User ID
   * @param {Object} context - Additional context for the guidance
   * @returns {Object} Personalized guidance
   */
  async generatePersonalizedGuidance(userId, context = {}) {
    try {
      // Get user data
      const user = await User.findById(userId);
      const progress = await UserProgress.findOne({ userId });
      
      if (!user || !progress) {
        throw new Error('User data not found');
      }
      
      // Prepare context for AI
      const promptContext = {
        skillLevel: progress.skillLevel || 'beginner',
        completedModules: progress.completedModules || [],
        trainingFocus: user.preferences?.trainingFocus || 'general',
        recentPerformance: progress.recentPerformance || [],
        ...context
      };
      
      // Generate guidance using chat API
      const response = await this.generateChatResponse([
        {
          role: 'system',
          content: 'You are an advanced AI space training coach providing personalized guidance to astronaut candidates.'
        },
        {
          role: 'user',
          content: `Generate personalized training guidance based on this data: ${JSON.stringify(promptContext)}`
        }
      ]);
      
      // Parse the response
      let guidance;
      try {
        guidance = JSON.parse(response.message.content);
      } catch (e) {
        // If not valid JSON, use the content directly with a basic structure
        guidance = {
          recommendations: [response.message.content],
          focusAreas: ['General improvements'],
          nextSteps: ['Continue training']
        };
      }
      
      return {
        userId,
        timestamp: new Date(),
        guidance,
        source: 'ai-core'
      };
    } catch (error) {
      console.error('❌ Error generating personalized guidance:', error);
      throw error;
    }
  }
  
  /**
   * Analyze user performance
   * @param {String} userId - User ID
   * @param {Object} performanceData - Performance data to analyze
   * @returns {Object} Performance analysis
   */
  async analyzePerformance(userId, performanceData) {
    try {
      // Get recent sessions
      const recentSessions = await TrainingSession.find({ userId })
        .sort({ completedAt: -1 })
        .limit(5);
      
      // Prepare context for AI
      const sessionData = recentSessions.map(session => ({
        moduleId: session.moduleId,
        score: session.effectivenessScore,
        completedAt: session.completedAt,
        duration: session.duration
      }));
      
      // Add current performance data
      const contextData = {
        userId,
        currentSession: performanceData,
        previousSessions: sessionData
      };
      
      // Generate analysis using chat API
      const response = await this.generateChatResponse([
        {
          role: 'system',
          content: 'You are an AI performance analyst for space training. Analyze the data and provide actionable insights.'
        },
        {
          role: 'user',
          content: `Analyze this performance data and provide insights: ${JSON.stringify(contextData)}`
        }
      ]);
      
      // Parse the response
      let analysis;
      try {
        analysis = JSON.parse(response.message.content);
      } catch (e) {
        // If not valid JSON, use the content directly with a basic structure
        analysis = {
          performance: 'Unknown',
          insights: [response.message.content],
          recommendations: ['Continue training']
        };
      }
      
      return {
        userId,
        timestamp: new Date(),
        analysis,
        source: 'ai-core'
      };
    } catch (error) {
      console.error('❌ Error analyzing performance:', error);
      throw error;
    }
  }
  
  /**
   * Recommend learning content based on user progress
   * @param {String} userId - User ID
   * @returns {Object} Content recommendations
   */
  async recommendLearningContent(userId) {
    try {
      // Get user data
      const user = await User.findById(userId);
      const progress = await UserProgress.findOne({ userId });
      
      if (!user || !progress) {
        throw new Error('User data not found');
      }
      
      // Get all available modules
      const modules = await Module.find().select('moduleId title type difficulty category');
      
      // Filter out completed modules
      const completedModuleIds = progress.completedModules?.map(m => m.moduleId) || [];
      const availableModules = modules.filter(m => !completedModuleIds.includes(m.moduleId));
      
      // Prepare context for AI
      const contextData = {
        userLevel: progress.skillLevel || 'beginner',
        userPreferences: user.preferences || {},
        completedModules: completedModuleIds,
        availableModules: availableModules.map(m => ({
          id: m.moduleId,
          title: m.title,
          type: m.type,
          difficulty: m.difficulty,
          category: m.category
        }))
      };
      
      // Generate recommendations using chat API
      const response = await this.generateChatResponse([
        {
          role: 'system',
          content: 'You are an AI learning advisor for space training. Recommend the most suitable content for the user.'
        },
        {
          role: 'user',
          content: `Recommend learning content based on this data: ${JSON.stringify(contextData)}`
        }
      ]);
      
      // Parse the response
      let recommendations;
      try {
        recommendations = JSON.parse(response.message.content);
      } catch (e) {
        // If not valid JSON, create a basic structure
        recommendations = {
          modules: availableModules.slice(0, 3).map(m => m.moduleId),
          reasoning: response.message.content
        };
      }
      
      return {
        userId,
        timestamp: new Date(),
        recommendations,
        source: 'ai-core'
      };
    } catch (error) {
      console.error('❌ Error recommending learning content:', error);
      throw error;
    }
  }
  
  /**
   * Assess user skills based on performance data
   * @param {String} userId - User ID
   * @returns {Object} Skill assessment
   */
  async assessUserSkills(userId) {
    try {
      // Get user sessions
      const sessions = await TrainingSession.find({ userId }).sort({ completedAt: -1 });
      
      if (sessions.length === 0) {
        return {
          userId,
          skills: {},
          confidenceLevel: 'low',
          needsMoreData: true
        };
      }
      
      // Group sessions by module type
      const moduleTypes = {};
      sessions.forEach(session => {
        if (!moduleTypes[session.moduleType]) {
          moduleTypes[session.moduleType] = [];
        }
        moduleTypes[session.moduleType].push(session);
      });
      
      // Calculate skill levels based on performance
      const skills = {};
      Object.entries(moduleTypes).forEach(([type, typeSessions]) => {
        const averageScore = typeSessions.reduce((sum, session) => sum + session.effectivenessScore, 0) / typeSessions.length;
        skills[type] = {
          level: this.scoreToLevel(averageScore),
          score: averageScore,
          confidence: typeSessions.length > 5 ? 'high' : 'medium',
          lastAssessed: new Date()
        };
      });
      
      return {
        userId,
        skills,
        confidenceLevel: sessions.length > 10 ? 'high' : 'medium',
        needsMoreData: sessions.length < 5,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('❌ Error assessing user skills:', error);
      throw error;
    }
  }
  
  /**
   * Generate personalized feedback for a training session
   * @param {String} userId - User ID
   * @param {String} sessionId - Session ID
   * @returns {Object} Personalized feedback
   */
  async generatePersonalizedFeedback(userId, sessionId) {
    try {
      // Get session data
      const session = await TrainingSession.findById(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Prepare context for AI
      const contextData = {
        moduleType: session.moduleType,
        duration: session.duration,
        effectivenessScore: session.effectivenessScore,
        completionRate: session.metrics?.completionRate || 0,
        strengths: session.aiGuidance?.strengths || [],
        weaknesses: session.aiGuidance?.weaknesses || []
      };
      
      // Generate feedback using chat API
      const response = await this.generateChatResponse([
        {
          role: 'system',
          content: 'You are an AI training coach providing feedback on space training sessions.'
        },
        {
          role: 'user',
          content: `Generate personalized feedback for this training session: ${JSON.stringify(contextData)}`
        }
      ]);
      
      // Structure the feedback
      const feedback = {
        summary: response.message.content.split('\n\n')[0] || response.message.content,
        detailedFeedback: response.message.content,
        actionItems: this.extractActionItems(response.message.content),
        generatedAt: new Date()
      };
      
      return {
        userId,
        sessionId,
        feedback,
        source: 'ai-core'
      };
    } catch (error) {
      console.error('❌ Error generating personalized feedback:', error);
      throw error;
    }
  }
  
  /**
   * Create summary of a training session
   * @param {String} sessionId - Session ID
   * @returns {Object} Session summary
   */
  async createSessionSummary(sessionId) {
    try {
      // Get session data
      const session = await TrainingSession.findById(sessionId).populate('userId', 'name');
      
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Get module details
      const module = await Module.findOne({ moduleId: session.moduleId });
      
      // Prepare context for AI
      const contextData = {
        userName: session.userId.name,
        moduleTitle: module?.title || session.moduleId,
        moduleType: session.moduleType,
        duration: session.duration,
        effectivenessScore: session.effectivenessScore,
        completionRate: session.metrics?.completionRate || 0,
        aiGuidance: session.aiGuidance
      };
      
      // Generate summary using chat API
      const response = await this.generateChatResponse([
        {
          role: 'system',
          content: 'You are an AI assistant creating concise summaries of space training sessions.'
        },
        {
          role: 'user',
          content: `Create a short summary of this training session: ${JSON.stringify(contextData)}`
        }
      ]);
      
      return {
        sessionId,
        summary: response.message.content,
        keyPoints: this.extractKeyPoints(response.message.content),
        generatedAt: new Date()
      };
    } catch (error) {
      console.error('❌ Error creating session summary:', error);
      throw error;
    }
  }
  
  /**
   * Convert numeric score to skill level label
   * @param {Number} score - Numeric score (0-100)
   * @returns {String} Skill level label
   */
  scoreToLevel(score) {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'advanced';
    if (score >= 60) return 'intermediate';
    if (score >= 40) return 'beginner';
    return 'novice';
  }
  
  /**
   * Extract action items from text
   * @param {String} text - Text to extract action items from
   * @returns {Array} Extracted action items
   */
  extractActionItems(text) {
    const actionItemPatterns = [
      /Action items?:(.*?)(?=\n\n|$)/is,
      /Next steps?:(.*?)(?=\n\n|$)/is,
      /Recommendations?:(.*?)(?=\n\n|$)/is,
      /What to improve:(.*?)(?=\n\n|$)/is
    ];
    
    for (const pattern of actionItemPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/\n|-|•/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    
    // If no patterns matched, try to extract list items
    const listItems = text.match(/\n[-•*]([^\n]+)/g);
    if (listItems && listItems.length > 0) {
      return listItems.map(item => item.replace(/\n[-•*]/, '').trim());
    }
    
    // If all else fails, return empty array
    return [];
  }
  
  /**
   * Extract key points from text
   * @param {String} text - Text to extract key points from
   * @returns {Array} Extracted key points
   */
  extractKeyPoints(text) {
    const keyPointPatterns = [
      /Key points?:(.*?)(?=\n\n|$)/is,
      /Highlights?:(.*?)(?=\n\n|$)/is,
      /Summary:(.*?)(?=\n\n|$)/is
    ];
    
    for (const pattern of keyPointPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        return match[1]
          .split(/\n|-|•/)
          .map(item => item.trim())
          .filter(item => item.length > 0);
      }
    }
    
    // If no patterns matched, just create bullet points from each sentence
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    return sentences
      .slice(0, 3) // Just use the first 3 sentences
      .map(sentence => sentence.trim());
  }
  
  /**
   * Cleanup method for shutting down the service
   */
  cleanup() {
    clearInterval(this.monitoringInterval);
    
    // Clean up subsystems
    for (const [name, system] of this.subsystems.entries()) {
      if (system && typeof system.cleanup === 'function') {
        try {
          system.cleanup();
          console.log(`✅ Cleaned up ${name} subsystem`);
        } catch (error) {
          console.error(`❌ Error cleaning up ${name} subsystem:`, error);
        }
      }
    }
    
    // Remove all event listeners
    this.removeAllListeners();
    
    console.log('✅ Core AI Services shut down successfully');
  }
  
  /**
   * Get a specific integrated service
   * @param {String} serviceName - Name of the service to retrieve
   * @returns {Object} The requested service
   */
  getService(serviceName) {
    switch (serviceName.toLowerCase()) {
      case 'learning':
      case 'learningsystem':
        return this.learningSystem;
      case 'guidance':
      case 'guidancesystem':
        return this.guidanceSystem;
      case 'coach':
      case 'spacecoach':
        return this.spaceCoach;
      case 'web':
      case 'webcontroller':
        return this.webController;
      case 'social':
      case 'socialintegrator':
        return this.socialIntegrator;
      default:
        return this.getSubsystem(serviceName);
    }
  }
  
  /**
   * Broadcast an event to all integrated services
   * @param {String} eventName - Name of the event
   * @param {Object} data - Event data
   */
  broadcastToServices(eventName, data) {
    // Emit on the main event emitter
    this.emit(eventName, data);
    
    // Forward to all subsystems that are event emitters
    for (const [name, system] of this.subsystems.entries()) {
      if (system instanceof EventEmitter && typeof system.emit === 'function') {
        try {
          system.emit(eventName, data);
        } catch (error) {
          console.error(`❌ Error broadcasting to ${name} subsystem:`, error);
        }
      }
    }
    
    console.log(`📢 Broadcasted ${eventName} event to all services`);
  }
}

// Create singleton instance
const coreAIServices = new CoreAIServices();

// Export the service
module.exports = coreAIServices;