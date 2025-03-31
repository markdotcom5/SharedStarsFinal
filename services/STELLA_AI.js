// STELLA AI Service - Space Training Enhancement and Learning Logic Assistant
const EventEmitter = require('events');
const mongoose = require('mongoose');
const { openai, OpenAI } = require('./openaiService'); // ✅ Correct!

const UserProgress = require('../models/UserProgress');
const StellaConversation = require('../models/StellaConversation');

// Import the services
const StellaCountdownService = require('./StellaCountdownService');
const StellaPersonalityService = require('./StellaPersonalityService');
const StellaBriefingService = require('./StellaBriefingService');
const personalityService = require('./personalityService'); // Added import for enhanceResponseWithPersonality
/**
 * STELLA AI Service: A comprehensive space training AI system for performance analysis,
 * personalized coaching, and mission readiness assessment.
 * 
 * Unifies functionality from multiple AI systems:
 * - BayesianTracker (knowledge and skill tracking)
 * - AISpaceCoach (personalized coaching)
 * - AIGuidanceSystem (mission scenarios and interventions)
 * - STELLAIntegration (system integration)
 * - DailyBriefingGenerator (presidential space briefings)
 */
class STELLA_AI extends EventEmitter {
  constructor() {
    super();
    
    // Initialize OpenAI
    try {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY || "MISSING_KEY"
      });

      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MISSING_KEY") {
        console.error("❌ ERROR: Missing OpenAI API Key!");
      } else {
        console.log("✅ OpenAI API initialized successfully");
      }
      
      // Default AI Model and parameters
      this.config = {
        model: "gpt-4-turbo",
        languages: ['en'],
        subscriptionMultipliers: {
          premium: 1.5,
          individual: 1,
          family: 1,
          galactic: 1.5,
          custom: (amount) => (amount >= 100 ? 1.5 : 1)
        }
      };
      
      // Initialize the enhanced services
      this.countdownService = new StellaCountdownService();
      this.personalityService = new StellaPersonalityService({
        openai: this.openai,
        config: this.config
      });
      this.briefingService = new StellaBriefingService();

    } catch (error) {
      console.error('❌ OpenAI Initialization Error:', error.message);
    }
    
    // AI Personality Traits
    this.aiPersonality = {
      name: "STELLA", // Space Training Enhancement and Learning Logic Assistant
      traits: ["encouraging", "detail-oriented", "safety-conscious"],
      experienceLevel: "veteran astronaut",
      specialties: ["crisis management", "psychological support", "technical guidance"]
    };
    
    // Initial probability parameters for Bayesian knowledge tracking
    this.bayesianParams = {
      pLearn: 0.2,      // Probability of learning after an attempt
      pGuess: 0.25,     // Probability of correct guess when unknown
      pSlip: 0.1,       // Probability of incorrect when known
      pForget: 0.05     // Probability of forgetting over time
    };
    
    // Daily briefing configuration
    this.briefingConfig = {
      alertLevels: ['GREEN', 'AMBER', 'RED'],
      defaultAlertLevel: 'GREEN',
      sectionTypes: ['STRATEGIC', 'ASTRONOMICAL', 'TECHNOLOGICAL', 'TRAINING'],
      briefingClassification: 'COSMIC-1 CLEARANCE',
      deliveryTime: '06:00', // 6 AM UTC default
      alertProbabilities: {
        GREEN: 0.8,    // 80% chance of GREEN status
        AMBER: 0.15,   // 15% chance of AMBER status
        RED: 0.05      // 5% chance of RED status
      }
    };
    
    // Initialize all systems
    this.initializeAllSystems();
    
    console.log("✅ STELLA AI Service Initialized");
    
    // Check if this is an EventEmitter
    console.log("STELLA instance is EventEmitter?", this instanceof EventEmitter);
    console.log("STELLA on/emit methods?", typeof this.on, typeof this.emit);
  }
  
  /**
   * Initialize all STELLA AI subsystems
   */
  initializeAllSystems() {
    // Main tracking and analytics systems
    this.initializePerformanceTracking();
    this.initializeKnowledgeTracking();
    this.initializeAchievementSystem();
    this.initializeGamificationSystem();
    
    // Advanced systems
    this.initializeAdaptiveLearning();
    this.initializeAdvancedAnalytics();
    this.initializeRealTimeMonitoring();
    this.initializeMissionSimulation();
    this.initializeInterventionSystem();
    this.initializeVirtualMentoring();
    
    // Daily Briefing System
    this.initializeDailyBriefingSystem();
    
    console.log("✅ All STELLA AI subsystems initialized");
  }
  
  /**
   * Returns the capabilities of STELLA
   */
  getCapabilities() {
    return [
      "Personalized guidance",
      "Progress tracking",
      "Mission simulation",
      "Daily briefings",
      "Countdown tracking",
      "Adaptive personality"
    ];
  }
  
