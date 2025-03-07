// STELLA AI Service - Space Training Enhancement and Learning Logic Assistant
const EventEmitter = require('events');
const mongoose = require('mongoose');
const { openai, OpenAI } = require('./openaiService'); // ✅ Correct!
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
    this.analytics = {
      performanceModels: new Map(),
      predictiveInsights: new Map(),
      learningCurves: new Map(),
      progressionPaths: new Map()
    };
    
    console.log("✅ Advanced Analytics System Initialized");
  }
  
  /**
   * Initialize real-time monitoring system
   */
  initializeRealTimeMonitoring() {
    this.realTimeMonitoring = {
      activeSessions: new Map(),
      performanceMetrics: new Map(),
      adaptiveThresholds: new Map(),
      interventionTriggers: new Map()
    };
    
    console.log("✅ Real-Time Monitoring System Initialized");
  }
  
  /**
   * Initialize mission simulation system
   */
  initializeMissionSimulation() {
    this.simulationScenarios = {
      emergencyResponses: [
        "oxygen_system_failure",
        "micrometeoroid_impact",
        "solar_flare_warning",
        "communication_loss",
        "pressure_leak"
      ],
      spaceOperations: [
        "docking_procedure",
        "spacewalk_preparation",
        "equipment_maintenance",
        "navigation_challenge",
        "resource_management"
      ],
      missionTypes: [
        "orbital_insertion",
        "lunar_landing", 
        "mars_approach", 
        "deep_space_exploration",
        "space_station_docking"
      ]
    };
    
    console.log("✅ Mission Simulation System Initialized");
  }
  
  /**
   * Initialize intervention system
   */
  initializeInterventionSystem() {
    // Intervention types
    this.interventionTypes = {
      TIME_BASED: this.handleTimeBasedIntervention,
      ERROR_BASED: this.handleErrorBasedIntervention,
      CONFIDENCE_BASED: this.handleConfidenceIntervention,
      PROGRESS_BASED: this.handleProgressIntervention
    };
    
    console.log("✅ Intervention System Initialized");
  }
  
  /**
   * Initialize virtual mentoring system
   */
  initializeVirtualMentoring() {
    this.mentoringSessions = new Map();
    this.mentorshipPlans = new Map();
    
    console.log("✅ Virtual Mentoring System Initialized");
  }
  
  // =============================================
  // SKILL ANALYSIS & TRAINING ANALYSIS FUNCTIONS
  // =============================================
  
  /**
   * Analyzes training data for Mission 1: Core & Balance Foundation
   * @param {String} userId - User ID
   * @param {Object} sessionData - Training session data with exerciseData
   * @returns {Object} Analysis results with recommendations
   */
  analyzeTraining(userId, sessionData) {
    try {
      console.log(`🔍 Analyzing Core & Balance training for user: ${userId}`);
      
      // Extract performance metrics from session data
      const { balance, coreStability, endurance } = this.extractMetricsFromSession(sessionData);
      
      // Define recommendations based on metrics
      let nextStep = "continue";
      let suggestions = [];
      let performanceScore = (balance + coreStability + endurance) / 3;
      
      if (balance < 50) {
        nextStep = "repeat mission";
        suggestions.push("Focus on improving balance with longer holds and more consistent practice.");
      }
      
      if (coreStability < 50) {
        nextStep = "repeat mission";
        suggestions.push("Strengthen your core with additional plank variations and stability exercises.");
      }
      
      if (endurance < 50) {
        suggestions.push("Gradually increase exercise duration to build endurance.");
      }
      
      return {
        performanceScore,
        nextStep,
        suggestions,
        strengths: this.identifyStrengths(balance, coreStability, endurance),
        weaknesses: this.identifyWeaknesses(balance, coreStability, endurance)
      };
    } catch (error) {
      console.error("Error analyzing training:", error);
      return {
        performanceScore: 60,
        nextStep: "continue",
        suggestions: ["Continue with your regular training program"],
        strengths: ["Consistent training attendance"],
        weaknesses: []
      };
    }
  }
  
  /**
   * Analyzes endurance training data for Mission 2: Endurance Boost
   * @param {String} userId - User ID
   * @param {Object} sessionData - Training session data with exerciseData
   * @returns {Object} Analysis results with recommendations
   */
  analyzeEnduranceTraining(userId, sessionData) {
    try {
      console.log(`🔍 Analyzing Endurance training for user: ${userId}`);
      
      // Extract metrics specific to endurance training
      const { cardioEndurance, recoveryRate, heartRateStability } = this.extractEnduranceMetrics(sessionData);
      
      // Calculate performance score
      const performanceScore = (cardioEndurance * 0.5) + (recoveryRate * 0.3) + (heartRateStability * 0.2);
      
      // Define recommendations based on metrics
      let nextStep = "continue";
      let suggestions = [];
      
      if (cardioEndurance < 50) {
        nextStep = "repeat mission";
        suggestions.push("Increase time spent in Zone 2 (endurance) to build aerobic capacity.");
      }
      
      if (recoveryRate < 50) {
        suggestions.push("Focus on active recovery between intervals to improve recovery rate.");
      }
      
      if (heartRateStability < 50) {
        suggestions.push("Work on maintaining consistent heart rate within target zones.");
      }
      
      return {
        performanceScore,
        nextStep,
        suggestions,
        strengths: this.identifyEnduranceStrengths(cardioEndurance, recoveryRate, heartRateStability),
        weaknesses: this.identifyEnduranceWeaknesses(cardioEndurance, recoveryRate, heartRateStability)
      };
    } catch (error) {
      console.error("Error analyzing endurance training:", error);
      return {
        performanceScore: 60,
        nextStep: "continue",
        suggestions: ["Continue with your regular endurance training"],
        strengths: ["Cardiovascular training effort"],
        weaknesses: []
      };
    }
  }
  
  /**
   * Analyzes strength training data for Mission 3: Strength & Conditioning
   * @param {String} userId - User ID
   * @param {Object} sessionData - Training session data with exerciseData
   * @returns {Object} Analysis results with recommendations
   */
  analyzeStrengthTraining(userId, sessionData) {
    try {
      console.log(`🔍 Analyzing Strength training for user: ${userId}`);
      
      // Extract metrics specific to strength training
      const { muscularStrength, formQuality, rangeOfMotion } = this.extractStrengthMetrics(sessionData);
      
      // Calculate performance score
      const performanceScore = (muscularStrength * 0.4) + (formQuality * 0.4) + (rangeOfMotion * 0.2);
      
      // Define recommendations based on metrics
      let nextStep = "continue";
      let suggestions = [];
      
      if (muscularStrength < 50) {
        nextStep = "repeat mission";
        suggestions.push("Gradually increase resistance/weight to build greater strength.");
      }
      
      if (formQuality < 50) {
        nextStep = "repeat mission";
        suggestions.push("Focus on proper form before increasing weight or repetitions.");
      }
      
      if (rangeOfMotion < 50) {
        suggestions.push("Work on full range of motion in each exercise for maximum benefit.");
      }
      
      return {
        performanceScore,
        nextStep,
        suggestions,
        strengths: this.identifyStrengthTrainingStrengths(muscularStrength, formQuality, rangeOfMotion),
        weaknesses: this.identifyStrengthTrainingWeaknesses(muscularStrength, formQuality, rangeOfMotion)
      };
    } catch (error) {
      console.error("Error analyzing strength training:", error);
      return {
        performanceScore: 60,
        nextStep: "continue",
        suggestions: ["Continue with your regular strength training program"],
        strengths: ["Consistent strength training effort"],
        weaknesses: []
      };
    }
  }
  
  /**
   * Analyzes coordination training data for Mission 4: Microgravity Coordination
   * @param {String} userId - User ID
   * @param {Object} sessionData - Training session data with exerciseData
   * @returns {Object} Analysis results with recommendations
   */
  analyzeCoordinationTraining(userId, sessionData) {
    try {
      console.log(`🔍 Analyzing Coordination training for user: ${userId}`);
      
      // Extract metrics specific to coordination training
      const { balance, precision, reactionTime, spatialAwareness } = this.extractCoordinationMetrics(sessionData);
      
      // Calculate performance score
      const performanceScore = (balance * 0.3) + (precision * 0.3) + 
                              (reactionTime * 0.2) + (spatialAwareness * 0.2);
      
      // Define recommendations based on metrics
      let nextStep = "continue";
      let suggestions = [];
      
      if (balance < 50) {
        nextStep = "repeat mission";
        suggestions.push("Practice single-leg exercises to improve balance and stability.");
      }
      
      if (precision < 50) {
        nextStep = "repeat mission";
        suggestions.push("Focus on controlled, deliberate movements during object manipulation.");
      }
      
      if (reactionTime < 50) {
        suggestions.push("Add reaction drills to improve response time.");
      }
      
      if (spatialAwareness < 50) {
        suggestions.push("Practice movements with eyes closed to enhance proprioception.");
      }
      
      return {
        performanceScore,
        nextStep,
        suggestions,
        strengths: this.identifyCoordinationStrengths(balance, precision, reactionTime, spatialAwareness),
        weaknesses: this.identifyCoordinationWeaknesses(balance, precision, reactionTime, spatialAwareness)
      };
    } catch (error) {
      console.error("Error analyzing coordination training:", error);
      return {
        performanceScore: 60,
        nextStep: "continue",
        suggestions: ["Continue with your regular coordination exercises"],
        strengths: ["Participation in coordination training"],
        weaknesses: []
      };
    }
  }
  
  /**
   * Analyzes specialized EVA (Extravehicular Activity) training
   * @param {String} userId - User ID
   * @param {Object} sessionData - EVA session data
   * @returns {Object} Analysis results with EVA-specific recommendations
   */
  analyzeEVATraining(userId, sessionData) {
    try {
      console.log(`🔍 Analyzing EVA training for user: ${userId}`);
      
      // Extract EVA-specific metrics
      const { suitManeuverability, toolHandling, spatialOrientation, oxygenEfficiency } = 
        this.extractEVAMetrics(sessionData);
      
      // Calculate overall EVA performance score with appropriate weightings
      const performanceScore = 
        (suitManeuverability * 0.3) + 
        (toolHandling * 0.3) + 
        (spatialOrientation * 0.25) + 
        (oxygenEfficiency * 0.15);
      
      // Generate EVA-specific recommendations
      let nextStep = "continue";
      let suggestions = [];
      
      if (suitManeuverability < 60) {
        nextStep = "repeat mission";
        suggestions.push("Practice suit mobility exercises focusing on natural movement patterns.");
      }
      
      if (toolHandling < 60) {
        nextStep = "repeat mission";
        suggestions.push("Increase dexterity training with pressurized gloves.");
      }
      
      if (spatialOrientation < 60) {
        suggestions.push("Incorporate VR training sessions for improved spatial awareness in zero-G.");
      }
      
      if (oxygenEfficiency < 60) {
        suggestions.push("Practice controlled breathing techniques to optimize oxygen usage.");
      }
      
      return {
        performanceScore,
        nextStep,
        suggestions,
        strengths: this.identifyEVAStrengths(suitManeuverability, toolHandling, spatialOrientation, oxygenEfficiency),
        weaknesses: this.identifyEVAWeaknesses(suitManeuverability, toolHandling, spatialOrientation, oxygenEfficiency),
        evaReadiness: this.calculateEVAReadiness(performanceScore)
      };
    } catch (error) {
      console.error("Error analyzing EVA training:", error);
      return {
        performanceScore: 60,
        nextStep: "continue",
        suggestions: ["Continue with standard EVA preparation protocols"],
        strengths: ["EVA participation and effort"],
        weaknesses: [],
        evaReadiness: "In Training"
      };
    }
  }
  
  /**
   * Calculate EVA readiness level based on performance
   * @param {Number} performanceScore - Overall EVA performance score
   * @returns {String} Readiness level classification
   */
  calculateEVAReadiness(performanceScore) {
    if (performanceScore >= 90) return "EVA Ready - Lead";
    if (performanceScore >= 80) return "EVA Ready - Solo";
    if (performanceScore >= 70) return "EVA Ready - Support";
    if (performanceScore >= 60) return "EVA Ready - Supervised";
    return "EVA Training Required";
  }
  
  // =============================================
