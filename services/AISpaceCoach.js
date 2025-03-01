const { OpenAI } = require("openai");
const { EventEmitter } = require('events');
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');
const User = require('../models/User');
const Subscription = require('../models/Subscription');

class AISpaceCoach extends EventEmitter {
    constructor() {
        super();
        console.log("✅ AISpaceCoach Initialized Successfully");
    }

    async initialize() {
        console.log("🚀 Initializing AI Coaching System...");
    }

    // =====================
    // System Initialization
    // =====================
    
    initializeSystems() {
        this.initializeAchievementSystem();
        this.initializeLanguageSupport();
        this.initializeWebSocketHandlers();
        this.initializeMetricsTracking();
        this.initializeAdvancedLearning();
        this.initializeAdvancedPerformance();
        this.initializeAdvancedIntegration();
        this.initializeRealTimeFeedback();
        this.initializeGamificationSystem();
        this.initializeStudyGroupSystem();
        this.initializeAdaptiveTestingSystem();
        
        this.analytics = new AdvancedAnalytics(this);
        this.adaptiveLearning = new AdaptiveLearningSystem(this);
    }

    initializeSubsystems() {
        // Initialize adaptive learning
        this.adaptiveLearning = {
            async adjustDifficulty(userId, performance) {
                const currentState = await this.getCurrentState(userId);
                const newDifficulty = this.calculateNewDifficulty(currentState, performance);
                await this.updateLearningPath(userId, newDifficulty);
                return newDifficulty;
            },

            async personalizeContent(userId, context) {
                const learningStyle = await this.getLearningStyle(userId);
                const adaptedContent = await this.adaptContentToStyle(context, learningStyle);
                return adaptedContent;
            },

            async trackProgress(userId, data) {
                const analysis = await this.analyzeProgress(userId, data);
                await this.updateLearningModel(userId, analysis);
                return analysis;
            }
        };

        // Initialize predictive analytics
        this.predictiveAnalytics = {
            async predictPerformance(userId) {
                const history = await this.getPerformanceHistory(userId);
                return this.generatePrediction(history);
            },

            async identifyWeaknesses(userId) {
                const performance = await this.getDetailedPerformance(userId);
                return this.analyzeWeaknesses(performance);
            },

            async suggestImprovements(userId) {
                const weaknesses = await this.identifyWeaknesses(userId);
                return this.generateImprovementPlan(weaknesses);
            }
        };
    }
    initializeMetricsTracking() {
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
        };
    }

    initializeAdvancedLearning() {
        this.learningState = {
            userModels: new Map(),
            adaptiveSettings: new Map(),
            skillMatrix: new Map(),
            learningPaths: new Map()
        };
        
        this.advancedMetrics = {
            ...this.performanceMetrics,
            skillGrowth: new Map(),
            learningVelocity: new Map(),
            adaptiveScores: new Map(),
            realTimePerformance: new Map()
        };
    }

    initializeAdvancedPerformance() {
        this.performanceSystem = {
            realTimeTracking: {
                currentSessions: new Map(),
                performanceMetrics: new Map(),
                adaptiveThresholds: new Map()
            },
            predictiveModeling: {
                performanceModels: new Map(),
                learningCurves: new Map(),
                progressionPaths: new Map()
            },
            feedbackSystems: {
                personalizedFeedback: new Map(),
                adaptiveGuidance: new Map(),
                interventionStrategies: new Map()
            }
        };
    }

    initializeAdvancedIntegration() {
        this.learningIntegration = {
            adaptiveSystem: {
                difficultyMatrix: new Map(),
                personalizedPaths: new Map(),
                realTimeAdjustments: new Map()
            },
            performanceTracking: {
                historicalData: new Map(),
                predictionModels: new Map(),
                skillCorrelations: new Map()
            },
            aiModels: {
                personalizedCoaching: new Map(),
                predictiveAnalysis: new Map(),
                feedbackOptimization: new Map()
            }
        };
        this.initializeSubsystems();
    }
 // Add explicit event methods here
 emitEvent(eventName, data) {
    this.emit(eventName, data);
}

