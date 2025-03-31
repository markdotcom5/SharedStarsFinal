/**
 * TrainingLearningSystem.js
 * 
 * Consolidated training and learning services that provide comprehensive training functionality
 * for the space training platform. This module integrates functionality from:
 * - AILearningSystem.js
 * - AITrainingServices.js
 * - CoreTrainingSystem.js
 * - ProgressTracker.js
 * - physicalTrainingService.js
 * - moduleservice.js
 * - ModuleSystemIntegrator.js
 * - TrainingModuleIntegrator.js
 */

// ✅ explicitly correct TrainingLearningSystem.js
const mongoose = require('mongoose');
const { openai } = require('./openaiService');
const STELLA_AI = require('./STELLA_AI');
const { EventEmitter } = require('events');

// Import required models
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const TrainingSession = require('../models/TrainingSession');
const Module = require('../models/Module');
const Achievement = require('../models/Achievement');
const { safeGetUserProgress, isValidObjectId } = require('../../utils/progressUtils');

class TrainingLearningSystem extends EventEmitter {
  constructor() {
    super();

    try {
      this.openai = openai;  // explicit usage of previously imported openai
      if (!process.env.OPENAI_API_KEY) {
        console.error("❌ ERROR: Missing OpenAI API Key in TrainingLearningSystem");
      } else {
        console.log("✅ OpenAI client initialized in TrainingLearningSystem");
      }
    } catch (error) {
      console.error('❌ OpenAI Initialization Error in TrainingLearningSystem:', error.message);
    }

    this.stellaAI = STELLA_AI;
    
    // Training system configuration
    this.config = {
      progressThresholds: {
        beginner: 25,
        intermediate: 50,
        advanced: 75,
        expert: 90
      },
      creditRewards: {
        moduleCompletion: 100,
        exerciseCompletion: 25,
        assessmentCompletion: 50,
        perfectScore: 75,
        streakBonus: 10
      },
      adaptiveDifficulty: {
        enabled: true,
        baseDifficulty: 1.0,
        maxDifficulty: 3.0,
        performanceMultiplier: 0.1
      }
    };
    
    // Module system state
    this.modules = {
      loaded: false,
      cache: new Map(),
      categories: new Set(),
      prerequisites: new Map()
    };
    
    // Progress tracking state
    this.progressTracking = {
      userProgress: new Map(),
      sessionTracking: new Map(),
      recentActivity: new Map()
    };
    
    // Initialize the systems
    this.initialize();
    
    console.log('✅ Training & Learning System initialized');
  }
  
  /**
   * Initialize the training and learning system
   */
  async initialize() {
    try {
      // Set up event listeners
      this.setupEventListeners();
      
      // Load all training modules
      await this.loadModules();
      
      // Initialize subsystems
      this.initializeProgressTracking();
      this.initializeAdaptiveLearning();
      this.initializeAssessmentSystem();
      
      // Set up STELLA AI integration
      this.setupSTELLAIntegration();
      
      console.log('✅ Training & Learning System fully initialized');
      this.emit('system-ready');
    } catch (error) {
      console.error('❌ Error initializing Training & Learning System:', error);
      this.emit('system-error', error);
    }
  }
  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Ensure handlers are bound before setting up event listeners
    this.handleUserLogin = this.handleUserLogin?.bind(this) || (() => console.warn("⚠️ Missing handleUserLogin"));
    this.handleModuleStarted = this.handleModuleStarted?.bind(this) || (() => console.warn("⚠️ Missing handleModuleStarted"));
    this.handleModuleCompleted = this.handleModuleCompleted?.bind(this) || (() => console.warn("⚠️ Missing handleModuleCompleted"));
    this.handleExerciseCompleted = this.handleExerciseCompleted?.bind(this) || (() => console.warn("⚠️ Missing handleExerciseCompleted"));
    this.handleAssessmentCompleted = this.handleAssessmentCompleted?.bind(this) || (() => console.warn("⚠️ Missing handleAssessmentCompleted"));

    // Register event listeners properly
    this.on('user-login', this.handleUserLogin);
    this.on('module-started', this.handleModuleStarted);
    this.on('module-completed', this.handleModuleCompleted);
    this.on('exercise-completed', this.handleExerciseCompleted);
    this.on('assessment-completed', this.handleAssessmentCompleted);