// MISSION READINESS ASSESSMENT FUNCTIONS
// =============================================
/**
 * Generate daily presidential space briefing
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} Generated briefing content
 */
async generateDailyBriefing(options = {}) {
  try {
    // Default alert status if method is missing
    let alertStatus = 'AMBER'; // Default to AMBER
    
    // Try to use determineAlertStatus if it exists
    if (typeof this.determineAlertStatus === 'function') {
      alertStatus = this.determineAlertStatus();
    } else if (options.alertStatus) {
      // Use provided alertStatus from options if available
      alertStatus = options.alertStatus;
    }
    
    console.log(`🔄 Generating Daily Presidential Space Briefing with alert status: ${alertStatus}`);
    
    // Generate sections
    const sections = [];
    // Make sure briefingConfig exists
    const sectionTypes = this.briefingConfig?.sectionTypes || ['STRATEGIC', 'ASTRONOMICAL', 'TECHNOLOGICAL'];
    
    for (const sectionType of sectionTypes) {
      if (sectionType === 'TRAINING') continue; // Handle training directive separately
      
      try {
        const section = await this.generateBriefingSection(sectionType, alertStatus);
        sections.push(section);
      } catch (sectionError) {
        console.error(`❌ Error generating section: ${sectionError}`);
        // Add a fallback section instead of failing completely
        sections.push({
          sectionType,
          title: this.getFallbackTitle ? this.getFallbackTitle(sectionType) : `${sectionType} Report`,
          content: this.getFallbackContent ? this.getFallbackContent(sectionType, alertStatus) : 
                  `Standard ${alertStatus.toLowerCase()} protocols in effect for all space operations.`,
          classification: 'CONFIDENTIAL'
        });
      }
    }
    
    // Generate training directive
    let trainingDirective;
    try {
      trainingDirective = await this.generateTrainingDirective();
    } catch (directiveError) {
      console.error(`❌ Error generating training directive: ${directiveError}`);
      // Fallback directive
      trainingDirective = {
        content: "Focus on core stability and balance training this week. These foundational skills are critical for all space operations and will prepare you for the microgravity challenges ahead.",
        relatedMissionId: "mission1",
        exerciseIds: ["planks", "stability-ball"]
      };
    }
    
    // Count total words for metadata
    const wordCount = this.countBriefingWords ? 
                      this.countBriefingWords(sections, trainingDirective) : 
                      sections.reduce((count, section) => count + (section.content?.split(/\s+/).length || 0), 0) + 
                      (trainingDirective?.content?.split(/\s+/).length || 0);
    
    // Extract topic tags
    const topicTags = this.extractTopicTags ? 
                      this.extractTopicTags(sections) : 
                      ['strategic', 'astronomical', 'technological', 'space weather'];
    
    // Assemble final briefing
    const briefing = {
      title: 'DAILY PRESIDENTIAL SPACE BRIEFING',
      alertStatus,
      sections,
      trainingDirective,
      wordCount,
      topicTags
    };
    
    console.log(`✅ Generated briefing content with ${sections.length} sections and ${wordCount} words`);
    
    return briefing;
  } catch (error) {
    console.error('❌ Error generating daily briefing:', error);
    throw new Error('Failed to generate briefing content: ' + error.message);
  }
}
/**
 * Generate a briefing section
 * @param {string} sectionType - Type of section to generate
 * @param {string} alertStatus - Current alert status
 * @returns {Promise<Object>} Generated section
 */