addListener(eventName, listener) {
    this.on(eventName, listener);
}
    // =================
    // Achievement & Credits System
    // =================

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
                    creditsEarned = 10;
                    break;
                default:
                    creditsEarned = 10;
            }

            if (subscription) {
                const subscriptionBonus = subscription.type === 'premium' ? 1.5 : 1;
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

    async calculateAdvancedCredits(userId, action, data) {
        try {
            const [user, subscription] = await Promise.all([
                User.findById(userId),
                Subscription.findOne({ userId, status: 'active' })
            ]);

            const baseCredits = await this.calculateBaseCredits(action, data);
            const performanceMultiplier = await this.calculatePerformanceMultiplier(userId);
            const synergyBonus = await this.calculateSkillSynergyBonus(userId);
            
            const finalCredits = Math.round(
                baseCredits * 
                performanceMultiplier * 
                synergyBonus * 
                this.getSubscriptionMultiplier(subscription)
            );

            await this.updateUserCredits(user, finalCredits);

            return {
                credits: finalCredits,
                multipliers: {
                    performance: performanceMultiplier,
                    synergy: synergyBonus,
                    subscription: this.getSubscriptionMultiplier(subscription)
                }
            };
        } catch (error) {
            console.error('Advanced credit calculation error:', error);
            throw error;
        }
    }

    getSubscriptionMultiplier(subscription) {
        if (!subscription) return 1.0;
        const multiplier = this.config.subscriptionMultipliers[subscription.plan];
        if (subscription.plan === 'custom') {
            return multiplier(subscription.amount);
        }
        return multiplier || 1.0;
    }

    async trackAchievement(userId, type, additionalData = {}) {
        try {
            const userProgress = await UserProgress.findOne({ userId }).populate('achievements');
            if (!userProgress) return null;

            const achievement = this.achievementTypes[type];
            if (!achievement) return null;

            if (!userProgress.achievements.includes(achievement.id)) {
                userProgress.achievements.push(achievement.id);
                await userProgress.save();

                const credits = await this.calculateCredits(userId, 'ACHIEVEMENT_UNLOCKED');
                this.emit('achievement-unlocked', { userId, achievement, credits });
                return { achievement, credits };
            }
            return null;
        } catch (error) {
            console.error('Achievement tracking error:', error);
            throw error;
        }
    }

        // =================
    // Learning & Performance Systems
    // =================
    
    async initializeUserLearningState(userId) {
        const learningState = {
            knowledgeMap: new Array(50).fill(0),
            skillLevels: new Array(30).fill(0),
            adaptiveFactors: {
                learningRate: 0.1,
                difficultyScale: 1.0,
                focusAreas: []
            }
        };
        this.learningState.userModels.set(userId, learningState);
        return learningState;
    }

    async updateLearningState(userId, newInsights) {
        const currentState = this.learningState.userModels.get(userId);
        if (!currentState) return;

        const knowledgeImpact = this.calculateKnowledgeImpact(newInsights);
        currentState.knowledgeMap = currentState.knowledgeMap.map((k, i) => 
            Math.min(1, k + (knowledgeImpact[i] || 0)));

        const skillImpact = this.calculateSkillImpact(newInsights);
        currentState.skillLevels = currentState.skillLevels.map((s, i) => 
            Math.min(1, s + (skillImpact[i] || 0)));

        currentState.adaptiveFactors = {
            ...currentState.adaptiveFactors,
            ...this.calculateNewAdaptiveFactors(currentState, newInsights)
        };

        this.learningState.userModels.set(userId, currentState);
    }

    async analyzeRealTimePerformance(userId, sessionData) {
        try {
            const currentState = this.performanceSystem.realTimeTracking.currentSessions.get(userId);
            const analysis = await this.performAdvancedAnalysis(sessionData);
            await this.updatePerformanceModels(userId, analysis);

            return {
                analysis,
                recommendations: await this.generateRealTimeRecommendations(userId, analysis),
                adaptiveChanges: await this.calculateAdaptiveChanges(userId, analysis)
            };
        } catch (error) {
            console.error('Real-time analysis error:', error);
            throw error;
        }
    }

    // =================
    // AI Integration Methods
    // =================

    async generateAdvancedCoachingSuggestions(userProfile) {
        if (!userProfile) throw new Error('User profile is required');

        try {
            const [user, progress, subscription] = await Promise.all([
                User.findById(userProfile.userId),
                UserProgress.findOne({ userId: userProfile.userId }),
                Subscription.findOne({ userId: userProfile.userId, status: 'active' })
            ]);

            const learningState = this.learningState.userModels.get(userProfile.userId) || 
                               await this.initializeUserLearningState(userProfile.userId);

            const enhancedContext = {
                ...this.generateAIContext(user, progress, subscription),
                learningState,
                adaptiveMetrics: await this.getAdaptiveMetrics(userProfile.userId),
                skillProgressions: await this.getSkillProgressions(userProfile.userId)
            };

            const completion = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: `You are an advanced space training AI coach with deep understanding of 
                                individual learning patterns and adaptive training methodologies.`
                    },
                    {
                        role: 'user',
                        content: `Generate personalized coaching plan based on: ${JSON.stringify(enhancedContext)}`
                    }
                ],
                temperature: 0.7
            });

            const enhancedSuggestions = completion.choices[0]?.message?.content;
            await this.updateLearningState(userProfile.userId, enhancedSuggestions);

            return {
                suggestions: enhancedSuggestions,
                adaptiveSettings: this.calculateAdaptiveSettings(learningState),
                nextMilestones: await this.predictNextMilestones(userProfile.userId)
            };
        } catch (error) {
            console.error('Enhanced coaching error:', error);
            throw error;
        }
    }
    async generateEnhancedAIInsights(userId, progress) {
        const completion = await this.openai.chat.completions.create({
            model: this.config.model,
            messages: [
                {
                    role: "system",
                    content: "You are an advanced AI training analyst specialized in space training progression analysis."
                },
                {
                    role: "user",
                    content: `Analyze training progress and provide detailed insights: ${JSON.stringify(progress)}`
                }
            ],
            temperature: 0.7
        });
    
        return {
            analysis: JSON.parse(completion.choices[0].message.content),
            recommendations: await this.generatePersonalizedRecommendations(userId, progress),
            adaptiveGuidance: await this.generateAdaptiveGuidance(userId, progress)
        };
    }
    
    initializeGamificationSystem() {
        this.gamificationSystem = {
            challenges: new Map(),
            leaderboards: new Map(),
            rewards: new Map(),
            
            enhancedAchievements: {
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
            }
        };
    }
    
    async updateLeaderboard(userId, action, score) {
        const leaderboard = this.gamificationSystem.leaderboards.get('global') || [];
        const userIndex = leaderboard.findIndex(entry => entry.userId === userId);
        
        if (userIndex >= 0) {
            leaderboard[userIndex].score += score;
        } else {
            leaderboard.push({ userId, score });
        }
        
        this.gamificationSystem.leaderboards.set('global', 
            leaderboard.sort((a, b) => b.score - a.score));
        
        return this.generateLeaderboardUpdate(userId);
    }
  
      // =====================
      // Study Groups System
      // =====================
      initializeStudyGroupSystem() {
          this.studyGroups = {
              activeGroups: new Map(),
              groupMetrics: new Map(),
              collaborationScores: new Map()
          };
      }
  
      async formStudyGroups(users) {
          try {
              const userProfiles = await Promise.all(
                  users.map(userId => this.getUserCompleteProfile(userId))
              );
  
              const groupFormation = await this.openai.chat.completions.create({
                  model: this.config.model,
                  messages: [
                      {
                          role: "system",
                          content: "Form optimal study groups based on skill levels, learning styles, and progress rates"
                      },
                      {
                          role: "user",
                          content: `Analyze users and suggest optimal groups: ${JSON.stringify(userProfiles)}`
                      }
                  ]
              });
  
              const suggestedGroups = JSON.parse(groupFormation.choices[0].message.content);
              return await this.implementGroupSuggestions(suggestedGroups);
          } catch (error) {
              console.error('Error forming study groups:', error);
              throw error;
          }
      }
  
      async implementGroupSuggestions(groups) {
          const implementedGroups = [];
          
          for (const group of groups) {
              const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              const newGroup = {
                  id: groupId,
                  members: group.members,
                  focus: group.focus,
                  schedule: await this.generateGroupSchedule(group),
                  metrics: this.initializeGroupMetrics(group)
              };
              
              this.studyGroups.activeGroups.set(groupId, newGroup);
              implementedGroups.push(newGroup);
          }
          
          return implementedGroups;
      }
  
      // =====================
      // Adaptive Testing System
      // =====================
      initializeAdaptiveTestingSystem() {
          this.adaptiveTesting = {
              questionBank: new Map(),
              difficultyLevels: new Map(),
              userPerformance: new Map()
          };
      }
  
      async implementAdaptiveTesting(userId) {
          try {
              const userLevel = await this.getCurrentUserLevel(userId);
              const learningStyle = await this.detectLearningStyle(userId);
              
              return {
                  dynamicQuestions: await this.generateDynamicQuestions(userLevel),
                  difficultyAdjustment: await this.calculateNextQuestionDifficulty(userId),
                  personalizedPrompts: await this.generateContextualPrompts(userLevel, learningStyle)
              };
          } catch (error) {
              console.error('Error implementing adaptive testing:', error);
              throw error;
          }
      }
  
      async generateDynamicQuestions(userLevel) {
          const completion = await this.openai.chat.completions.create({
              model: this.config.model,
              messages: [
                  {
                      role: "system",
                      content: "Generate space training questions adapted to the user's current level"
                  },
                  {
                      role: "user",
                      content: `Create questions for level: ${JSON.stringify(userLevel)}`
                  }
              ]
          });
  
          return this.formatQuestions(JSON.parse(completion.choices[0].message.content));
      }
  
      async calculateNextQuestionDifficulty(userId) {
          const performance = this.adaptiveTesting.userPerformance.get(userId);
          const currentLevel = await this.getCurrentUserLevel(userId);
          
          return {
              difficulty: this.computeAdaptiveDifficulty(performance),
              topics: await this.identifyNextTopics(currentLevel),
              format: this.determineQuestionFormat(performance)
          };
      }
  
      // =====================
      // Helper Methods
      // =====================
      async getUserCompleteProfile(userId) {
          const [user, progress, metrics] = await Promise.all([
              User.findById(userId),
              UserProgress.findOne({ userId }),
              this.getDetailedMetrics(userId)
          ]);
  
          return {
              userId,
              level: this.calculateUserLevel(progress),
              strengths: this.identifyStrengths(metrics),
              learningStyle: await this.detectLearningStyle(userId),
              progressRate: this.calculateProgressRate(progress)
          };
      }
  
      // Add this method to initialize all new systems
      initializeEnhancedSystems() {
          this.initializeGamificationSystem();
          this.initializeStudyGroupSystem();
          this.initializeAdaptiveTestingSystem();
      }
  
      // Update your constructor or initializeSystems method to include:
      initializeSystems() {
          // ... existing initializations ...
          this.initializeEnhancedSystems();
      }
  }
 // =================