// Then, modify the getPersonalizedResponse method in STELLA_AI.js:

/**
 * Generate personalized response using both personality services
 * @param {String} userId - User ID
 * @param {String} message - User message
 * @param {Object} context - Context information
 * @returns {Promise<String>} STELLA's personalized response
 */
async getPersonalizedResponse(userId, message, context = {}) {
  try {
    // Get user's personality settings
    const userPersonality = await this.getUserPersonality(userId);
    
    // Get user state and context
    const userState = await this.getUserState(userId);
    
    // Analyze query to understand topics and intent
    const queryAnalysis = {
      topics: context.topics || [],
      intent: context.intent || 'information',
      sentiment: context.sentiment || 'neutral'
    };
    
    // 1. Generate a base response using StellaPersonalityService
    const baseResponse = await this.personalityService.generatePersonalizedResponse(
      userId, 
      message, 
      context
    );
    
    // 2. Enhance the response with personalityService.js
    // This uses your existing enhanceResponseWithPersonality function
    const enhancedResponse = await personalityService.enhanceResponseWithPersonality(
      baseResponse,
      userPersonality,
      userState,
      queryAnalysis
    );
    
    // 3. Save the enhanced response to conversation history
    await this.saveConversation(userId, message, enhancedResponse.content);
    
    return enhancedResponse.content;
  } catch (error) {
    console.error('Error in getPersonalizedResponse:', error);
    
    // Fallback to base method if enhancement fails
    return this.personalityService.generatePersonalizedResponse(userId, message, context);
  }
}

/**
 * Get user personality settings
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User personality settings
 */
async getUserPersonality(userId) {
  try {
    // Get personality settings from your existing UserPersonality model
    const personalitySettings = await UserPersonality.findOne({ userId });
    
    if (personalitySettings && personalitySettings.traits) {
      return personalitySettings.traits;
    }
    
    // Return default personality if none found
    return {
      honesty: 70,
      humor: 50,
      formality: 60,
      encouragement: 75,
      detail: 65
    };
  } catch (error) {
    console.error('Error getting user personality:', error);
    return getDefaultPersonality(); // Use your existing function
  }
}

/**
 * Get user state and context information
 * @param {String} userId - User ID
 * @returns {Promise<Object>} User state information
 */