async generateBriefingSection(sectionType, alertStatus) {
  try {
    // Get random keywords to guide generation
    const keywords = this.getRandomBriefingKeywords(sectionType);
    
    // Prepare prompt based on section type
    const prompt = this.buildSectionPrompt(sectionType, alertStatus, keywords);
    
    // Check if OpenAI client is properly initialized
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Safely access the chat completions API
    const openaiChat = this.openai.chat || this.openai.completions || this.openai;
    const completionMethod = openaiChat.completions || openaiChat.create || openaiChat;
    
    if (typeof completionMethod.create !== 'function') {
      throw new Error("OpenAI API structure has changed - completions method not available");
    }
    
    // Generate content using OpenAI
    const completion = await completionMethod.create({
      model: this.config?.model || "gpt-3.5-turbo", // Provide a fallback model
      messages: [
        {
          role: "system",
          content: `You are STELLA AI, generating classified space intelligence for the Daily Presidential Space Briefing. 
                    Your writing should be authoritative, precise, and have a tone of urgency appropriate for ${alertStatus} alert status.
                    Use realistic-sounding terminology, space jargon, and reference plausible agencies, projects and missions.
                    Include specific details, measurements, coordinates or percentages to enhance authenticity.
                    Write in the style of an official intelligence briefing: concise, factual, and impactful.
                    Make the content compelling and slightly ominous, as if revealing information that only top officials would know.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    // Safely extract generated content
    const content = completion?.choices?.[0]?.message?.content?.trim() || 
                    "Section content unavailable due to technical limitations.";
    
    // Generate a title by prompting again or extracting from content
    const title = await this.generateSectionTitle(sectionType, content);
    
    return {
      sectionType,
      title,
      content,
      classification: this.getSectionClassification(sectionType, alertStatus)
    };
  } catch (error) {
    console.error('❌ Error generating section:', error);
    
    // Fallback content
    return {
      sectionType,
      title: this.getFallbackTitle(sectionType),
      content: this.getFallbackContent(sectionType, alertStatus),
      classification: 'CONFIDENTIAL'
    };
  }
}

/**
 * Generate a personalized training directive
 * @param {string} userId - Optional user ID for personalization
 * @returns {Promise<Object>} Generated training directive
 */
async generateTrainingDirective(userId = null) {
  try {
    // If userId is provided, generate personalized directive
    if (userId) {
      return await this.generatePersonalizedDirective(userId);
    }
    
    // Otherwise generate a generic directive
    const physicalMissions = await this.getPhysicalMissions();
    
    // Select a random mission to feature (with safety check)
    const missionCount = Array.isArray(physicalMissions) ? physicalMissions.length : 0;
    const randomMissionIndex = missionCount > 0 ? Math.floor(Math.random() * missionCount) : -1;
    
    // Default mission if none available
    const defaultMission = {
      id: "mission1",
      name: "Core & Balance Foundation",
      type: "physical",
      description: "Develop core strength and balance for microgravity operations",
      exercises: [
        { id: "planks", name: "AI-Monitored Planks" },
        { id: "stability-ball", name: "Stability Ball Workouts" }
      ]
    };
    
    // Use selected mission or default
    const mission = (randomMissionIndex >= 0) ? physicalMissions[randomMissionIndex] : defaultMission;
    
    // Select random exercises from the mission
    const exercises = Array.isArray(mission.exercises) ? mission.exercises : [];
    const selectedExercises = [];
    
    if (exercises.length > 0) {
      // Pick 1-2 random exercises
      const numExercises = Math.min(exercises.length, Math.floor(Math.random() * 2) + 1);
      const shuffled = [...exercises].sort(() => 0.5 - Math.random());
      selectedExercises.push(...shuffled.slice(0, numExercises));
    }
    
    // Check if OpenAI client is properly initialized
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Safely access the chat completions API
    const openaiChat = this.openai.chat || this.openai.completions || this.openai;
    const completionMethod = openaiChat.completions || openaiChat.create || openaiChat;
    
    if (typeof completionMethod.create !== 'function') {
      throw new Error("OpenAI API structure has changed - completions method not available");
    }
    
    // Generate directive content using OpenAI
    const completion = await completionMethod.create({
      model: this.config?.model || "gpt-3.5-turbo", // Provide a fallback model
      messages: [
        {
          role: "system",
          content: `You are STELLA AI, generating a training directive for space mission readiness.
                    Your directive should be motivational, urgent, and specific to the mission type.
                    Write in a commanding tone as if this is an official directive from mission control.
                    Reference specific exercises and tie them to space mission capabilities.
                    Keep it concise but impactful - this will inspire trainees to focus on key skills.`
        },
        {
          role: "user",
          content: `Generate a training directive focusing on "${mission.name}" (${mission.type || 'physical'}).
                    Mission description: ${mission.description || 'Space training mission'}
                    ${selectedExercises.length > 0 ? `Key exercises: ${selectedExercises.map(e => e.name || 'Exercise').join(', ')}` : ''}
                    
                    Make this directive sound like it's preparing trainees for critical space operations. 
                    Explain why these skills are essential for mission success and safety.
                    Maximum 3-4 sentences.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    // Safely extract generated content
    const content = completion?.choices?.[0]?.message?.content?.trim() || 
                    "Focus on core stability and balance training this week. These foundational skills are critical for all space operations.";
    
    return {
      content,
      relatedMissionId: mission.id || "mission1",
      exerciseIds: selectedExercises.map(ex => ex.id || "default-exercise")
    };
  } catch (error) {
    console.error('❌ Error generating training directive:', error);
    
    // Fallback directive
    return {
      content: "Focus on core stability and balance training this week. These foundational skills are critical for all space operations and will prepare you for the microgravity challenges ahead.",
      relatedMissionId: "mission1",
      exerciseIds: ["planks", "stability-ball"]
    };
  }
}

/**
 * Generate a personalized training directive for a specific user
 * @param {string} userId - User ID for personalization
 * @returns {Promise<Object>} Personalized directive
 */
async generatePersonalizedDirective(userId) {
  try {
    // Get user's training progress
    const userProgress = await this.getUserTrainingProgress(userId);
    
    if (!userProgress || !Array.isArray(userProgress.missions) || userProgress.missions.length === 0) {
      throw new Error('No training progress data available');
    }
    
    // Find mission with lowest progress that's not complete
    const incompleteMissions = userProgress.missions
      .filter(mission => mission.progress < 100)
      .sort((a, b) => a.progress - b.progress);
    
    if (incompleteMissions.length === 0) {
      // All missions completed, recommend advanced training
      return {
        content: "Congratulations on your comprehensive training progress. Focus on maintaining all skill domains with particular emphasis on microgravity adaptation techniques. Your readiness metrics are exceptional - continue pushing boundaries.",
        relatedMissionId: null,
        exerciseIds: []
      };
    }
    
    // Get the mission with lowest progress
    const targetMission = incompleteMissions[0];
    
    // Get mission details
    const physicalMissions = await this.getPhysicalMissions();
    const missionDetails = Array.isArray(physicalMissions) ? 
                          physicalMissions.find(m => m.id === targetMission.id) : null;
    
    if (!missionDetails) {
      throw new Error('Mission details not found');
    }
    
    // Get interesting exercises
    const exercises = Array.isArray(missionDetails.exercises) ? missionDetails.exercises : [];
    const selectedExercises = [];
    
    if (exercises.length > 0) {
      // Pick 1-2 random exercises
      const numExercises = Math.min(exercises.length, 2);
      const shuffled = [...exercises].sort(() => 0.5 - Math.random());
      selectedExercises.push(...shuffled.slice(0, numExercises));
    }
    
    // Check if OpenAI client is properly initialized
    if (!this.openai) {
      throw new Error("OpenAI client not initialized");
    }
    
    // Safely access the chat completions API
    const openaiChat = this.openai.chat || this.openai.completions || this.openai;
    const completionMethod = openaiChat.completions || openaiChat.create || openaiChat;
    
    if (typeof completionMethod.create !== 'function') {
      throw new Error("OpenAI API structure has changed - completions method not available");
    }
    
    // Generate personalized directive using OpenAI
    const completion = await completionMethod.create({
      model: this.config?.model || "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `You are STELLA AI, generating a personalized training directive for space mission readiness.
                    Your directive should feel personalized to the user's training needs.
                    Write in a commanding but supportive tone that addresses their specific situation.
                    Reference specific exercises and tie them to space mission capabilities.`
        },
        {
          role: "user",
          content: `Generate a personalized training directive for a trainee focusing on "${missionDetails.name}" (${missionDetails.type || 'physical'}).
                    Mission description: ${missionDetails.description || 'Space training mission'}
                    Current progress: ${targetMission.progress}%
                    ${selectedExercises.length > 0 ? `Focus exercises: ${selectedExercises.map(e => e.name || 'Exercise').join(', ')}` : ''}
                    
                    Make this directive sound personal but urgent, as if the trainee's readiness is critical for an upcoming mission.
                    Maximum 3-4 sentences.`
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });
    
    // Safely extract generated content
    const content = completion?.choices?.[0]?.message?.content?.trim() || 
                    "Continue focusing on your training program. Your progress is on track, but more practice is needed to reach mission readiness.";
    
    return {
      content,
      relatedMissionId: targetMission.id,
      exerciseIds: selectedExercises.map(ex => ex.id || "exercise")
    };
  } catch (error) {
    console.error('❌ Error generating personalized directive:', error);
    
    // Fallback to generic directive
    try {
      return await this.generateTrainingDirective();
    } catch (fallbackError) {
      // Ultimate fallback if even generic directive fails
      return {
        content: "Focus on core stability and balance training this week. These foundational skills are critical for all space operations.",
        relatedMissionId: "mission1",
        exerciseIds: ["planks", "stability-ball"]
      };
    }
  }
}
  /**
   * Build a prompt for generating a section
   * @param {string} sectionType - Type of section
   * @param {string} alertStatus - Current alert status
   * @param {string[]} keywords - Keywords to include
   * @returns {string} Prompt for OpenAI
   */
  buildSectionPrompt(sectionType, alertStatus, keywords) {
    const alertContext = this.alertDescriptions[alertStatus] || this.alertDescriptions.GREEN;
    
    let basePrompt = `Generate the ${sectionType} section for today's Daily Presidential Space Briefing.\n`;
    basePrompt += `Current alert status: ${alertStatus}. ${alertContext}\n`;
    basePrompt += `Include references to the following keywords or themes: ${keywords.join(', ')}.\n\n`;
    
    // Add section-specific instructions
    switch (sectionType) {
      case 'STRATEGIC':
        basePrompt += `Focus on strategic developments in space exploration, geopolitical situations, or resource allocation. Include specific project names, agencies, or international relations elements. Mention timeline projections or strategic implications.`;
        break;
      case 'ASTRONOMICAL':
        basePrompt += `Detail significant astronomical phenomena, observations, or space weather conditions. Include specific coordinates, magnitudes, or timelines. Explain potential impacts on Earth operations or space missions.`;
        break;
      case 'TECHNOLOGICAL':
        basePrompt += `Describe technological breakthroughs, innovations, or development milestones related to space exploration. Include specific technical details, readiness levels, or performance metrics. Indicate how this technology impacts mission capabilities.`;
        break;
      default:
        basePrompt += `Provide factual, concise information relevant to space operations. Include specific details, metrics, or intelligence that would be valuable for mission planning.`;
    }
    
    // Add alert status specific context
    if (alertStatus === 'AMBER') {
      basePrompt += `\n\nIncorporate a sense of elevated concern or attention required. Indicate that monitoring or preparations should be increased.`;
    } else if (alertStatus === 'RED') {
      basePrompt += `\n\nConvey urgency and critical importance. Indicate that immediate action or attention is required. Use language that emphasizes potential mission impacts.`;
    }
    
    return basePrompt;
  }
  
  /**
   * Get random keywords for briefing section
   * @param {string} sectionType - Type of section
   * @returns {string[]} Array of keywords
   */
  getRandomBriefingKeywords(sectionType) {
    const keywords = this.briefingSectionKeywords[sectionType] || [];
    if (keywords.length === 0) return [];
    
    // Shuffle and pick 2-3 keywords
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 2; // 2-3 keywords
    
    return shuffled.slice(0, count);
  }
  
  /**
   * Generate a title for a section based on its content
   * @param {string} sectionType - Type of section
   * @param {string} content - Section content
   * @returns {Promise<string>} Generated title
   */
  async generateSectionTitle(sectionType, content) {
    try {
      // Fast approach: Use OpenAI to generate a title
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo", // Using faster model for title generation
        messages: [
          {
            role: "system",
            content: "You are generating a title for a section of a classified space briefing. Create a short, impactful title (5-7 words) that captures the essence of the content. Use terminology appropriate for official intelligence briefings."
          },
          {
            role: "user",
            content: `Generate a title for this ${sectionType} section: "${content.substring(0, 200)}..."`
          }
        ],
        temperature: 0.7,
        max_tokens: 30
      });
      
      // Extract and clean title
      let title = completion.choices[0].message.content.trim();
      
      // Remove quotes if present
      title = title.replace(/^["'](.*)["']$/, '$1');
      
      return title;
    } catch (error) {
      console.warn('Error generating section title:', error);
      
      // Fallback: Use default title
      return this.getFallbackTitle(sectionType);
    }
  }
  
  /**
   * Get classification level for a section based on type and alert status
   * @param {string} sectionType - Type of section
   * @param {string} alertStatus - Current alert status
   * @returns {string} Classification level
   */
  getSectionClassification(sectionType, alertStatus) {
    // Higher classification for more sensitive sections or higher alert levels
    if (sectionType === 'STRATEGIC' && alertStatus === 'RED') {
      return 'TOP SECRET';
    } else if (alertStatus === 'RED' || sectionType === 'STRATEGIC') {
      return 'SECRET';
    } else if (alertStatus === 'AMBER') {
      return 'CONFIDENTIAL';
    } else {
      return 'CONFIDENTIAL';
    }
  }
  
  /**
   * Get fallback title for a section type
   * @param {string} sectionType - Type of section
   * @returns {string} Fallback title
   */
  getFallbackTitle(sectionType) {
    const titles = {
      STRATEGIC: 'Strategic Operations Update',
      ASTRONOMICAL: 'Astronomical Phenomena Report',
      TECHNOLOGICAL: 'Technological Development Assessment'
    };
    
    return titles[sectionType] || `${sectionType} Briefing Section`;
  }
  
  /**
   * Get fallback content for a section
   * @param {string} sectionType - Type of section
   * @param {string} alertStatus - Current alert status
   * @returns {string} Fallback content
   */
  getFallbackContent(sectionType, alertStatus) {
    const status = alertStatus.toLowerCase();
    
    switch (sectionType) {
      case 'STRATEGIC':
        return `Current strategic assessment indicates ${status} level operations across all space sectors. COSPAR coordination protocols are in effect. Monitor this channel for updates on resource allocation and mission prioritization.`;
      case 'ASTRONOMICAL':
        return `Space weather conditions are at ${status} levels. CME activity within expected parameters. Routine astronomical observations proceeding according to schedule. No anomalies detected in Near Earth Object monitoring.`;
      case 'TECHNOLOGICAL':
        return `All critical technology systems operating at ${status} readiness levels. Ongoing development projects proceeding according to timeline. No significant breakthroughs or setbacks to report at this time.`;
      default:
        return `Standard ${status} protocols in effect for all space operations. Continue monitoring this briefing channel for updates.`;
    }
  }
  
  /**
   * Count words in briefing content
   * @param {Object[]} sections - Briefing sections
   * @param {Object} trainingDirective - Training directive
   * @returns {number} Total word count
   */
  countBriefingWords(sections, trainingDirective) {
    let totalWords = 0;
    
    // Count words in sections
    for (const section of sections) {
      if (section.title) {
        totalWords += section.title.split(/\s+/).length;
      }
      if (section.content) {
        totalWords += section.content.split(/\s+/).length;
      }
    }
    
    // Count words in training directive
    if (trainingDirective && trainingDirective.content) {
      totalWords += trainingDirective.content.split(/\s+/).length;
    }
    
    return totalWords;
  }
  
  /**
   * Extract topic tags from sections
   * @param {Object[]} sections - Briefing sections
   * @returns {string[]} Array of topic tags
   */
  extractTopicTags(sections) {
    const tags = new Set();
    
    // Add section types as base tags
    for (const section of sections) {
      tags.add(section.sectionType.toLowerCase());
    }
    
    // Extract keywords from content
    const allContent = sections.map(s => `${s.title} ${s.content}`).join(' ');
    
    // Add keywords for each section type
    for (const [type, keywords] of Object.entries(this.briefingSectionKeywords)) {
      for (const keyword of keywords) {
        if (allContent.toLowerCase().includes(keyword.toLowerCase())) {
          tags.add(keyword.toLowerCase());
        }
      }
    }
    
    // Convert set to array and limit to 10 tags
    return [...tags].slice(0, 10);
  }
  
  /**
   * Get user training progress (for personalization)
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User progress data
   */
  async getUserTrainingProgress(userId) {
    try {
      // This would fetch from your database in a real implementation
      // For now, return mock data
      return {
        userId,
        missions: [
          { id: 'mission1', progress: 75 },
          { id: 'mission2', progress: 40 },
          { id: 'mission3', progress: 10 },
          { id: 'mission4', progress: 0 }
        ],
        overallProgress: 35
      };
    } catch (error) {
      console.error('Error getting user training progress:', error);
      return null;
    }
  }
  
  /**
   * Get physical missions data for training directives
   * @returns {Promise<Array>} Array of physical missions
   */
  async getPhysicalMissions() {
    try {
      // In a real implementation, this would fetch from your database
      // For this example, we'll return a hard-coded subset of missions
      return [
        {
          id: "mission1",
          name: "Core & Balance Foundation",
          type: "core-balance",
          description: "Master stability in zero-gravity environments through core strength and balance training",
          exercises: [
            {
              id: "planks",
              name: "AI-Monitored Planks"
            },
            {
              id: "stability-ball",
              name: "Stability Ball Workouts"
            }
          ]
        },
        {
          id: "mission2",
          name: "Endurance Boost",
          type: "endurance",
          description: "Build cardiovascular fitness for extended space operations",
          exercises: [
            {
              id: "interval-training",
              name: "Interval Training"
            }
          ]
        },
        {
          id: "mission3",
          name: "Strength Training Without Gravity",
          type: "strength",
          description: "Build muscular strength for space operations in a zero-gravity environment",
          exercises: [
            {
              id: "resistance-band",
              name: "Resistance Band Training"
            }
          ]
        }
      ];
    } catch (error) {
      console.error('Error getting physical missions:', error);
      return [];
    }
  }
  
  /**
   * Record user training interest based on briefing interaction
   * @param {string} userId - User ID
   * @param {string} missionId - Mission ID from briefing directive
   * @returns {Promise<boolean>} Success status
   */
  async recordTrainingInterest(userId, missionId) {
    try {
      console.log(`Recording training interest for user ${userId} in mission ${missionId}`);
      
      // In a real implementation, update user preferences and feed into recommendation algorithms
      
      // For now, just log it and return success
      return true;
    } catch (error) {
      console.error('Error recording training interest:', error);
      return false;
    }
  }
  
  /**
   * Generates a personalized recommendation for a user
   * @param {string} userId - User ID
   * @param {string} [missionId] - Specific mission ID (optional)
   * @returns {Promise<Object>} Personalized recommendations
   */
  async getPersonalizedRecommendations(userId, missionId = null) {
    try {
      // In a real implementation, this would use the user's history
      // Mock response for now
      console.log(`Getting personalized recommendations for user ${userId}`);
      
      return {
        userId,
        missionId,
        advice: "Focus on controlling your breathing during all exercises to maximize oxygen efficiency, critical for space operations.",
        exercises: [
          { id: 'planks', priority: 'high' },
          { id: 'stability-ball', priority: 'medium' }
        ]
      };
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return {
        userId,
        advice: "Continue with your regular training program focusing on fundamentals.",
        exercises: []
      };
    }
  }
  /**
   * Generate comprehensive mission readiness assessment
   * @param {String} userId - User ID
   * @param {Object} userData - Complete user training data
   * @returns {Object} Comprehensive readiness assessment
   */
  async generateMissionReadinessReport(userId, userData) {
    try {
      console.log(`🚀 Generating mission readiness report for user: ${userId}`);
      
      // Calculate overall physical readiness score
      const physicalModules = userData.completedModules.filter(m => m.type === 'physical');
      const technicalModules = userData.completedModules.filter(m => m.type === 'technical');
      const mentalModules = userData.completedModules.filter(m => m.type === 'mental');
      
      // Calculate average scores for each category
      const physicalScore = this.calculateAverageScore(physicalModules);
      const technicalScore = this.calculateAverageScore(technicalModules);
      const mentalScore = this.calculateAverageScore(mentalModules);
      
      // Overall weighted mission readiness score
      const missionReadinessScore = 
        (physicalScore * 0.4) + 
        (technicalScore * 0.4) + 
        (mentalScore * 0.2);
      
      // Determine mission readiness status
      const readinessStatus = this.determineMissionReadiness(missionReadinessScore);
      
      // Identify critical gaps in training
      const criticalGaps = this.identifyCriticalGaps(userData);
      
      // Generate personalized improvement plan
      const improvementPlan = this.generateImprovementPlan(userData, criticalGaps);
      
      // Predicted performance metrics
      const predictedPerformance = this.predictPerformanceMetrics(userData);
      
      return {
        userId,
        timestamp: new Date(),
        overallReadiness: {
          score: missionReadinessScore,
          status: readinessStatus,
          confidence: this.calculateConfidenceLevel(userData)
        },
        categoryScores: {
          physical: physicalScore,
          technical: technicalScore,
          mental: mentalScore
        },
        criticalGaps,
        improvementPlan,
        predictedPerformance,
        missionSpecificReadiness: this.assessMissionSpecificReadiness(userData)
      };
    } catch (error) {
      console.error("Error generating mission readiness report:", error);
      return {
        userId,
        timestamp: new Date(),
        overallReadiness: {
          score: 60,
          status: "In Training",
          confidence: "Medium"
        },
        categoryScores: {
          physical: 60,
          technical: 60,
          mental: 60
        },
        criticalGaps: ["Insufficient data for gap analysis"],
        improvementPlan: {
          focusAreas: ["Complete more training modules to generate personalized plan"],
          timeline: "4-6 weeks"
        }
      };
    }
  }
  
  /**
   * Calculate average score from completed modules
   * @param {Array} modules - Array of completed training modules
   * @returns {Number} Average score
   */
  calculateAverageScore(modules) {
    if (!modules || modules.length === 0) return 0;
    const sum = modules.reduce((total, module) => total + module.score, 0);
    return Math.round(sum / modules.length);
  }
  
  /**
   * Determine mission readiness status based on score
   * @param {Number} score - Overall mission readiness score
   * @returns {String} Readiness status
   */
  determineMissionReadiness(score) {
    if (score >= 90) return "Mission Ready - All Types";
    if (score >= 80) return "Mission Ready - Standard";
    if (score >= 70) return "Mission Ready - Support";
    if (score >= 60) return "Mission Qualified - Supervised";
    return "In Training";
  }
  
  /**
   * Calculate confidence level in readiness assessment
   * @param {Object} userData - User training data
   * @returns {String} Confidence level
   */
  calculateConfidenceLevel(userData) {
    // Calculate based on number of completed modules, consistency, and recency
    const completedModulesCount = userData.completedModules?.length || 0;
    const recentModulesCount = userData.completedModules?.filter(
      m => new Date(m.completedAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0;
    
    if (completedModulesCount >= 20 && recentModulesCount >= 5) return "Very High";
    if (completedModulesCount >= 15 && recentModulesCount >= 3) return "High";
    if (completedModulesCount >= 10) return "Medium";
    if (completedModulesCount >= 5) return "Low";
    return "Very Low";
  }
  
  /**
   * Identify critical gaps in training
   * @param {Object} userData - User training data
   * @returns {Array} Critical training gaps
   */
  identifyCriticalGaps(userData) {
    const gaps = [];
    const requiredModuleTypes = [
      "core", "endurance", "strength", "coordination", 
      "technical", "emergency", "teamwork"
    ];
    
    // Check if user has completed essential module types
    requiredModuleTypes.forEach(type => {
      const hasCompleted = userData.completedModules?.some(m => m.category === type);
      if (!hasCompleted) {
        gaps.push(`Missing ${type} training`);
      }
    });
    
    // Check for low scores in critical areas
    userData.completedModules?.forEach(module => {
      if (module.score < 60 && (module.category === "emergency" || module.category === "technical")) {
        gaps.push(`Low performance in ${module.title} (${module.score}%)`);
      }
    });
    
    return gaps;
  }
  
  /**
   * Generate personalized improvement plan
   * @param {Object} userData - User training data
   * @param {Array} criticalGaps - Identified training gaps
   * @returns {Object} Personalized improvement plan
   */
  generateImprovementPlan(userData, criticalGaps) {
    const focusAreas = [];
    let timeline = "4-6 weeks";
    
    // Address critical gaps first
    criticalGaps.forEach(gap => {
      if (gap.includes("Missing")) {
        focusAreas.push(`Complete ${gap.replace("Missing ", "")} modules`);
      } else if (gap.includes("Low performance")) {
        focusAreas.push(`Repeat ${gap.replace("Low performance in ", "").split(" (")[0]}`);
      }
    });
    
    // Check recent performance trends
    const recentModules = userData.completedModules?.sort(
      (a, b) => new Date(b.completedAt) - new Date(a.completedAt)
    ).slice(0, 5) || [];
    
    const recentAvg = this.calculateAverageScore(recentModules);
    
    if (recentAvg < 70) {
      focusAreas.push("Review fundamentals across all training categories");
      timeline = "6-8 weeks";
    }
    
    // Personalized recommendations based on strengths
    const strengths = this.identifyUserStrengths(userData);
    if (strengths.includes("Physical")) {
      focusAreas.push("Advance to specialized physical training scenarios");
    }
    
    if (strengths.includes("Technical")) {
      focusAreas.push("Join advanced technical simulation modules");
    }
    
    return {
      focusAreas: focusAreas.length > 0 ? focusAreas : ["Maintain current training regimen"],
      timeline,
      recommendedModules: this.recommendNextModules(userData),
      trainingFrequency: this.recommendTrainingFrequency(userData)
    };
  }
  
  /**
   * Identify user strengths based on performance
   * @param {Object} userData - User training data
   * @returns {Array} User strengths
   */
  identifyUserStrengths(userData) {
    const strengths = [];
    
    // Calculate category averages
    const categories = {};
    userData.completedModules?.forEach(module => {
      if (!categories[module.category]) {
        categories[module.category] = {
          total: 0,
          count: 0
        };
      }
      
      categories[module.category].total += module.score;
      categories[module.category].count++;
    });
    
    // Identify top 3 strengths
    Object.keys(categories).forEach(category => {
      categories[category].average = categories[category].total / categories[category].count;
    });
    
    const sortedCategories = Object.keys(categories).sort(
      (a, b) => categories[b].average - categories[a].average
    );
    
    sortedCategories.slice(0, 3).forEach(category => {
      if (categories[category].average >= 80) {
        strengths.push(category.charAt(0).toUpperCase() + category.slice(1));
      }
    });
    
    return strengths;
  }
  
  /**
   /**
   * Recommend next training modules
   * @param {Object} userData - User training data
   * @returns {Array} Recommended modules
   */
  recommendNextModules(userData) {
    // Example logic - in production, this would incorporate more complex reasoning
    const completedModuleIds = userData.completedModules?.map(m => m.moduleId) || [];
    
    // Simplified recommendation logic
    const recommendations = [];
    
    // If missing core training, recommend it first
    if (!completedModuleIds.some(id => id.includes("core"))) {
      recommendations.push({
        moduleId: "core-phys-001",
        title: "Core & Balance Foundation",
        reason: "Essential baseline training"
      });
    }
    
    // Recommend endurance training if core is complete but endurance is not
    if (completedModuleIds.some(id => id.includes("core")) && 
        !completedModuleIds.some(id => id.includes("endurance"))) {
      recommendations.push({
        moduleId: "endurance-phys-001",
        title: "Endurance Boost",
        reason: "Build necessary cardiovascular capacity"
      });
    }
    
    // Recommend strength training after endurance
    if (completedModuleIds.some(id => id.includes("endurance")) && 
        !completedModuleIds.some(id => id.includes("strength"))) {
      recommendations.push({
        moduleId: "strength-phys-001",
        title: "Strength & Conditioning",
        reason: "Develop musculoskeletal resilience"
      });
    }
    
    // Always recommend technical training if not enough
    const technicalModules = completedModuleIds.filter(id => id.includes("tech")).length;
    if (technicalModules < 3) {
      recommendations.push({
        moduleId: "tech-001",
        title: "Technical Systems Overview",
        reason: "Critical technical knowledge foundation"
      });
    }
    
    // Limit to max 3 recommendations
    return recommendations.slice(0, 3);
  }
  
  /**
   * Recommend training frequency
   * @param {Object} userData - User training data
   * @returns {Object} Training frequency recommendation
   */
  recommendTrainingFrequency(userData) {
    // Base recommendation on user level and recent activity
    const userLevel = this.getUserLevel(userData);
    const recentActivity = userData.recentActivity || [];
    
    // Default recommendation
    let daysPerWeek = 3;
    let sessionsPerDay = 1;
    let sessionDuration = 45;
    
    // Adjust based on user level
    if (userLevel === "advanced") {
      daysPerWeek = 5;
      sessionsPerDay = 1;
      sessionDuration = 60;
    } else if (userLevel === "expert") {
      daysPerWeek = 6;
      sessionsPerDay = 2;
      sessionDuration = 45;
    }
    
    // Adjust if user has been inactive
    const lastActivity = recentActivity[0]?.timestamp ? new Date(recentActivity[0].timestamp) : null;
    const now = new Date();
    const daysSinceActivity = lastActivity ? Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24)) : 30;
    
    if (daysSinceActivity > 14) {
      // If inactive for over 2 weeks, reduce intensity
      daysPerWeek = Math.max(2, daysPerWeek - 2);
      sessionDuration = Math.max(30, sessionDuration - 15);
    }
    
    return {
      daysPerWeek,
      sessionsPerDay,
      sessionDuration,
      focusAreas: this.recommendFocusAreas(userData),
      recoveryEmphasis: daysSinceActivity > 14 ? "high" : "normal"
    };
  }
  
  /**
   * Recommend focus areas for training
   * @param {Object} userData - User training data
   * @returns {Array} Recommended focus areas
   */
  recommendFocusAreas(userData) {
    // Placeholder for actual implementation
    return ["Core stability", "Cardiovascular endurance", "Spatial awareness"];
  }
  
  /**
   * Assess mission-specific readiness
   * @param {Object} userData - User training data
   * @returns {Object} Mission-specific readiness assessment
   */
  assessMissionSpecificReadiness(userData) {
    // Placeholder for actual implementation
    return {
      orbital: {
        readiness: 70,
        status: "Qualified - Supervised"
      },
      lunar: {
        readiness: 50,
        status: "In Training"
      },
      deepSpace: {
        readiness: 30,
        status: "Not Ready"
      }
    };
  }
  
  /**
   * Predict performance metrics
   * @param {Object} userData - User training data
   * @returns {Object} Predicted performance metrics
   */
  predictPerformanceMetrics(userData) {
    // Placeholder for actual implementation
    return {
      estimatedCompletionTimeline: "6 months",
      projectedImprovementRate: "15% per month",
      keyAreas: ["Technical knowledge", "EVA readiness", "Emergency response"]
    };
  }
  
  // =============================================
  // METRICS EXTRACTION FUNCTIONS
  // =============================================
  
  /**
   * Extract performance metrics from session data
   * @param {Object} sessionData - Training session data
   * @returns {Object} Extracted metrics
   */
  extractMetricsFromSession(sessionData) {
    // Default values if metrics not available
    const defaults = {
      balance: 50,
      coreStability: 50,
      endurance: 50
    };
    
    // If no metrics in session data, return defaults
    if (!sessionData || !sessionData.metrics) {
      return defaults;
    }
    
    // Extract and normalize metrics
    return {
      balance: sessionData.metrics.balance || defaults.balance,
      coreStability: sessionData.metrics.coreStability || defaults.coreStability,
      endurance: sessionData.metrics.endurance || defaults.endurance
    };
  }
  
  /**
   * Extract endurance metrics from session data
   * @param {Object} sessionData - Training session data
   * @returns {Object} Extracted endurance metrics
   */
  extractEnduranceMetrics(sessionData) {
    // Default values if metrics not available
    const defaults = {
      cardioEndurance: 50,
      recoveryRate: 50,
      heartRateStability: 50
    };
    
    // If no metrics in session data, return defaults
    if (!sessionData || !sessionData.metrics) {
      return defaults;
    }
    
    // Extract and normalize metrics
    return {
      cardioEndurance: sessionData.metrics.cardioEndurance || defaults.cardioEndurance,
      recoveryRate: sessionData.metrics.recoveryRate || defaults.recoveryRate,
      heartRateStability: sessionData.metrics.heartRateStability || defaults.heartRateStability
    };
  }
  
  /**
   * Extract strength metrics from session data
   * @param {Object} sessionData - Training session data
   * @returns {Object} Extracted strength metrics
   */
  extractStrengthMetrics(sessionData) {
    // Default values if metrics not available
    const defaults = {
      muscularStrength: 50,
      formQuality: 50,
      rangeOfMotion: 50
    };
    
    // If no metrics in session data, return defaults
    if (!sessionData || !sessionData.metrics) {
      return defaults;
    }
    
    // Extract and normalize metrics
    return {
      muscularStrength: sessionData.metrics.muscularStrength || defaults.muscularStrength,
      formQuality: sessionData.metrics.formQuality || defaults.formQuality,
      rangeOfMotion: sessionData.metrics.rangeOfMotion || defaults.rangeOfMotion
    };
  }
  
  /**
   * Extract coordination metrics from session data
   * @param {Object} sessionData - Training session data
   * @returns {Object} Extracted coordination metrics
   */
  extractCoordinationMetrics(sessionData) {
    // Default values if metrics not available
    const defaults = {
      balance: 50,
      precision: 50,
      reactionTime: 50,
      spatialAwareness: 50
    };
    
    // If no metrics in session data, return defaults
    if (!sessionData || !sessionData.metrics) {
      return defaults;
    }
    
    // Extract and normalize metrics
    return {
      balance: sessionData.metrics.balance || defaults.balance,
      precision: sessionData.metrics.precision || defaults.precision,
      reactionTime: sessionData.metrics.reactionTime || defaults.reactionTime,
      spatialAwareness: sessionData.metrics.spatialAwareness || defaults.spatialAwareness
    };
  }
  
  /**
   * Extract EVA metrics from session data
   * @param {Object} sessionData - Training session data
   * @returns {Object} Extracted EVA metrics
   */
  extractEVAMetrics(sessionData) {
    // Default values if metrics not available
    const defaults = {
      suitManeuverability: 50,
      toolHandling: 50,
      spatialOrientation: 50,
      oxygenEfficiency: 50
    };
    
    // If no metrics in session data, return defaults
    if (!sessionData || !sessionData.metrics) {
      return defaults;
    }
    
    // Extract and normalize metrics
    return {
      suitManeuverability: sessionData.metrics.suitManeuverability || defaults.suitManeuverability,
      toolHandling: sessionData.metrics.toolHandling || defaults.toolHandling,
      spatialOrientation: sessionData.metrics.spatialOrientation || defaults.spatialOrientation,
      oxygenEfficiency: sessionData.metrics.oxygenEfficiency || defaults.oxygenEfficiency
    };
  }
  
  // =============================================
  // STRENGTH & WEAKNESS IDENTIFICATION FUNCTIONS
  // =============================================
  
  /**
   * Identify strengths based on metrics
   */
  identifyStrengths(balance, coreStability, endurance) {
    const strengths = [];
    
    if (balance >= 80) strengths.push("Excellent balance and stability");
    else if (balance >= 70) strengths.push("Good balance control");
    
    if (coreStability >= 80) strengths.push("Strong core stability");
    else if (coreStability >= 70) strengths.push("Good core engagement");
    
    if (endurance >= 80) strengths.push("Excellent exercise endurance");
    else if (endurance >= 70) strengths.push("Good exercise stamina");
    
    // Always provide at least one strength
    if (strengths.length === 0) {
      strengths.push("Consistent training attendance");
    }
    
    return strengths;
  }
  
  /**
   * Identify weaknesses based on metrics
   */
  identifyWeaknesses(balance, coreStability, endurance) {
    const weaknesses = [];
    
    if (balance < 50) weaknesses.push("Balance stability");
    if (coreStability < 50) weaknesses.push("Core strength");
    if (endurance < 50) weaknesses.push("Exercise endurance");
    
    return weaknesses;
  }
  
  /**
   * Identify endurance strengths
   */
  identifyEnduranceStrengths(cardioEndurance, recoveryRate, heartRateStability) {
    const strengths = [];
    
    if (cardioEndurance >= 80) strengths.push("Excellent cardiovascular endurance");
    else if (cardioEndurance >= 70) strengths.push("Good aerobic capacity");
    
    if (recoveryRate >= 80) strengths.push("Fast heart rate recovery");
    else if (recoveryRate >= 70) strengths.push("Good recovery between intervals");
    
    if (heartRateStability >= 80) strengths.push("Excellent heart rate control");
    else if (heartRateStability >= 70) strengths.push("Good heart rate zone management");
    
    // Always provide at least one strength
    if (strengths.length === 0) {
      strengths.push("Consistent cardiovascular training");
    }
    
    return strengths;
  }
  
  /**
   * Identify endurance weaknesses
   */
  identifyEnduranceWeaknesses(cardioEndurance, recoveryRate, heartRateStability) {
    const weaknesses = [];
    
    if (cardioEndurance < 50) weaknesses.push("Cardiovascular endurance");
    if (recoveryRate < 50) weaknesses.push("Recovery between intervals");
    if (heartRateStability < 50) weaknesses.push("Heart rate zone control");
    
    return weaknesses;
  }
  
  /**
   * Identify strength training strengths
   */
  identifyStrengthTrainingStrengths(muscularStrength, formQuality, rangeOfMotion) {
    const strengths = [];
    
    if (muscularStrength >= 80) strengths.push("Excellent muscular strength");
    else if (muscularStrength >= 70) strengths.push("Good strength development");
    
    if (formQuality >= 80) strengths.push("Perfect exercise form");
    else if (formQuality >= 70) strengths.push("Good exercise technique");
    
    if (rangeOfMotion >= 80) strengths.push("Full range of motion in exercises");
    else if (rangeOfMotion >= 70) strengths.push("Good movement patterns");
    
    // Always provide at least one strength
    if (strengths.length === 0) {
      strengths.push("Consistent strength training");
    }
    
    return strengths;
  }
  
  /**
   * Identify strength training weaknesses
   */
  identifyStrengthTrainingWeaknesses(muscularStrength, formQuality, rangeOfMotion) {
    const weaknesses = [];
    
    if (muscularStrength < 50) weaknesses.push("Muscular strength");
    if (formQuality < 50) weaknesses.push("Exercise form");
    if (rangeOfMotion < 50) weaknesses.push("Range of motion");
    
    return weaknesses;
  }
  
  /**
   * Identify coordination strengths
   */
  identifyCoordinationStrengths(balance, precision, reactionTime, spatialAwareness) {
    const strengths = [];
    
    if (balance >= 80) strengths.push("Excellent balance control");
    else if (balance >= 70) strengths.push("Good stability");
    
    if (precision >= 80) strengths.push("High precision in movement");
    else if (precision >= 70) strengths.push("Good movement accuracy");
    
    if (reactionTime >= 80) strengths.push("Fast reaction time");
    else if (reactionTime >= 70) strengths.push("Good response speed");
    
    if (spatialAwareness >= 80) strengths.push("Excellent spatial awareness");
    else if (spatialAwareness >= 70) strengths.push("Good proprioception");
    
    // Always provide at least one strength
    if (strengths.length === 0) {
      strengths.push("Coordination training dedication");
    }
    
    return strengths;
  }
  
  /**
   * Identify coordination weaknesses
   */
  identifyCoordinationWeaknesses(balance, precision, reactionTime, spatialAwareness) {
    const weaknesses = [];
    
    if (balance < 50) weaknesses.push("Balance control");
    if (precision < 50) weaknesses.push("Movement precision");
    if (reactionTime < 50) weaknesses.push("Reaction time");
    if (spatialAwareness < 50) weaknesses.push("Spatial awareness");
    
    return weaknesses;
  }
  
  /**
   * Identify EVA strengths
   */
  identifyEVAStrengths(suitManeuverability, toolHandling, spatialOrientation, oxygenEfficiency) {
    const strengths = [];
    
    if (suitManeuverability >= 80) strengths.push("Excellent suit mobility");
    else if (suitManeuverability >= 70) strengths.push("Good movement in EVA suit");
    
    if (toolHandling >= 80) strengths.push("Exceptional tool manipulation");
    else if (toolHandling >= 70) strengths.push("Good dexterity with tools");
    
    if (spatialOrientation >= 80) strengths.push("Superior spatial awareness in zero-G");
    else if (spatialOrientation >= 70) strengths.push("Good orientation in space");
    
    if (oxygenEfficiency >= 80) strengths.push("Optimal oxygen utilization");
    else if (oxygenEfficiency >= 70) strengths.push("Efficient breathing patterns");
    
    // Always provide at least one strength
    if (strengths.length === 0) {
      strengths.push("EVA training participation");
    }
    
    return strengths;
  }
  
  /**
   * Identify EVA weaknesses
   */
  identifyEVAWeaknesses(suitManeuverability, toolHandling, spatialOrientation, oxygenEfficiency) {
    const weaknesses = [];
    
    if (suitManeuverability < 50) weaknesses.push("Suit mobility");
    if (toolHandling < 50) weaknesses.push("Tool handling precision");
    if (spatialOrientation < 50) weaknesses.push("Spatial orientation in zero-G");
    if (oxygenEfficiency < 50) weaknesses.push("Oxygen consumption efficiency");
    
    return weaknesses;
  }
  
  // =============================================
  // SIMULATION & SCENARIO GENERATION FUNCTIONS
  // =============================================
  
  /**
   * Generate AI-Driven Space Training Scenario
   * @param {String} userId - User ID
   * @returns {Object} Generated space scenario
   */
  async generateSpaceScenario(userId) {
    try {
      // Calculate user level
      const userLevel = await this.calculateUserLevel(userId);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { 
            role: "system", 
            content: `You are STELLA, an AI space training coach with ${this.aiPersonality.experienceLevel} experience.` 
          },
          { 
            role: "user", 
            content: `Generate a space scenario for a ${userLevel} trainee. Include: Situation, Conditions, Critical Decisions, Success Criteria, and Learning Objectives.` 
          }
        ],
        temperature: 0.7
      });
      
      const scenario = response.choices[0]?.message?.content;
      if (!scenario) throw new Error("Empty response from OpenAI.");
      
      return JSON.parse(scenario);
    } catch (error) {
      console.error("❌ Error generating space scenario:", error);
      
      // Fallback scenario
      return {
        situation: "Standard orbital maintenance operation",
        conditions: "Nominal conditions with occasional communication delays",
        criticalDecisions: ["Prioritize tasks", "Manage resources", "Monitor system status"],
        successCriteria: "Complete maintenance within time constraints with no errors",
        learningObjectives: ["System familiarity", "Time management", "Problem-solving under pressure"]
      };
    }
  }
  
  /**
   * Calculate user training level
   * @param {String} userId - User ID
   * @returns {String} User training level
   */
  async calculateUserLevel(userId) {
    try {
      // Get user progress
      // Replace with actual DB query in production
      const progress = { overallScore: 75 }; // Example progress
      
      return ['rookie', 'intermediate', 'advanced', 'expert', 'mission-ready'][Math.floor((progress.overallScore || 0) / 20)] || 'rookie';
    } catch (error) {
      console.error("Error calculating user level:", error);
      return "intermediate"; // Default level if error
    }
  }
  
  /**
   * Simulate emergency response scenario
   * @param {String} userId - User ID
   * @param {String} scenarioType - Type of emergency scenario
   * @returns {Object} Emergency simulation scenario
   */
  async simulateEmergencyResponse(userId, scenarioType) {
    try {
      const scenario = this.simulationScenarios.emergencyResponses.includes(scenarioType)
        ? scenarioType
        : "oxygen_system_failure";
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { 
            role: "system", 
            content: "Simulate a critical space emergency scenario requiring immediate response." 
          },
          { 
            role: "user", 
            content: `Create emergency scenario: ${scenario}. Include warning signs, system readings, crew status, resources, and time constraints.` 
          }
        ]
      });
      
      return {
        scenario: JSON.parse(response.choices[0]?.message?.content || '{}'),
        timeLimit: 300, 
        criticalPoints: ['immediate_actions', 'crew_safety', 'system_stabilization']
      };
    } catch (error) {
      console.error('❌ Error simulating emergency:', error);
      
      // Fallback emergency scenario
      return {
        scenario: {
          type: scenario || "oxygen_system_failure",
          warningSigns: ["System alert", "Pressure drop"],
          systemReadings: { oxygen: "decreasing", pressure: "critical" },
          crewStatus: "alert",
          resources: ["emergency oxygen", "repair kit"],
          timeConstraints: "15 minutes until critical"
        },
        timeLimit: 300,
        criticalPoints: ['immediate_actions', 'crew_safety', 'system_stabilization']
      };
    }
  }
  
  /**
   * Generate mission simulation
   * @param {String} userId - User ID
   * @returns {Object} Generated mission simulation
   */
  async generateMissionSimulation(userId) {
    try {
      // Determine mission type based on user progress
      const missionType = await this.determineMissionType(userId);
      
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { 
            role: "system", 
            content: "Generate a complete space mission simulation with multiple phases." 
          },
          { 
            role: "user", 
            content: `Create ${missionType} mission simulation. Include launch sequence, objectives, challenges, and success criteria.` 
          }
        ]
      });
      
      const simulation = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      // Store the mission data in database 
      // (Commented out since this is a consolidated file)
      /*
      await TrainingSession.findOneAndUpdate(
        { userId, status: 'in-progress' },
        { $push: { 'missions': { type: missionType, simulation, startedAt: new Date() } } }
      );
      */
      
      return simulation;
    } catch (error) {
      console.error('❌ Error generating mission simulation:', error);
      
      // Fallback mission simulation
      return {
        missionType: missionType || "orbital_insertion",
        phases: ["pre-launch", "launch", "orbit", "operations", "return"],
        objectives: ["Complete system checks", "Achieve stable orbit", "Complete mission tasks"],
        challenges: ["Limited resources", "Communication delays", "System anomalies"],
        successCriteria: ["Mission objectives completed", "Safe return", "Proper protocols followed"]
      };
    }
  }
  
  /**
   * Determine appropriate mission type for user
   * @param {String} userId - User ID
   * @returns {String} Mission type
   */
  async determineMissionType(userId) {
    try {
      // Get user progress
      // Replace with actual DB query in production
      const progress = { overallScore: 75 }; // Example progress
      
      return this.simulationScenarios.missionTypes[Math.floor((progress.overallScore || 0) / 20)] || this.simulationScenarios.missionTypes[0];
    } catch (error) {
      console.error('Error determining mission type:', error);
      return "orbital_insertion"; // Default mission type
    }
  }
}

// Export the STELLA AI service
module.exports = new STELLA_AI();