/// =====================
// WebSocket & Real-time Features
// =====================

initializeWebSocketHandlers = () => {
    this.wsEvents = {
        track_progress: async (ws, data) => {
            try {
                const progress = await this.trackProgress(data.userId, data.progressData);
                const credits = await this.calculateCredits(data.userId, 'MODULE_COMPLETION', data.progressData);
                ws.send(JSON.stringify({ type: 'progress_update', progress, credits }));
            } catch (error) {
                this.handleWebSocketError(ws, error);
            }
        },

        request_coaching: async (ws, data) => {
            try {
                const userLang = await this.getUserLanguage(data.userId);
                const suggestions = await this.generateCoachingSuggestions(data.userProfile);
                const translatedSuggestions = await this.translateResponse(suggestions, userLang);
                ws.send(JSON.stringify({ type: 'coaching_suggestions', suggestions: translatedSuggestions }));
            } catch (error) {
                this.handleWebSocketError(ws, error);
            }
        },

        start_assessment: async (ws, data) => {
            try {
                const userLang = await this.getUserLanguage(data.userId);
                const assessment = await this.getInitialAssessment();
                const translatedAssessment = await this.translateAssessment(assessment, userLang);
                ws.send(JSON.stringify({ type: 'assessment_questions', assessment: translatedAssessment }));
            } catch (error) {
                this.handleWebSocketError(ws, error);
            }
        }
    };
}