async getUserState(userId) {
  try {
    // Get user progress to determine state
    const userProgress = await UserProgress.findOne({ userId });
    
    // Default state
    const defaultState = {
      emotionalState: 'neutral',
      currentActivity: 'browsing',
      progressLevel: 'beginner',
      lastInteraction: new Date()
    };
    
    if (!userProgress) return defaultState;
    
    // Determine emotional state based on recent interactions
    // This is placeholder logic - implement your own detection
    let emotionalState = 'neutral';
    if (userProgress.recentFeedback) {
      const recentScores = userProgress.recentFeedback.map(f => f.score);
      const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      
      if (avgScore < 40) emotionalState = 'discouraged';
      else if (avgScore > 80) emotionalState = 'confident';
    }
    
    // Determine current activity
    let currentActivity = 'browsing';
    if (userProgress.currentSession && userProgress.currentSession.type) {
      currentActivity = userProgress.currentSession.type;
    }
    
    // Determine progress level
    let progressLevel = 'beginner';
    if (userProgress.credits && userProgress.credits.total) {
      if (userProgress.credits.total > 5000) progressLevel = 'advanced';
      else if (userProgress.credits.total > 1000) progressLevel = 'intermediate';
    }
    
    return {
      emotionalState,
      currentActivity,
      progressLevel,
      lastInteraction: userProgress.lastActive || new Date()
    };
  } catch (error) {
    console.error('Error getting user state:', error);
    return {
      emotionalState: 'neutral',
      currentActivity: 'browsing',
      progressLevel: 'beginner',
      lastInteraction: new Date()
    };
  }
}

  
  /**
   * Generate daily briefing using briefing service
   */
  async generateDailyBriefing(options = {}) {
    return this.briefingService.generateDailyBriefing(options);
  }
  
  /**
   * Calculate countdown update based on user activity
   */
  async calculateCountdownUpdate(userId, activityData) {
    return this.countdownService.calculateCountdownUpdate(userId, activityData);
  }
  
  /**
   * Start realtime tracking for a countdown
   */
  startRealtimeTracking(userId, activityType) {
    return this.countdownService.startRealtimeTracking(userId, activityType);
  }
  
  /**
   * Update user activity for countdown
   */
  updateUserActivity(userId, activityType) {
    return this.countdownService.updateUserActivity(userId, activityType);
  }
  
  /**
   * End realtime tracking for a countdown
   */
  endRealtimeTracking(userId) {
    return this.countdownService.endRealtimeTracking(userId);
  }
  
  /**
   * Initialize Daily Briefing System
   */
  initializeDailyBriefingSystem() {
    // Keywords for each section type to guide generation
    this.briefingSectionKeywords = {
      STRATEGIC: [
        'space race', 'international cooperation', 'lunar settlement', 
        'mars mission', 'asteroid mining', 'space policy', 'space tourism',
        'launch capability', 'defense systems', 'satellite deployment'
      ],
      ASTRONOMICAL: [
        'solar flare', 'asteroid trajectory', 'lunar orbit', 'mars observation',
        'exoplanet discovery', 'space weather', 'cosmic radiation', 'solar activity',
        'gravitational anomaly', 'interstellar object'
      ],
      TECHNOLOGICAL: [
        'propulsion breakthrough', 'life support system', 'radiation shielding',
        'artificial gravity', 'space manufacturing', 'quantum navigation',
        'material science', 'spacecraft design', 'robotics advancement', 'AI systems'
      ]
    };
    
    // Alert status descriptions
    this.alertDescriptions = {
      GREEN: "Normal space conditions. Standard protocols in effect.",
      AMBER: "Elevated space conditions. Enhanced monitoring required.",
      RED: "Critical space conditions. Emergency protocols in effect."
    };
    
    console.log("✅ Daily Briefing System Initialized");
  }
  
  /**
   * Initialize performance tracking system
   */
  initializePerformanceTracking() {
    this.performanceMetrics = {
      trainingModulesCompleted: 0,
      skillProgressTracking: new Map(),
      userEngagementScore: 0,
      progressHistory: new Map(),
      realTimeMetrics: new Map(),
      creditAccumulation: new Map()
    };
    
    console.log("✅ Performance Tracking System Initialized");
  }
  
  /**
   * Initialize Bayesian knowledge tracking system
   */
  initializeKnowledgeTracking() {
    // Skill categories for space operations
    this.skillCategories = {
      zero_g_adaptation: {
        name: 'Zero-G Adaptation',
        threshold: 0.8,
        prerequisiteFor: ['suit_operations', 'tool_handling']
      },
      suit_operations: {
        name: 'Suit Operations',
        threshold: 0.85,
        prerequisiteFor: ['emergency_procedures']
      },
      tool_handling: {
        name: 'Tool Handling',
        threshold: 0.75,
        prerequisiteFor: ['repair_operations']
      },
      emergency_procedures: {
        name: 'Emergency Procedures',
        threshold: 0.9,
        prerequisiteFor: []
      },
      repair_operations: {
        name: 'Repair Operations',
        threshold: 0.8,
        prerequisiteFor: []
      }
    };
    
    // User knowledge states
    this.knowledgeStates = new Map();
    
    console.log("✅ Bayesian Knowledge Tracking Initialized");
  }
  
  /**
   * Initialize achievement system
   */
  initializeAchievementSystem() {
    this.achievementTypes = {
      ASSESSMENT_MASTER: {
        id: 'assessment_master',
        threshold: 90,
        description: 'Score 90% or higher on assessments',
        icon: '🎯'
      },
      QUICK_LEARNER: {
        id: 'quick_learner',
        threshold: 5,
        description: 'Complete 5 modules in record time',
        icon: '⚡'
      },
      CONSISTENCY_KING: {
        id: 'consistency_king',
        threshold: 7,
        description: '7-day training streak',
        icon: '👑'
      },
      SPEED_DEMON: {
        id: 'speed_demon',
        threshold: 95,
        description: 'Complete module 50% faster than average',
        icon: '🚀',
        rewards: {
          credits: 500,
          badge: 'Speed Master'
        }
      },
      PERFECT_STREAK: {
        id: 'perfect_streak',
        threshold: 100,
        description: '10 perfect scores in a row',
        icon: '🌟',
        rewards: {
          credits: 1000,
          badge: 'Perfection Master'
        }
      },
      TEAM_PLAYER: {
        id: 'team_player',
        threshold: 50,
        description: 'Help 50 fellow astronauts in training',
        icon: '🤝',
        rewards: {
          credits: 750,
          badge: 'Community Leader'
        }
      }
    };
    
    console.log("✅ Achievement System Initialized");
  }
  
  /**
   * Initialize gamification system
   */
  initializeGamificationSystem() {
    this.gamificationSystem = {
      challenges: new Map(),
      leaderboards: new Map(),
      rewards: new Map()
    };
    
    console.log("✅ Gamification System Initialized");
  }
  
  /**
   * Initialize adaptive learning system
   */
  initializeAdaptiveLearning() {
    this.adaptiveLearning = {
      userModels: new Map(),
      learningPaths: new Map(),
      adaptiveSettings: new Map(),
      skillMatrix: new Map()
    };
    
    console.log("✅ Adaptive Learning System Initialized");
  }
  
  /**
   * Initialize advanced analytics system
   */
  initializeAdvancedAnalytics() {
    this.analyticsSystem = {
      metrics: {},
      insights: [],
      predictionModels: {}
    };
    
    console.log("✅ Advanced Analytics System Initialized");
  }
  
  /**
   * Initialize real-time monitoring system
   */
  initializeRealTimeMonitoring() {
    this.monitoringSystem = {
      activeUsers: new Set(),
      sessionData: new Map(),
      alerts: []
    };
    
    console.log("✅ Real-Time Monitoring System Initialized");
  }
  
  /**
   * Initialize mission simulation system
   */
  initializeMissionSimulation() {
    this.simulationSystem = {
      scenarios: [],
      outcomes: new Map(),
      difficulty: {
        easy: { success: 0.85, reward: 100 },
        medium: { success: 0.65, reward: 250 },
        hard: { success: 0.45, reward: 500 },
        expert: { success: 0.25, reward: 1000 }
      }
    };
    
    console.log("✅ Mission Simulation System Initialized");
  }
  
  /**
   * Initialize intervention system for learning optimization
   */
  initializeInterventionSystem() {
    this.interventionSystem = {
      triggers: new Map(),
      interventions: new Map(),
      outcomes: new Map()
    };
    
    console.log("✅ Intervention System Initialized");
  }
  
  /**
   * Initialize virtual mentoring system
   */
  initializeVirtualMentoring() {
    this.mentoringSystem = {
      mentors: [
        {
          id: 'astro_veteran',
          name: 'Commander Alexandra Chen',
          specialty: 'EVA Operations',
          experience: 'ISS Mission Commander, 3 Mars missions',
          style: 'direct, technical, safety-focused'
        },
        {
          id: 'mission_specialist',
          name: 'Dr. Marcus Williams',
          specialty: 'Life Sciences',
          experience: 'Lead Biologist, Deep Space Program',
          style: 'thoughtful, detailed, encouragement-focused'
        },
        {
          id: 'technical_expert',
          name: 'Engineer Sophia Rodriguez',
          specialty: 'Systems Engineering',
          experience: 'Lead Engineer, Habitat Development',
          style: 'analytical, problem-solving, innovation-focused'
        }
      ],
      sessions: new Map(),
      feedback: new Map()
    };
    
    console.log("✅ Virtual Mentoring System Initialized");
  }
  
  /** 
   * Process performance data and update user profile
   */
  async processPerformanceData(userId, moduleId, performanceData) {
    try {
      // Validate data
      if (!userId || !moduleId || !performanceData) {
        throw new Error("Missing required parameters");
      }
      
      // Get user profile
      const userProfile = await this.getUserProgress(userId);
      
      // Calculate performance metrics
      const score = this.calculatePerformanceScore(performanceData);
      const credits = this.calculateCredits(score, performanceData);
      const achievements = this.checkForAchievements(userProfile, score, performanceData);
      
      // Update user profile
      await this.updateUserProfile(userId, moduleId, {
        score,
        credits,
        achievements,
        completedAt: new Date(),
        performanceData
      });
      
      return {
        userId,
        moduleId,
        score,
        credits,
        achievements
      };
    } catch (error) {
      console.error("Error processing performance:", error);
      throw error;
    }
  }
  
  /**
   * Calculate performance score based on various metrics
   */
  calculatePerformanceScore(performanceData) {
    // Extract performance data
    const {
      completionTime,
      accuracy,
      interactionCount,
      assistanceRequested,
      challengesCompleted
    } = performanceData;
    
    // Base score from accuracy (50% weight)
    let score = accuracy * 0.5;
    
    // Time factor (20% weight) - faster is better but with diminishing returns
    const timeFactor = Math.min(1, 600 / Math.max(completionTime, 300));
    score += timeFactor * 0.2;
    
    // Challenge factor (20% weight)
    const challengeFactor = Math.min(1, challengesCompleted / 5);
    score += challengeFactor * 0.2;
    
    // Independence factor (10% weight) - fewer assistance requests is better
    const independenceFactor = Math.max(0, 1 - (assistanceRequested / interactionCount));
    score += independenceFactor * 0.1;
    
    // Round to 2 decimal places
    return Math.round(score * 100) / 100;
  }
  
  /**
   * Calculate credits earned from performance
   */
  calculateCredits(score, performanceData) {
    // Base credits from score
    let credits = Math.round(score * 100);
    
    // Bonus for perfect or near-perfect score
    if (score > 0.95) {
      credits += 50;
    } else if (score > 0.9) {
      credits += 25;
    }
    
    // Bonus for completing challenges
    if (performanceData.challengesCompleted >= 5) {
      credits += 50;
    }
    
    // Bonus for efficiency (time vs accuracy)
    if (performanceData.completionTime < 400 && performanceData.accuracy > 0.8) {
      credits += 30;
    }
    
    return credits;
  }
  
  /**
   * Check for achievements based on performance
   */
  checkForAchievements(userProfile, score, performanceData) {
    const newAchievements = [];
    
    // Perfect score achievement
    if (score >= 0.95) {
      newAchievements.push(this.achievementTypes.PERFECT_STREAK);
    }
    
    // Speed demon achievement
    if (performanceData.completionTime < 300 && performanceData.accuracy > 0.8) {
      newAchievements.push(this.achievementTypes.SPEED_DEMON);
    }
    
    // Assessment master achievement
    if (score >= 0.9) {
      newAchievements.push(this.achievementTypes.ASSESSMENT_MASTER);
    }
    
    return newAchievements;
  }
  
  /**
   * Update user profile with new performance data
   */
  async updateUserProfile(userId, moduleId, data) {
    try {
      // Find or create user progress record
      let userProgress = await UserProgress.findOne({ userId });
      
      if (!userProgress) {
        userProgress = new UserProgress({
          userId,
          credits: { total: 0, breakdown: {} },
          moduleProgress: []
        });
      }
      
      // Find module progress or create new entry
      let moduleProgress = userProgress.moduleProgress.find(m => m.moduleId === moduleId);
      
      if (!moduleProgress) {
        moduleProgress = {
          moduleId,
          completedSessions: 0,
          totalCreditsEarned: 0,
          streak: 0,
          trainingLogs: []
        };
        userProgress.moduleProgress.push(moduleProgress);
      }
      
      // Update module progress
      moduleProgress.completedSessions += 1;
      moduleProgress.totalCreditsEarned += data.credits;
      moduleProgress.lastSessionDate = data.completedAt;
      
      // Add training log
      moduleProgress.trainingLogs.push({
        date: data.completedAt,
        score: data.score,
        credits: data.credits
      });
      
      // Update streak
      const lastSessionDate = moduleProgress.lastSessionDate;
      const currentDate = data.completedAt;
      
      if (lastSessionDate) {
        const dayDiff = Math.floor((currentDate - lastSessionDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff <= 1) {
          moduleProgress.streak += 1;
        } else {
          moduleProgress.streak = 1;
        }
      } else {
        moduleProgress.streak = 1;
      }
      
      // Update total credits
      userProgress.credits.total = userProgress.moduleProgress.reduce(
        (total, module) => total + module.totalCreditsEarned, 0
      );
      
      // Add achievements
      if (data.achievements && data.achievements.length > 0) {
        for (const achievement of data.achievements) {
          // Check if achievement already exists
          const existingAchievement = userProgress.achievements.find(
            a => a.name === achievement.id
          );
          
          if (!existingAchievement) {
            userProgress.achievements.push({
              name: achievement.id,
              dateEarned: data.completedAt,
              description: achievement.description
            });
          }
        }
      }
      
      // Save updates
      await userProgress.save();
      
      return userProgress;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  }
  
  /**
   * Get user progress data
   */
  async getUserProgress(userId) {
    try {
      const userProgress = await UserProgress.findOne({ userId }).lean();
      return userProgress || null;
    } catch (error) {
      console.error("Error getting user progress:", error);
      return null;
    }
  }
}

// At the end of your STELLA_AI.js file
const stellaInstance = new STELLA_AI();
console.log('STELLA instance is EventEmitter?', stellaInstance instanceof EventEmitter);
console.log('STELLA on/emit methods?', typeof stellaInstance.on, typeof stellaInstance.emit);
module.exports = stellaInstance; // Export the instance, not the class