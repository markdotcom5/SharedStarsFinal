const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});



const EventEmitter = require('events');
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

class AISpaceCoach extends EventEmitter {
  constructor() {
    super();

    // Initialize systems
    this.initializeAchievementSystem();
    this.initializeLanguageSupport();
    this.initializeWebSocketHandlers();

    // Enhanced metrics tracking
    this.performanceMetrics = {
      trainingModulesCompleted: 0,
      skillProgressTracking: new Map(),
      userEngagementScore: 0,
      achievements: new Map(),
      progressHistory: new Map(),
      realTimeMetrics: new Map(),
      creditAccumulation: new Map()
    };
  }

  // Sets up default configuration if none exists.
  initializeLanguageSupport() {
    this.config = this.config || {};
    this.config.languages = this.config.languages || ['en'];
    this.config.model = this.config.model || 'gpt-4';
    this.config.subscriptionMultipliers = this.config.subscriptionMultipliers || {
      premium: 1.5,
      individual: 1,
      family: 1,
      galactic: 1,
      custom: (amount) => (amount >= 100 ? 1.5 : 1)
    };
  }

  // Achievement System Setup
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
      }
      // You can add more achievement types here as needed
    };
  }

  // Translates text to a target language, maintaining technical accuracy.
  async translateResponse(text, targetLang) {
    if (!this.config.languages.includes(targetLang)) {
      return text; // Default to original if language not supported
    }

    try {
      const completion = await OpenAI.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are a translator. Translate the following text to ${targetLang}. Maintain the technical accuracy and tone.`
          },
          { role: 'user', content: text }
        ],
        temperature: 0.3
      });

      return completion.choices[0]?.message?.content || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  // Calculates and awards credits based on user actions and subscription level.
  async calculateCredits(userId, action, data) {
    try {
      const [user, subscription] = await Promise.all([
        User.findById(userId),
        Subscription.findOne({ userId, status: 'active' })
      ]);

      if (!user) throw new Error('User not found');

      let creditsEarned = 0;
      switch (action) {
        case 'MODULE_COMPLETION':
        case 'module_completion':
          creditsEarned = 100;
          break;
        case 'ACHIEVEMENT_UNLOCKED':
          creditsEarned = 50;
          break;
        case 'STREAK_BONUS':
          creditsEarned = 25;
          break;
        case 'assessment_completion':
          // Example: you can use data.score if needed
          creditsEarned = 10;
          break;
        default:
          creditsEarned = 10;
      }

      if (subscription) {
        const subscriptionBonus =
          subscription.type === 'premium' ? 1.5 : 1;
        creditsEarned *= subscriptionBonus;
      }

      user.credits = (user.credits || 0) + creditsEarned;
      await user.save();

      return { success: true, newCreditBalance: user.credits };
    } catch (error) {
      console.error('Credit calculation error:', error);
      return { success: false, error: error.message };
    }
  }

  // Returns a subscription multiplier based on the plan.
  getSubscriptionMultiplier(subscription) {
    if (!subscription) return 1.0;

    const multiplier = this.config.subscriptionMultipliers[subscription.plan];
    if (subscription.plan === 'custom') {
      return multiplier(subscription.amount);
    }
    return multiplier || 1.0;
  }

  // Calculate achievement bonus from user's progress
  async calculateAchievementBonus(userId) {
    const userProgress = await UserProgress.findOne({ userId }).populate(
      'achievements'
    );

    if (!userProgress?.achievements?.length) return 0;

    return userProgress.achievements.reduce((total, achievement) => {
      return total + (achievement.bonusMultiplier || 0);
    }, 0);
  }

  // Tracks achievement and awards credits if it's a new unlock.
  async trackAchievement(userId, type, additionalData = {}) {
    try {
      const userProgress = await UserProgress.findOne({ userId }).populate(
        'achievements'
      );
      if (!userProgress) return null;

      const achievement = this.achievementTypes[type];
      if (!achievement) return null;

      if (!userProgress.achievements.includes(achievement.id)) {
        userProgress.achievements.push(achievement.id);
        await userProgress.save();

        const credits = await this.calculateCredits(
          userId,
          'ACHIEVEMENT_UNLOCKED'
        );
        this.emit('achievement-unlocked', { userId, achievement, credits });
        return { achievement, credits };
      }
      return null;
    } catch (error) {
      console.error('Achievement tracking error:', error);
      throw error;
    }
  }

  // Initialize WebSocket event handlers
  initializeWebSocketHandlers() {
    this.wsEvents = {
      track_progress: async (ws, data) => {
        try {
          const progress = await this.trackProgress(
            data.userId,
            data.progressData
          );
          const credits = await this.calculateCredits(
            data.userId,
            'MODULE_COMPLETION',
            data.progressData
          );
          ws.send(
            JSON.stringify({ type: 'progress_update', progress, credits })
          );
        } catch (error) {
          this.handleWebSocketError(ws, error);
        }
      },

      request_coaching: async (ws, data) => {
        try {
          const userLang = await this.getUserLanguage(data.userId);
          const suggestions = await this.generateCoachingSuggestions(
            data.userProfile
          );
          const translatedSuggestions = await this.translateResponse(
            suggestions,
            userLang
          );

          ws.send(
            JSON.stringify({
              type: 'coaching_suggestions',
              suggestions: translatedSuggestions
            })
          );
        } catch (error) {
          this.handleWebSocketError(ws, error);
        }
      },

      start_assessment: async (ws, data) => {
        try {
          const userLang = await this.getUserLanguage(data.userId);
          const assessment = await this.getInitialAssessment();
          const translatedAssessment = await this.translateAssessment(
            assessment,
            userLang
          );

          ws.send(
            JSON.stringify({
              type: 'assessment_questions',
              assessment: translatedAssessment
            })
          );
        } catch (error) {
          this.handleWebSocketError(ws, error);
        }
      }
    };

    // Error handling for WebSocket
    this.wsErrorHandler = (ws, error) => {
      console.error('WebSocket error:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          message: 'An error occurred processing your request'
        })
      );
    };
  }

  // Enhanced AI Coaching Methods - Generates personalized coaching suggestions.
  async generateCoachingSuggestions(userProfile) {
    if (!userProfile) throw new Error('User profile is required');

    try {
      const [user, progress, subscription] = await Promise.all([
        User.findById(userProfile.userId),
        UserProgress.findOne({ userId: userProfile.userId }),
        Subscription.findOne({ userId: userProfile.userId, status: 'active' })
      ]);

      // Generate personalized context
      const context = this.generateAIContext(user, progress, subscription);

      const completion = await OpenAI.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content:
              'You are an expert space training coach providing personalized guidance.'
          },
          {
            role: 'user',
            content: `Generate coaching suggestions based on: ${JSON.stringify(
              context
            )}`
          }
        ],
        temperature: 0.7
      });

      const suggestions = completion.choices[0]?.message?.content;

      // Track AI interaction (stubbed for now)
      await this.trackAIInteraction(userProfile.userId, 'coaching_suggestion', {
        context,
        suggestions
      });

      return suggestions;
    } catch (error) {
      console.error('Error generating coaching suggestions:', error);
      throw error;
    }
  }

  // Generates context for AI based on user progress and subscription.
  generateAIContext(user, progress, subscription) {
    return {
      credits: user.credits,
      achievements: progress.achievements.length,
      completedModules: progress.moduleProgress.length,
      subscriptionTier: subscription?.plan || 'none',
      skillLevels: progress.skillLevels,
      recentActivity: this.getRecentActivity(user._id)
    };
  }

  // Processes an assessment answer, returns feedback, calculates score,
  // and provides immediate guidance.
  async processAssessmentAnswer(
    userId,
    questionIndex,
    answer,
    language = 'en'
  ) {
    try {
      // Get user's subscription level for AI response quality
      const subscription = await Subscription.findOne({
        userId,
        status: 'active'
      });

      const aiQualityLevel = this.getAIQualityLevel(subscription);

      // Generate AI evaluation
      const completion = await OpenAI.chat.completions.create({
        model: this.config.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert space training evaluator. Quality Level: ${aiQualityLevel}`
          },
          {
            role: 'user',
            content: `Question Index: ${questionIndex}\nAnswer: ${answer}\nProvide detailed feedback.`
          }
        ],
        temperature: 0.7
      });

      let feedback = completion.choices[0]?.message?.content;

      // Translate feedback if needed
      if (language !== 'en') {
        feedback = await this.translateResponse(feedback, language);
      }

      const analysis = {
        feedback,
        score: this.calculateScore(feedback),
        guidance: await this.generateImmediateGuidance(feedback, language)
      };

      // Track progress and check achievements
      await Promise.all([
        this.trackProgress(userId, {
          type: 'ASSESSMENT',
          score: analysis.score,
          questionIndex
        }),
        this.checkAssessmentAchievements(userId, analysis.score)
      ]);

      // Calculate and award credits
      const credits = await this.calculateCredits(userId, 'assessment_completion', {
        score: analysis.score
      });

      return {
        success: true,
        analysis,
        credits,
        nextQuestionIndex: questionIndex + 1
      };
    } catch (error) {
      console.error('Assessment processing error:', error);
      throw error;
    }
  }

  // Tracks user progress by updating metrics, streaks, and skill levels.
  async trackProgress(userId, data) {
    try {
      // Get or initialize user metrics
      const userMetrics =
        this.performanceMetrics.realTimeMetrics.get(userId) || {
          moduleProgress: {},
          skillLevels: {},
          achievements: [],
          streakData: {
            lastActivity: null,
            currentStreak: 0
          }
        };

      // Update metrics
      userMetrics.lastUpdate = new Date();
      userMetrics.currentProgress = data;

      // Update streak data
      const streakUpdated = this.updateStreak(userMetrics.streakData);
      if (streakUpdated) {
        await this.checkStreakAchievements(
          userId,
          userMetrics.streakData.currentStreak
        );
      }

      // Calculate skill improvements
      const skillImprovements = this.calculateSkillImprovements(data);
      Object.assign(userMetrics.skillLevels, skillImprovements);

      // Store updated metrics
      this.performanceMetrics.realTimeMetrics.set(userId, userMetrics);

      // Emit progress update event
      this.emit('progress-update', {
        userId,
        progress: data,
        skillImprovements,
        streak: userMetrics.streakData,
        timestamp: new Date()
      });

      // Update database with the new progress
      await UserProgress.findOneAndUpdate(
        { userId },
        {
          $set: {
            skillLevels: userMetrics.skillLevels,
            lastActivity: new Date(),
            currentStreak: userMetrics.streakData.currentStreak
          },
          $push: {
            progressHistory: {
              data,
              timestamp: new Date()
            }
          }
        },
        { upsert: true }
      );

      return userMetrics;
    } catch (error) {
      console.error('Progress tracking error:', error);
      throw error;
    }
  }

  // Calculates skill improvements based on progress type and score.
  calculateSkillImprovements(progressData) {
    const improvements = {};
    const skillWeights = {
      ASSESSMENT: { technical: 0.6, theoretical: 0.8, practical: 0.4 },
      MODULE_COMPLETION: { technical: 0.5, theoretical: 0.5, practical: 0.7 },
      SIMULATION: { technical: 0.7, theoretical: 0.3, practical: 0.9 }
    };

    const weights = skillWeights[progressData.type] || {};
    const baseImprovement = (progressData.score || 0) / 100;

    for (const [skill, weight] of Object.entries(weights)) {
      improvements[skill] = baseImprovement * weight;
    }

    return improvements;
  }

  // Retrieves the user's preferred language.
  async getUserLanguage(userId) {
    try {
      const user = await User.findById(userId);
      return user?.settings?.language || 'en';
    } catch (error) {
      console.error('Language fetch error:', error);
      return 'en';
    }
  }

  // Determines AI quality level based on subscription.
  getAIQualityLevel(subscription) {
    const qualityLevels = {
      individual: 'standard',
      family: 'enhanced',
      galactic: 'premium',
      custom: (amount) => (amount >= 100 ? 'premium' : 'enhanced')
    };

    if (!subscription) return 'standard';

    const level = qualityLevels[subscription.plan];
    return typeof level === 'function' ? level(subscription.amount) : level;
  }

  // Checks for assessment-related achievements.
  async checkAssessmentAchievements(userId, score) {
    const achievements = [];

    if (score >= 90) {
      achievements.push(await this.trackAchievement(userId, 'ASSESSMENT_MASTER', { score }));
    }
    if (score === 100) {
      achievements.push(await this.trackAchievement(userId, 'PERFECT_SCORE', { score }));
    }

    return achievements.filter(Boolean);
  }

  // Updates the user's streak based on their last activity.
  updateStreak(streakData) {
    const now = new Date();
    const lastActivity = streakData.lastActivity
      ? new Date(streakData.lastActivity)
      : null;

    if (!lastActivity) {
      streakData.currentStreak = 1;
      streakData.lastActivity = now;
      return true;
    }

    const daysDiff = Math.floor((now - lastActivity) / (1000 * 60 * 60 * 24));

    if (daysDiff === 0) return false;
    if (daysDiff === 1) {
      streakData.currentStreak++;
      streakData.lastActivity = now;
      return true;
    }

    streakData.currentStreak = 1;
    streakData.lastActivity = now;
    return true;
  }

  // Handles WebSocket errors by logging and sending an error message.
  handleWebSocketError(ws, error) {
    console.error('WebSocket operation error:', error);
    ws.send(
      JSON.stringify({
        type: 'error',
        error: {
          message: 'Operation failed',
          code: error.code || 500,
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      })
    );
  }

  // Cleanup resources on process termination.
  cleanup() {
    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
    }
    if (this.performanceMetrics.realTimeMetrics && this.performanceMetrics.realTimeMetrics.clear) {
      this.performanceMetrics.realTimeMetrics.clear();
    }
    if (this.performanceMetrics.achievements && this.performanceMetrics.achievements.clear) {
      this.performanceMetrics.achievements.clear();
    }
    if (this.performanceMetrics.progressHistory && this.performanceMetrics.progressHistory.clear) {
      this.performanceMetrics.progressHistory.clear();
    }
    this.removeAllListeners();
  }

  // Stub: Track AI interactions (for logging or analytics)
  async trackAIInteraction(userId, interactionType, data) {
    // In a real system, you'd record this interaction.
    // For now, we'll simply resolve.
    return;
  }

  // Stub: Returns an initial assessment.
  async getInitialAssessment() {
    // Return a default assessment structure.
    return { questions: [] };
  }

  // Stub: Translates an assessment (currently a passthrough).
  async translateAssessment(assessment, targetLang) {
    // For now, just return the assessment unchanged.
    return assessment;
  }

  // Stub: Returns recent activity for the user.
  getRecentActivity(userId) {
    // In a real system, you'd pull recent user activity.
    return [];
  }

  // Stub: Calculates a score from feedback.
  calculateScore(feedback) {
    // Dummy score calculation.
    return Math.min(100, Math.floor(Math.random() * 101));
  }

  // Stub: Generates immediate guidance based on feedback.
  async generateImmediateGuidance(feedback, language) {
    return 'Keep up the good work and review the feedback carefully.';
  }

  // Stub: Check streak achievements (if any) based on current streak.
  async checkStreakAchievements(userId, currentStreak) {
    // You could add logic here to award streak achievements.
    return;
  }
}

// Create and export a singleton instance
const aiCoachInstance = new AISpaceCoach();

// Handle process termination gracefully.
process.on('SIGTERM', () => {
  aiCoachInstance.cleanup();
});

process.on('SIGINT', () => {
  aiCoachInstance.cleanup();
});

module.exports = aiCoachInstance;