// =====================
// Assessment & Evaluation Systems 
// =====================

processAssessmentAnswer = async (userId, questionIndex, answer, language = 'en') => {
    try {
        const subscription = await Subscription.findOne({ userId, status: 'active' });
        const aiQualityLevel = this.getAIQualityLevel(subscription);

        const completion = await this.openai.chat.completions.create({
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
        if (language !== 'en') {
            feedback = await this.translateResponse(feedback, language);
        }

        const analysis = {
            feedback,
            score: this.calculateScore(feedback),
            guidance: await this.generateImmediateGuidance(feedback, language)
        };

        await Promise.all([
            this.trackProgress(userId, {
                type: 'ASSESSMENT',
                score: analysis.score,
                questionIndex
            }),
            this.checkAssessmentAchievements(userId, analysis.score)
        ]);

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

// =====================
// Translation & Language Support
// =====================

translateResponse = async (text, targetLang) => {
    if (!this.config.languages.includes(targetLang)) {
        return text;
    }

    try {
        const completion = await this.openai.chat.completions.create({
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

// =====================
// Utility & Helper Methods
// =====================

cleanup = () => {
    if (this.metricsUpdateInterval) {
        clearInterval(this.metricsUpdateInterval);
    }
    
    [
        this.performanceMetrics.realTimeMetrics,
        this.performanceMetrics.achievements,
        this.performanceMetrics.progressHistory
    ].forEach(map => map?.clear?.());
    
    this.removeAllListeners();
}

handleWebSocketError = (ws, error) => {
    console.error('WebSocket operation error:', error);
    ws.send(JSON.stringify({
        type: 'error',
        error: {
            message: 'Operation failed',
            code: error.code || 500,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
    }));
}

getUserLanguage = async (userId) => {
    try {
        const user = await User.findById(userId);
        return user?.settings?.language || 'en';
    } catch (error) {
        console.error('Language fetch error:', error);
        return 'en';
    }
}
// Create singleton instance
const aiCoachInstance = new AISpaceCoach();

// Verify it's an EventEmitter
console.log('Is EventEmitter:', aiCoachInstance instanceof EventEmitter);

module.exports = new AISpaceCoach(); // ✅ This ensures it is a singleton instance