    // Listen for STELLA AI events
   // Listen for STELLA AI events
if (STELLA_AI && typeof STELLA_AI === 'object' && typeof STELLA_AI.on === 'function') {
  this.handleAnalysisComplete = this.handleAnalysisComplete?.bind(this) || (() => console.warn("⚠️ Missing handleAnalysisComplete"));
  STELLA_AI.on('analysis-complete', this.handleAnalysisComplete);
} else {
  console.warn('⚠️ STELLA_AI is not an EventEmitter, skipping event listener setup');
}
}
  /**
   * Set up integration with STELLA AI
   */
  setupSTELLAIntegration() {
    if (!this.stellaAI) {
      console.warn('⚠️ STELLA AI not available for integration');
      return;
    }
    
    console.log('🔄 Setting up STELLA AI integration');
    
    // Check if stellaAI is an EventEmitter before setting up listeners
    if (this.stellaAI && typeof this.stellaAI.emit === 'function') {
      // Forward relevant events to STELLA
      this.on('user-activity', (data) => {
        this.stellaAI.emit('user-activity', data);
      });
      
      this.on('training-session-started', (data) => {
        this.stellaAI.emit('training-session-started', data);
      });
      
      this.on('training-metrics-update', (data) => {
        this.stellaAI.emit('training-metrics-update', data);
      });
    } else {
      console.warn('⚠️ STELLA AI is not a valid EventEmitter (emit issue)');
    }
    
    // Check if stellaAI has on() method before using it
if (this.stellaAI && typeof this.stellaAI.on === 'function') {
  try {
    // Commented out event listeners that are causing issues
    /*
    this.stellaAI.on('guidance-generated', (data) => {
      this.emit('ai-guidance', data);
    });
    
    this.stellaAI.on('performance-analysis', (data) => {
      this.updateUserPerformanceMetrics(data.userId, data.metrics);
      this.emit('performance-analysis', data);
    });
    */
  } catch (error) {
    console.error('❌ Error setting up STELLA AI event listeners:', error);
  }
} else {
  console.warn('⚠️ STELLA AI is not a valid EventEmitter (on issue)');
}
  }
  
  /**
   * Initialize progress tracking system
   */
  initializeProgressTracking() {
    console.log('🔄 Initializing progress tracking system');
    
    // Set up periodic progress sync
    this.progressSyncInterval = setInterval(() => {
      this.syncAllUserProgress();
    }, 300000); // Every 5 minutes
    
    // Set up streak tracking
    this.streakTrackingInterval = setInterval(() => {
      this.updateAllUserStreaks();
    }, 86400000); // Once a day
  }
  
  /**
   * Initialize adaptive learning system
   */
  initializeAdaptiveLearning() {
    console.log('🔄 Initializing adaptive learning system');
    
    // Set up adaptive difficulty adjustment
    this.adaptiveLearningSystem = {
      calculateDifficulty: (userProgress) => {
        const baseLevel = this.config.adaptiveDifficulty.baseDifficulty;
        const performanceBonus = 
          (userProgress.averageScore / 100) * 
          this.config.adaptiveDifficulty.performanceMultiplier;
        
        const difficulty = Math.min(
          baseLevel + performanceBonus,
          this.config.adaptiveDifficulty.maxDifficulty
        );
        
        return {
          level: difficulty,
          factors: {
            base: baseLevel,
            performance: performanceBonus
          }
        };
      },
      
      generatePersonalizedContent: async (userId, moduleId) => {
        const userProgress = await this.getUserProgress(userId);
        const module = await this.getModule(moduleId);
        
        if (!userProgress || !module) {
          console.warn(`⚠️ Cannot generate personalized content: missing data for user ${userId} or module ${moduleId}`);
          return null;
        }
        
        const difficulty = this.adaptiveLearningSystem.calculateDifficulty(userProgress);
        
        // Use STELLA AI if available, otherwise fall back to simple logic
        if (this.stellaAI) {
          return this.stellaAI.generatePersonalizedContent(userId, moduleId, {
            difficulty,
            progress: userProgress,
            module
          });
        }
        
        // Simple fallback personalization
        return {
          difficulty,
          recommendations: [
            "Focus on maintaining proper form",
            "Pay attention to your breathing technique",
            "Try to increase endurance gradually"
          ],
          adaptations: {
            intensity: Math.round(difficulty.level * 33.3) + "%",
            sets: Math.max(2, Math.round(difficulty.level * 1.5))
          }
        };
      },
      
      updateLearningModel: async (userId, sessionData) => {
        // Update the learning model based on session data
        const userProgress = await this.getUserProgress(userId);
        
        if (!userProgress) {
          console.warn(`⚠️ Cannot update learning model: missing data for user ${userId}`);
          return;
        }
        
        // Track performance metrics
        const performance = sessionData.metrics || {};
        
        // Update recent performance metrics
        if (!userProgress.recentPerformance) {
          userProgress.recentPerformance = [];
        }
        
        userProgress.recentPerformance.push({
          timestamp: new Date(),
          score: performance.score || 0,
          duration: performance.duration || 0,
          moduleId: sessionData.moduleId
        });
        
        // Keep only the most recent 10 performances
        if (userProgress.recentPerformance.length > 10) {
          userProgress.recentPerformance.shift();
        }
        
        // Update average score
        const scores = userProgress.recentPerformance.map(p => p.score);
        userProgress.averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Save the updated user progress
        await this.saveUserProgress(userProgress);
        
        // Emit learning model update event
        this.emit('learning-model-updated', {
          userId,
          sessionData,
          adaptiveDifficulty: this.adaptiveLearningSystem.calculateDifficulty(userProgress)
        });
      }
    };
  }
  
  /**
   * Initialize assessment system
   */
  initializeAssessmentSystem() {
    console.log('🔄 Initializing assessment system');
    
    this.assessmentSystem = {
      generateAssessment: async (userId, moduleId) => {
        const module = await this.getModule(moduleId);
        const userProgress = await this.getUserProgress(userId);
        
        if (!module || !userProgress) {
          console.warn(`⚠️ Cannot generate assessment: missing data for user ${userId} or module ${moduleId}`);
          return null;
        }
        
        // Use STELLA AI if available
        if (this.stellaAI) {
          return this.stellaAI.generateAssessment(userId, moduleId, {
            module,
            progress: userProgress
          });
        }
        
        // Simple fallback assessment
        return {
          moduleId,
          userId,
          questions: [
            {
              id: 'q1',
              text: 'What is the primary benefit of core training for astronauts?',
              options: [
                'Increased muscle mass',
                'Better stability in zero-gravity environments',
                'Reduced need for sleep',
                'Faster running speed'
              ],
              correctAnswer: 1
            },
            {
              id: 'q2',
              text: 'Which exercise is most effective for improving balance?',
              options: [
                'Bench press',
                'Sprinting',
                'Single-leg stability drills',
                'Heavy squats'
              ],
              correctAnswer: 2
            }
          ],
          passingScore: module.content?.assessment?.passingScore || 70
        };
      },
      
      evaluateAssessment: async (userId, moduleId, answers) => {
        const assessment = await this.getAssessment(moduleId);
        
        if (!assessment) {
          console.warn(`⚠️ Cannot evaluate assessment: missing assessment for module ${moduleId}`);
          return null;
        }
        
        let correctCount = 0;
        const questionCount = assessment.questions.length;
        
        // Check each answer
        answers.forEach((answer) => {
          const question = assessment.questions.find(q => q.id === answer.questionId);
          if (question && question.correctAnswer === answer.selectedOption) {
            correctCount++;
          }
        });
        
        const score = Math.round((correctCount / questionCount) * 100);
        const passed = score >= assessment.passingScore;
        
        // Create result object
        const result = {
          userId,
          moduleId,
          score,
          passed,
          completedAt: new Date(),
          feedback: this.generateAssessmentFeedback(score, passed)
        };
        
        // Update user progress
        if (passed) {
          await this.markModuleCompleted(userId, moduleId, { 
            assessmentScore: score 
          });
        }
        
        // Track assessment completion
        this.emit('assessment-completed', {
          userId,
          moduleId,
          score,
          passed
        });
        
        return result;
      },
      
      generateAssessmentFeedback: (score, passed) => {
        if (passed) {
          if (score >= 90) {
            return "Excellent work! You've demonstrated mastery of this material.";
          } else if (score >= 80) {
            return "Great job! You have a strong understanding of the concepts.";
          } else {
            return "You've passed the assessment. Keep practicing to improve your score.";
          }
        } else {
          if (score >= 60) {
            return "You're almost there. Review the key concepts and try again.";
          } else {
            return "More practice is needed. Focus on the core principles before retaking the assessment.";
          }
        }
      }
    };
  }
  
  /**
   * Load all training modules
   */
  async loadModules() {
    try {
      console.log('🔄 Loading training modules');
      
      // Fetch all modules from the database
      console.log('✅ DEBUGGING MODEL IMPORT:');
      console.log('Type of Module:', typeof Module);
      console.log('Module:', Module);
      console.log('Has find method?', typeof Module.find === 'function');
      
      // Safely handle whatever Module.find returns
      let modulesResult;
      try {
        modulesResult = await Module.find({});
        console.log('modulesResult type:', typeof modulesResult);
        console.log('modulesResult is array?', Array.isArray(modulesResult));
        console.log('modulesResult sample:', modulesResult);
      } catch (findError) {
        console.error('Error finding modules:', findError);
        modulesResult = [];
      }
      
      // Convert result to array safely
      const modules = Array.isArray(modulesResult) ? modulesResult : 
                     (modulesResult && typeof modulesResult === 'object') ? [modulesResult] : [];
      
      // Process and cache modules
      modules.forEach(module => {
        if (module && module.moduleId) {
          this.modules.cache.set(module.moduleId, module);
          
          // Track categories
          if (module.category) {
            this.modules.categories.add(module.category);
          }
          
          // Track prerequisites
          if (module.requirements?.prerequisites?.length > 0) {
            this.modules.prerequisites.set(
              module.moduleId, 
              module.requirements.prerequisites.map(p => p.moduleId)
            );
          }
        }
      });
      
      this.modules.loaded = true;
      console.log(`✅ Loaded ${modules.length} training modules`);
      
      // Emit modules loaded event
      this.emit('modules-loaded', { count: modules.length });
      
      return modules;
    } catch (error) {
      console.error('❌ Error loading modules:', error);
      throw error;
    }
  }
  /**
   * Get all training modules
   * @param {Object} filters - Optional filters for the modules
   * @returns {Array} Array of training modules
   */
  async getAllModules(filters = {}) {
    try {
      // Make sure modules are loaded
      if (!this.modules.loaded) {
        await this.loadModules();
      }
      
      // Convert cache to array
      let modules = Array.from(this.modules.cache.values());
      
      // Apply filters
      if (filters.category) {
        modules = modules.filter(m => m.category === filters.category);
      }
      
      if (filters.difficulty) {
        modules = modules.filter(m => m.difficulty === filters.difficulty);
      }
      
      if (filters.type) {
        modules = modules.filter(m => m.type === filters.type);
      }
      
      if (filters.isCompleted !== undefined && filters.userId) {
        const userProgress = await this.getUserProgress(filters.userId);
        const completedModuleIds = userProgress?.completedModules?.map(m => m.moduleId) || [];
        
        if (filters.isCompleted) {
          modules = modules.filter(m => completedModuleIds.includes(m.moduleId));
        } else {
          modules = modules.filter(m => !completedModuleIds.includes(m.moduleId));
        }
      }
      
      // Sort modules if requested
      if (filters.sortBy) {
        const sortField = filters.sortBy.startsWith('-') 
          ? filters.sortBy.substring(1)
          : filters.sortBy;
        
        const sortDirection = filters.sortBy.startsWith('-') ? -1 : 1;
        
        modules.sort((a, b) => {
          const valA = a[sortField];
          const valB = b[sortField];
          
          if (valA < valB) return -1 * sortDirection;
          if (valA > valB) return 1 * sortDirection;
          return 0;
        });
      }
      
      return modules;
    } catch (error) {
      console.error('❌ Error getting modules:', error);
      throw error;
    }
  }
  
  /**
   * Get a specific module by ID
   * @param {String} moduleId - Module ID
   * @returns {Object} Module data
   */
  async getModule(moduleId) {
    try {
      // Check cache first
      if (this.modules.cache.has(moduleId)) {
        return this.modules.cache.get(moduleId);
      }
      
      // If not in cache, try to fetch from database
      const module = await Module.findOne({ moduleId }).lean();
      
      if (module) {
        this.modules.cache.set(moduleId, module);
        return module;
      }
      
      return null;
    } catch (error) {
      console.error(`❌ Error getting module ${moduleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get a specific assessment by module ID
   * @param {String} moduleId - Module ID
   * @returns {Object} Assessment data
   */
  async getAssessment(moduleId) {
    try {
      const module = await this.getModule(moduleId);
      
      if (!module || !module.content?.assessment) {
        // Try to generate an assessment if module exists but has no assessment
        if (module && this.assessmentSystem) {
          return this.assessmentSystem.generateAssessment(null, moduleId);
        }
        return null;
      }
      
      return module.content.assessment;
    } catch (error) {
      console.error(`❌ Error getting assessment for module ${moduleId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all recommended modules for a user
   * @param {String} userId - User ID
   * @returns {Array} Recommended modules
   */
  async getRecommendedModules(userId) {
    try {
      const userProgress = await this.getUserProgress(userId);
      
      if (!userProgress) {
        // If no progress data, recommend introductory modules
        const introModules = await this.getAllModules({ 
          difficulty: 'beginner',
          isCompleted: false,
          userId,
          sortBy: 'title'
        });
        
        return introModules.slice(0, 5);
      }
      
      // Use STELLA AI for recommendations if available
      if (this.stellaAI) {
        const aiRecommendations = await this.stellaAI.recommendNextModules(userProgress);
        
        if (aiRecommendations && aiRecommendations.length > 0) {
          // Fetch full module data for the recommendations
          const recommendedModules = [];
          
          for (const rec of aiRecommendations) {
            const module = await this.getModule(rec.moduleId);
            if (module) {
              recommendedModules.push({
                ...module,
                aiRecommendation: rec.reason
              });
            }
          }
          
          return recommendedModules;
        }
      }
      
      // Fallback recommendation logic
      const completedModuleIds = userProgress.completedModules?.map(m => m.moduleId) || [];
      
      // Get modules that have prerequisites satisfied
      const allModules = await this.getAllModules();
      const eligibleModules = allModules.filter(module => {
        // Exclude completed modules
        if (completedModuleIds.includes(module.moduleId)) {
          return false;
        }
        
        // Check prerequisites
        const prerequisites = this.modules.prerequisites.get(module.moduleId) || [];
        return prerequisites.every(prereq => completedModuleIds.includes(prereq));
      });
      
      // Sort by difficulty matching user's level
      const userLevel = this.getUserLevel(userProgress);
      
      eligibleModules.sort((a, b) => {
        const difficultyMatchA = a.difficulty === userLevel ? 0 : 1;
        const difficultyMatchB = b.difficulty === userLevel ? 0 : 1;
        return difficultyMatchA - difficultyMatchB;
      });
      
      return eligibleModules.slice(0, 5);
    } catch (error) {
      console.error(`❌ Error getting recommended modules for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get user progress data
   * @param {String} userId - User ID
   * @returns {Object} User progress data
   */
  async getUserProgress(userId) {
    try {
      // Check in-memory cache first
      if (this.progressTracking.userProgress.has(userId)) {
        return this.progressTracking.userProgress.get(userId);
      }
      
      // Handle anonymous users or invalid IDs
      if (userId === 'anonymous' || !mongoose.Types.ObjectId.isValid(userId)) {
        return null;
      }
      
      // Fetch from database
      const progress = await UserProgress.findOne({ userId }).lean();
      
      // Cache the result
      if (progress) {
        this.progressTracking.userProgress.set(userId, progress);
      }
      
      return progress;
    } catch (error) {
      console.error(`❌ Error getting progress for user ${userId}:`, error);
      // Return null instead of throwing to prevent cascading errors
      return null;
    }
  }
  
  /**
   * Save user progress data
   * @param {Object} progressData - Progress data to save
   * @returns {Object} Saved progress data
   */
  async saveUserProgress(progressData) {
    try {
      // Make sure there's a userId
      if (!progressData.userId) {
        throw new Error('Missing userId in progress data');
      }
      
      // Update cache
      this.progressTracking.userProgress.set(progressData.userId, progressData);
      
      // Save to database
      const updatedProgress = await UserProgress.findOneAndUpdate(
        { userId: progressData.userId },
        progressData,
        { upsert: true, new: true }
      ).lean();
      
      return updatedProgress;
    } catch (error) {
      console.error('❌ Error saving user progress:', error);
      throw error;
    }
  }
  
  /**
   * Get active training session for a user
   * @param {String} userId - User ID
   * @returns {Object} Active training session or null
   */
  async getActiveSession(userId) {
    try {
      // Check in-memory cache first
      if (this.progressTracking.sessionTracking.has(userId)) {
        return this.progressTracking.sessionTracking.get(userId);
      }
      
      // Check database
      const session = await TrainingSession.findOne({ 
        userId, 
        status: 'in-progress' 
      }).lean();
      
      // Cache the result
      if (session) {
        this.progressTracking.sessionTracking.set(userId, session);
      }
      
      return session;
    } catch (error) {
      console.error(`❌ Error getting active session for user ${userId}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new training session
   * @param {String} userId - User ID
   * @param {String} moduleId - Module ID
   * @returns {Object} Created training session
   */
  async createTrainingSession(userId, moduleId) {
    try {
      // Get module data
      const module = await this.getModule(moduleId);
      
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }
      
      // Check if there's already an active session
      const activeSession = await this.getActiveSession(userId);
      
      if (activeSession) {
        // End the active session if it exists
        await this.endTrainingSession(userId, activeSession._id, { abandoned: true });
      }
      
      // Get user progress
      const userProgress = await this.getUserProgress(userId);
      
      // Calculate adaptive difficulty if available
      let adaptiveDifficulty = 1.0;
      
      if (this.adaptiveLearningSystem && userProgress) {
        const difficultyResult = this.adaptiveLearningSystem.calculateDifficulty(userProgress);
        adaptiveDifficulty = difficultyResult.level;
      }
      
      // Create new session
      const session = await TrainingSession.create({
        userId,
        moduleId,
        moduleType: module.type || 'standard',
        status: 'in-progress',
        startTime: new Date(),
        progress: 0,
        adaptiveDifficulty
      });
      
      // Update cache
      this.progressTracking.sessionTracking.set(userId, session);
      
      // Track user activity
      this.trackUserActivity(userId, 'session_started', { moduleId });
      
      // Emit event
      this.emit('training-session-started', {
        userId,
        moduleId,
        sessionId: session._id
      });
      
      return session;
    } catch (error) {
      console.error('❌ Error creating training session:', error);
      throw error;
    }
  }
  
  /**
   * Update training session progress
   * @param {String} userId - User ID
   * @param {String} sessionId - Session ID
   * @param {Object} progressData - Progress data
   * @returns {Object} Updated session
   */
  async updateSessionProgress(userId, sessionId, progressData) {
    try {
      // Validate progress data
      if (progressData.progress < 0 || progressData.progress > 100) {
        throw new Error('Progress must be between 0 and 100');
      }
      
      // Prepare update data
      const updateData = {
        progress: progressData.progress
      };
      
      // Add any additional metrics
      if (progressData.metrics) {
        updateData.metrics = progressData.metrics;
      }
      
      // Update database
      const updatedSession = await TrainingSession.findOneAndUpdate(
        { _id: sessionId, userId },
        { $set: updateData },
        { new: true }
      ).lean();
      
      if (!updatedSession) {
        throw new Error(`Session ${sessionId} not found for user ${userId}`);
      }
      
      // Update cache
      this.progressTracking.sessionTracking.set(userId, updatedSession);
      
      // Emit progress event
      this.emit('training-progress-updated', {
        userId,
        sessionId,
        progress: progressData.progress,
        metrics: progressData.metrics
      });
      
      // If progress is 100%, auto-complete the session
      if (progressData.progress === 100) {
        return this.endTrainingSession(userId, sessionId, { completed: true });
      }
      
      return updatedSession;
    } catch (error) {
      console.error('❌ Error updating session progress:', error);
      throw error;
    }
  }
  
  /**
   * End a training session
   * @param {String} userId - User ID
   * @param {String} sessionId - Session ID
   * @param {Object} options - Session end options
   * @returns {Object} Updated session
   */
  async endTrainingSession(userId, sessionId, options = {}) {
    try {
      // Get the session
      const session = await TrainingSession.findOne({ 
        _id: sessionId, 
        userId 
      });
      
      if (!session) {
        throw new Error(`Session ${sessionId} not found for user ${userId}`);
      }
      
      // Set completion status
      const status = options.completed ? 'completed' : options.abandoned ? 'abandoned' : 'completed';
      
      // Calculate session duration
      const startTime = new Date(session.startTime);
      const endTime = new Date();
      const duration = Math.round((endTime - startTime) / 1000); // in seconds
      
      // Prepare update data
      const updateData = {
        status,
        completedAt: endTime,
        duration
      };
      
      // If STELLA AI is available, get AI guidance
      if (this.stellaAI && status === 'completed') {
        try {
          const aiGuidance = await this.stellaAI.analyzeTraining(userId, {
            moduleId: session.moduleId,
            progress: session.progress,
            duration,
            metrics: session.metrics || {}
          });
          
          if (aiGuidance) {
            updateData.aiGuidance = aiGuidance;
          }
        } catch (aiError) {
          console.error('❌ Error getting AI guidance:', aiError);
        }
      }
      
      // Update database
      const updatedSession = await TrainingSession.findOneAndUpdate(
        { _id: sessionId, userId },
        { $set: updateData },
        { new: true }
      ).lean();
      
      // Clear from active session cache
      this.progressTracking.sessionTracking.delete(userId);
      
      // If completed, update user progress
      if (status === 'completed') {
        await this.updateModuleProgress(userId, session.moduleId, {
          sessionId,
          progress: session.progress,
          duration
        });
        
        // Track completion for streak and achievements
        await this.trackSessionCompletion(userId, session.moduleId, updatedSession);
      }
      
      // Emit session ended event
      this.emit('training-session-ended', {
        userId,
        sessionId,
        status,
        duration,
        moduleId: session.moduleId
      });
      
      return updatedSession;
    } catch (error) {
      console.error('❌ Error ending training session:', error);
      throw error;
    }
  }
  
  /**
   * Update module progress for a user
   * @param {String} userId - User ID
   * @param {String} moduleId - Module ID
   * @param {Object} sessionData - Session data
   */
  async updateModuleProgress(userId, moduleId, sessionData) {
    try {
      // Get user progress
      let userProgress = await this.getUserProgress(userId);
      
      // Create new progress if it doesn't exist
      if (!userProgress) {
        userProgress = {
          userId,
          completedModules: [],
          inProgressModules: [],
          totalCredits: 0,
          streak: 0,
          lastActive: new Date()
        };
      }
      
      // Check if module is already in progress
      const inProgressIndex = userProgress.inProgressModules?.findIndex(
        m => m.moduleId === moduleId
      ) || -1;
      
      if (inProgressIndex >= 0) {
        // Update existing in-progress module
        userProgress.inProgressModules[inProgressIndex].progress = sessionData.progress;
        userProgress.inProgressModules[inProgressIndex].lastUpdated = new Date();
      } else {
        // Add to in-progress modules
        if (!userProgress.inProgressModules) {
          userProgress.inProgressModules = [];
        }
        
        userProgress.inProgressModules.push({
          moduleId,
          progress: sessionData.progress,
          startedAt: new Date(),
          lastUpdated: new Date()
        });
      }
      
      // Check if module is completed (100% progress)
      if (sessionData.progress === 100) {
        await this.markModuleCompleted(userId, moduleId, sessionData);
      } else {
        // Just save the updated progress
        await this.saveUserProgress(userProgress);
      }
      
      // Emit progress updated event
      this.emit('module-progress-updated', {
        userId,
        moduleId,
        progress: sessionData.progress
      });
    } catch (error) {
      console.error('❌ Error updating module progress:', error);
      throw error;
    }
  }
  
  /**
   * Mark a module as completed
   * @param {String} userId - User ID
   * @param {String} moduleId - Module ID
   * @param {Object} completionData - Completion data
   */
  async markModuleCompleted(userId, moduleId, completionData = {}) {
    try {
      // Get user progress
      let userProgress = await this.getUserProgress(userId);
      
      // Create new progress if it doesn't exist
      if (!userProgress) {
        userProgress = {
          userId,
          completedModules: [],
          inProgressModules: [],
          totalCredits: 0,
          streak: 0,
          lastActive: new Date()
        };
      }
      
      // Check if module is already completed
      const isAlreadyCompleted = userProgress.completedModules?.some(
        m => m.moduleId === moduleId
      );
      
      if (isAlreadyCompleted) {
        console.log(`Module ${moduleId} already completed for user ${userId}`);
        return userProgress;
      }
      
      // Get module data
      const module = await this.getModule(moduleId);
      
      if (!module) {
        throw new Error(`Module ${moduleId} not found`);
      }
      
      // Remove from in-progress modules if present
      if (userProgress.inProgressModules) {
        userProgress.inProgressModules = userProgress.inProgressModules.filter(
          m => m.moduleId !== moduleId
        );
      }
      
      // Add to completed modules
      if (!userProgress.completedModules) {
        userProgress.completedModules = [];
      }
      
      userProgress.completedModules.push({
        moduleId,
        completedAt: new Date(),
        score: completionData.assessmentScore || 100,
        sessionId: completionData.sessionId
      });
      
      // Award credits for completion
      const creditsEarned = this.config.creditRewards.moduleCompletion;
      
      if (!userProgress.totalCredits) {
        userProgress.totalCredits = 0;
      }
      
      userProgress.totalCredits += creditsEarned;
      
      // Update skill level if appropriate
      if (!userProgress.skills) {
        userProgress.skills = {};
      }
      
      if (module.category && !userProgress.skills[module.category]) {
        userProgress.skills[module.category] = {
          level: 'beginner',
          progress: 0,
          modulesCompleted: 0
        };
      }
      
      if (module.category) {
        userProgress.skills[module.category].modulesCompleted++;
        
        // Recalculate skill level
        const categoryModules = Array.from(this.modules.cache.values())
          .filter(m => m.category === module.category);
        
        const completedCount = userProgress.completedModules
          .filter(m => {
            const completedModule = this.modules.cache.get(m.moduleId);
            return completedModule && completedModule.category === module.category;
          })
          .length;
        
        const progress = Math.min(100, Math.round((completedCount / categoryModules.length) * 100));
        userProgress.skills[module.category].progress = progress;
        
        // Update skill level based on progress
        if (progress >= this.config.progressThresholds.expert) {
          userProgress.skills[module.category].level = 'expert';
        } else if (progress >= this.config.progressThresholds.advanced) {
          userProgress.skills[module.category].level = 'advanced';
        } else if (progress >= this.config.progressThresholds.intermediate) {
          userProgress.skills[module.category].level = 'intermediate';
        } else {
          userProgress.skills[module.category].level = 'beginner';
        }
      }
      
      // Save updated progress
      await this.saveUserProgress(userProgress);
      
      // Emit module completed event
      this.emit('module-completed', {
        userId,
        moduleId,
        creditsEarned,
        completionData
      });
      
      // Check for unlocked achievements
      if (this.stellaAI) {
        this.stellaAI.checkAchievements(userId, 'module_completion', {
          moduleId,
          category: module.category,
          completedModules: userProgress.completedModules.length
        });
      }
      
      return userProgress;
    } catch (error) {
      console.error('❌ Error marking module as completed:', error);
      throw error;
    }
  }
  
  /**
   * Track completion of a training session
   * @param {String} userId - User ID
   * @param {String} moduleId - Module ID
   * @param {Object} sessionData - Session data
   */
  async trackSessionCompletion(userId, moduleId, sessionData) {
    try {
      // Update user's activity record
      this.trackUserActivity(userId, 'session_completed', {
        moduleId,
        sessionId: sessionData._id,
        duration: sessionData.duration
      });
      
      // Update streak if appropriate
      await this.updateUserStreak(userId);
      
      // Check if any achievements were unlocked
      if (this.stellaAI) {
        this.stellaAI.checkAchievements(userId, 'session_completion', {
          moduleId,
          duration: sessionData.duration,
          metrics: sessionData.metrics || {}
        });
      }
    } catch (error) {
      console.error('❌ Error tracking session completion:', error);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Update a user's streak
   * @param {String} userId - User ID
   */
  async updateUserStreak(userId) {
    try {
      const userProgress = await this.getUserProgress(userId);
      
      if (!userProgress) {
        return;
      }
      
      // Get last active date
      const lastActive = userProgress.lastActive 
        ? new Date(userProgress.lastActive) 
        : null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (lastActive) {
        const lastActiveDay = new Date(lastActive);
        lastActiveDay.setHours(0, 0, 0, 0);
        
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        // Reset streak if more than a day has passed
        if (lastActiveDay < yesterday) {
          userProgress.streak = 1;
        } 
        // Increment streak if it's a new day
        else if (lastActiveDay.getTime() === yesterday.getTime()) {
          userProgress.streak = (userProgress.streak || 0) + 1;
          
          // Check for streak achievements
          if (this.stellaAI && userProgress.streak % 7 === 0) {
            // Weekly streak achievement
            this.stellaAI.checkAchievements(userId, 'streak_milestone', {
              streakDays: userProgress.streak
            });
            
            // Award streak bonus
            userProgress.totalCredits += this.config.creditRewards.streakBonus;
          }
        }
        // If same day, no change to streak
      } else {
        // First activity ever
        userProgress.streak = 1;
      }
      
      // Update last active date
      userProgress.lastActive = new Date();
      
      // Save the updated progress
      await this.saveUserProgress(userProgress);
      
      // Emit streak updated event if streak changed
      if (userProgress.streak > 1) {
        this.emit('streak-updated', {
          userId,
          streak: userProgress.streak
        });
      }
    } catch (error) {
      console.error('❌ Error updating user streak:', error);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Update all user streaks (called periodically)
   */
  async updateAllUserStreaks() {
    try {
      // Get all users with streaks
      const users = await UserProgress.find({ streak: { $gt: 0 } }).select('userId').lean();
      
      // Process in batches to avoid overloading the system
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(user => this.updateUserStreak(user.userId)));
      }
      
      console.log(`✅ Updated streaks for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error updating all user streaks:', error);
    }
  }
  
  /**
   * Sync all user progress to database
   */
  async syncAllUserProgress() {
    try {
      const users = Array.from(this.progressTracking.userProgress.keys());
      
      // Process in batches
      const batchSize = 50;
      const batches = [];
      
      for (let i = 0; i < users.length; i += batchSize) {
        batches.push(users.slice(i, i + batchSize));
      }
      
      for (const batch of batches) {
        await Promise.all(batch.map(userId => {
          const progress = this.progressTracking.userProgress.get(userId);
          return UserProgress.findOneAndUpdate(
            { userId },
            progress,
            { upsert: true }
          );
        }));
      }
      
      console.log(`✅ Synced progress for ${users.length} users`);
    } catch (error) {
      console.error('❌ Error syncing all user progress:', error);
    }
  }
  
  /**
   * Track user activity
   * @param {String} userId - User ID
   * @param {String} activityType - Type of activity
   * @param {Object} activityData - Activity data
   */
  trackUserActivity(userId, activityType, activityData = {}) {
    try {
      // Get current activity record or create new one
      let activityRecord = this.progressTracking.recentActivity.get(userId) || {
        activities: []
      };
      
      // Add new activity
      activityRecord.activities.push({
        type: activityType,
        timestamp: new Date(),
        data: activityData
      });
      
      // Keep only last 20 activities
      if (activityRecord.activities.length > 20) {
        activityRecord.activities = activityRecord.activities.slice(-20);
      }
      
      // Update cache
      this.progressTracking.recentActivity.set(userId, activityRecord);
      
      // Emit user activity event
      this.emit('user-activity', {
        userId,
        activityType,
        activityData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('❌ Error tracking user activity:', error);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Get user's recent activity
   * @param {String} userId - User ID
   * @returns {Array} Recent activities
   */
  getUserRecentActivity(userId) {
    try {
      const activityRecord = this.progressTracking.recentActivity.get(userId);
      return activityRecord?.activities || [];
    } catch (error) {
      console.error('❌ Error getting recent activity:', error);
      return [];
    }
  }
  
  /**
   * Calculate user's progress statistics
   * @param {String} userId - User ID
   * @returns {Object} Progress statistics
   */
  async calculateProgressStats(userId) {
    try {
      const userProgress = await this.getUserProgress(userId);
      
      if (!userProgress) {
        return {
          totalProgress: 0,
          moduleCompletion: 0,
          skillBreakdown: {}
        };
      }
      
      // Calculate overall progress
      const totalModules = this.modules.cache.size;
      const completedModules = userProgress.completedModules?.length || 0;
      const totalProgress = Math.min(100, Math.round((completedModules / totalModules) * 100));
      
      // Calculate module completion rate
      const startedModules = completedModules + (userProgress.inProgressModules?.length || 0);
      const moduleCompletion = startedModules > 0
        ? Math.round((completedModules / startedModules) * 100)
        : 0;
      
      // Calculate skill breakdown
      const skillBreakdown = {};
      
      if (userProgress.skills) {
        Object.entries(userProgress.skills).forEach(([skill, data]) => {
          skillBreakdown[skill] = {
            level: data.level,
            progress: data.progress,
            modulesCompleted: data.modulesCompleted
          };
        });
      }
      
      return {
        totalProgress,
        moduleCompletion,
        skillBreakdown,
        streak: userProgress.streak || 0,
        totalCredits: userProgress.totalCredits || 0
      };
    } catch (error) {
      console.error('❌ Error calculating progress stats:', error);
      throw error;
    }
  }
  
  /**
   * Get the user's skill level
   * @param {Object} userProgress - User progress data
   * @returns {String} User skill level
   */
  getUserLevel(userProgress) {
    if (!userProgress) {
      return 'beginner';
    }
    
    // Calculate average skill level
    let totalSkillValue = 0;
    let skillCount = 0;
    
    if (userProgress.skills) {
      Object.values(userProgress.skills).forEach(skill => {
        let skillValue = 0;
        
        switch (skill.level) {
          case 'expert':
            skillValue = 4;
            break;
          case 'advanced':
            skillValue = 3;
            break;
          case 'intermediate':
            skillValue = 2;
            break;
          default:
            skillValue = 1;
        }
        
        totalSkillValue += skillValue;
        skillCount++;
      });
    }
    
    const averageSkillValue = skillCount > 0 
      ? totalSkillValue / skillCount 
      : 1;
    
    if (averageSkillValue >= 3.5) return 'expert';
    if (averageSkillValue >= 2.5) return 'advanced';
    if (averageSkillValue >= 1.5) return 'intermediate';
    return 'beginner';
  }
  
  /**
   * Update user performance metrics
   * @param {String} userId - User ID
   * @param {Object} metrics - Performance metrics
   */
  async updateUserPerformanceMetrics(userId, metrics) {
    try {
      const userProgress = await this.getUserProgress(userId);
      
      if (!userProgress) {
        console.warn(`Cannot update metrics for non-existent user ${userId}`);
        return;
      }
      
      // Initialize performance metrics if they don't exist
      if (!userProgress.performanceMetrics) {
        userProgress.performanceMetrics = {};
      }
      
      // Update metrics
      Object.entries(metrics).forEach(([key, value]) => {
        userProgress.performanceMetrics[key] = value;
      });
      
      // Save updated progress
      await this.saveUserProgress(userProgress);
      
      // Emit metrics updated event
      this.emit('performance-metrics-updated', {
        userId,
        metrics
      });
    } catch (error) {
      console.error('❌ Error updating user performance metrics:', error);
      // Don't throw here, just log the error
    }
  }
  
  /**
   * Get leaderboard data
   * @param {Object} options - Leaderboard options
   * @returns {Array} Leaderboard data
   */
  async getLeaderboard(options = {}) {
    try {
      const { category, limit = 10, timeframe = 'all' } = options;
      
      // Define query based on options
      const query = {};
      
      if (timeframe === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query.lastActive = { $gte: weekAgo };
      } else if (timeframe === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query.lastActive = { $gte: monthAgo };
      }
      
      // Get user progress data
      let userProgressList = await UserProgress.find(query)
        .sort({ totalCredits: -1 })
        .limit(limit)
        .lean();
      
      // Filter by category if specified
      if (category && category !== 'all') {
        userProgressList = userProgressList.filter(progress => {
          return progress.skills && progress.skills[category];
        });
        
        // Sort by category progress if category specified
        userProgressList.sort((a, b) => {
          const progressA = a.skills?.[category]?.progress || 0;
          const progressB = b.skills?.[category]?.progress || 0;
          return progressB - progressA;
        });
      }
      
      // Get user details for each entry
      const leaderboard = await Promise.all(
        userProgressList.map(async (progress, index) => {
          const user = await User.findById(progress.userId).select('name username profile').lean();
          
          return {
            rank: index + 1,
            userId: progress.userId,
            name: user?.name || 'Unknown User',
            username: user?.username || 'unknown',
            profile: user?.profile,
            credits: progress.totalCredits || 0,
            streak: progress.streak || 0,
            modulesCompleted: progress.completedModules?.length || 0,
            categoryProgress: category && category !== 'all'
              ? progress.skills?.[category]?.progress || 0
              : undefined
          };
        })
      );
      
      return leaderboard;
    } catch (error) {
      console.error('❌ Error getting leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Handle user login event
   * @param {Object} data - Login event data
   */
  async handleUserLogin(data) {
    try {
      const { userId } = data;
      
      // Update user's streak
      await this.updateUserStreak(userId);
      
      // Track login activity
      this.trackUserActivity(userId, 'login');
      
      // Check for recommended modules
      const recommendedModules = await this.getRecommendedModules(userId);
      
      // Emit recommended modules event
      if (recommendedModules.length > 0) {
        this.emit('recommended-modules', {
          userId,
          modules: recommendedModules
        });
      }
    } catch (error) {
      console.error('❌ Error handling user login:', error);
    }
  }
  
  /**
   * Handle module started event
   * @param {Object} data - Module started event data
   */
  async handleModuleStarted(data) {
    try {
      const { userId, moduleId } = data;
      
      // Create a new training session
      const session = await this.createTrainingSession(userId, moduleId);
      
      // Track activity
      this.trackUserActivity(userId, 'module_started', { moduleId });
      
      // Return the created session
      return session;
    } catch (error) {
      console.error('❌ Error handling module started:', error);
      throw error;
    }
  }
  
  /**
   * Handle module completed event
   * @param {Object} data - Module completed event data
   */
  async handleModuleCompleted(data) {
    try {
      const { userId, moduleId, sessionId } = data;
      
      // End the training session if provided
      if (sessionId) {
        await this.endTrainingSession(userId, sessionId, { completed: true });
      }
      
      // Mark module as completed
      await this.markModuleCompleted(userId, moduleId, data);
      
      // Track activity
      this.trackUserActivity(userId, 'module_completed', { moduleId });
      
      // Get recommended next modules
      const recommendedModules = await this.getRecommendedModules(userId);
      
      // Emit recommended modules event
      if (recommendedModules.length > 0) {
        this.emit('recommended-modules', {
          userId,
          modules: recommendedModules
        });
      }
    } catch (error) {
      console.error('❌ Error handling module completed:', error);
      throw error;
    }
  }
  
  /**
   * Handle exercise completed event
   * @param {Object} data - Exercise completed event data
   */
  async handleExerciseCompleted(data) {
    try {
      const { userId, moduleId, exerciseId, metrics } = data;
      
      // Get active session
      const session = await this.getActiveSession(userId);
      
      if (session && session.moduleId === moduleId) {
        // Update session metrics with exercise data
        const currentMetrics = session.metrics || {};
        const exerciseMetrics = metrics || {};
        
        // Merge exercise metrics with session metrics
        const updatedMetrics = {
          ...currentMetrics,
          exercises: {
            ...(currentMetrics.exercises || {}),
            [exerciseId]: exerciseMetrics
          }
        };
        
        // Calculate updated progress
        const module = await this.getModule(moduleId);
        const totalExercises = module?.content?.exercises?.length || 1;
        
        const completedExercises = Object.keys(updatedMetrics.exercises || {}).length;
        const progress = Math.min(100, Math.round((completedExercises / totalExercises) * 100));
        
        // Update session
      // Update session
await this.updateSessionProgress(userId, session.sessionId, {
    progress,
    metrics: updatedMetrics
  });
        
  // Track activity
  this.trackUserActivity(userId, 'exercise_completed', { 
    moduleId, 
    exerciseId 
  });
        }
      } catch (error) {
        console.error('❌ Error handling exercise completed:', error);
        throw error;
      }
    }
  }
  
  // Create and export the instance
  const trainingSystem = new TrainingLearningSystem();
  module.exports = trainingSystem;