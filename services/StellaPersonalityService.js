/**
 * StellaPersonalityService.js
 * Handles STELLA's personality, teaching style, and conversational aspects
 */
const mongoose = require('mongoose');
const StellaConversation = require('../models/StellaConversation');

class StellaPersonalityService {
  constructor(options = {}) {
    // Default personality configuration
    this.personalityConfig = {
      honesty: 9,     // How direct and truthful (higher = more brutally honest)
      humor: 6,       // Level of humor incorporation (higher = more jokes/lightness)
      formality: 7,   // Communication formality (higher = more formal language)
      encouragement: 8, // Level of positive reinforcement (higher = more encouraging)
      detail: 7,      // Detail level in responses (higher = more comprehensive)
      challenge: 7,   // How challenging the guidance (higher = pushes student harder)
      ...options.personalityConfig
    };
    
    // Generate trait list based on configuration
    this.updateTraits();
    
    // Teaching style configuration
    this.teachingStyle = {
      socraticMethod: 0.7,    // How often to use questions instead of direct answers
      exampleRate: 0.6,       // How often to include examples
      analogyRate: 0.5,       // How often to use analogies
      personalizeRate: 0.8,   // How often to reference user's specific context
      ...options.teachingStyle
    };
    
    // Baseline instructor identity
    this.instructorPersona = {
      name: "STELLA",
      title: "Space Training Enhancement and Learning Logic Assistant",
      background: "Veteran astronaut training specialist",
      specialties: ["Zero-G adaptation", "Emergency procedures", "Psychological resilience"],
      ...options.instructorPersona
    };
    
    // OpenAI config (should be passed from STELLA_AI)
    this.openai = options.openai;
    this.config = options.config || { model: "gpt-4-turbo" };
    
    console.log("✅ STELLA Personality Service initialized");
  }
  
  /**
   * Configure STELLA's personality
   * @param {Object} config - Personality configuration
   * @returns {Object} Updated personality
   */
  configurePersonality(config = {}) {
    // Update configuration with new values
    this.personalityConfig = {
      ...this.personalityConfig,
      ...config
    };
    
    // Ensure values are within valid range
    Object.keys(this.personalityConfig).forEach(key => {
      this.personalityConfig[key] = Math.max(0, Math.min(10, this.personalityConfig[key]));
    });
    
    // Update traits based on new configuration
    this.updateTraits();
    
    console.log(`✅ STELLA personality updated: ${this.traits.join(', ')}`);
    return {
      config: this.personalityConfig,
      traits: this.traits
    };
  }
  
  /**
   * Update traits list based on personality configuration
   */
  updateTraits() {
    const traits = [];
    
    // Honesty trait
    if (this.personalityConfig.honesty >= 8) traits.push("direct");
    else if (this.personalityConfig.honesty <= 4) traits.push("diplomatic");
    
    // Humor trait
    if (this.personalityConfig.humor >= 8) traits.push("humorous");
    else if (this.personalityConfig.humor <= 3) traits.push("serious");
    
    // Formality trait
    if (this.personalityConfig.formality >= 8) traits.push("formal");
    else if (this.personalityConfig.formality <= 4) traits.push("casual");
    
    // Encouragement trait
    if (this.personalityConfig.encouragement >= 8) traits.push("encouraging");
    else if (this.personalityConfig.encouragement <= 4) traits.push("demanding");
    
    // Detail trait
    if (this.personalityConfig.detail >= 8) traits.push("detailed");
    else if (this.personalityConfig.detail <= 4) traits.push("concise");
    
    // Challenge trait
    if (this.personalityConfig.challenge >= 8) traits.push("challenging");
    else if (this.personalityConfig.challenge <= 4) traits.push("supportive");
    
    this.traits = traits;
  }
  
  /**
   * Generate a personalized response in teacher/student style
   * @param {String} userId - User ID 
   * @param {String} question - User's question
   * @param {Object} context - Context information
   * @returns {Promise<String>} STELLA's response
   */
  async generatePersonalizedResponse(userId, question, context) {
    try {
      // Get enhanced user context
      const userContext = await this.buildUserContext(userId);
      
      // Create teaching-focused prompt
      const prompt = this.buildPersonalizedPrompt(userContext, question);
      
      // Check if OpenAI is available
      if (!this.openai) {
        throw new Error("OpenAI service not initialized");
      }
      
      // Generate response
      const response = await this.openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: question }
        ]
      });
      
      const responseText = response.choices[0].message.content.trim();
      
      // Save conversation to database
      await this.saveConversation(userId, question, responseText);
      
      return responseText;
    } catch (error) {
      console.error('Error generating personalized response:', error);
      
      // Provide a teacher-like fallback response
      return "I notice you're asking about an important training concept. While I'm currently having trouble accessing my full knowledge base, I'd encourage you to continue with your current training module and we can revisit this question in our next session. Remember that space training requires persistence through technical difficulties.";
    }
  }
  
  /**
   * Save conversation to database
   * @param {String} userId - User ID
   * @param {String} question - User's question
   * @param {String} answer - STELLA's answer
   * @returns {Promise<Object>} Saved conversation
   */
  async saveConversation(userId, question, answer) {
    try {
      const conversation = new StellaConversation({
        userId,
        fromUser: question,
        fromSTELLA: answer,
        timestamp: new Date()
      });
      
      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('Error saving conversation:', error);
      // Non-critical error, just log it
    }
  }
  
  /**
   * Build user context for personalization
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Enhanced user context
   */
  async buildUserContext(userId) {
    try {
      // Get user progress data
      const userProgress = await mongoose.model('UserProgress').findOne({ userId }).lean();
      
      // Get recent conversations
      const recentConversations = await StellaConversation.find({ userId })
        .sort({ timestamp: -1 })
        .limit(3)
        .lean();
      
      // Create baseline context
      const context = {
        profile: {
          name: "Astronaut Trainee", // Default name
          subscription: "Standard",
          experienceLevel: "Beginner"
        },
        currentModule: "Introduction",
        moduleProgress: [],
        assessmentResults: [],
        trainingHistory: [],
        recentConversations: []
      };
      
      // Enhance with user progress if available
      if (userProgress) {
        // Determine experience level
        let experienceLevel = "Beginner";
        if (userProgress.credits && userProgress.credits.total > 1000) {
          experienceLevel = "Advanced";
        } else if (userProgress.credits && userProgress.credits.total > 300) {
          experienceLevel = "Intermediate";
        }
        
        // Find active modules
        const activeModules = userProgress.moduleProgress || [];
        
        // Get physical training progress
        const physicalProgress = userProgress.physicalTraining || {};
        
        // Get countdown information if available
        const countdown = userProgress.spaceReadiness?.countdown;
        
        // Update context with rich user data
        context.profile.experienceLevel = experienceLevel;
        context.currentModule = activeModules.length > 0 ? activeModules[0].moduleId : "Introduction";
        context.moduleProgress = activeModules.map(m => ({
          moduleId: m.moduleId,
          completedSessions: m.completedSessions,
          progress: m.missionProgress ? 
            Array.from(m.missionProgress.entries()).map(([key, value]) => ({ mission: key, progress: value })) : 
            []
        }));
        context.achievements = userProgress.achievements || [];
        context.physicalTraining = physicalProgress;
        context.certifications = userProgress.certifications || [];
        context.credits = userProgress.credits;
        context.countdown = countdown;
        
        // Extract strengths and challenges
        context.strengths = this.identifyUserStrengths(userProgress);
        context.challenges = this.identifyUserChallenges(userProgress);
      }
      
      // Add recent conversations
      if (recentConversations && recentConversations.length > 0) {
        context.recentConversations = recentConversations.map(c => ({
          fromUser: c.fromUser,
          fromSTELLA: c.fromSTELLA,
          timestamp: c.timestamp
        }));
      }
      
      return context;
    } catch (error) {
      console.error('Error building user context:', error);
      return {
        profile: { experienceLevel: "Beginner" },
        currentModule: "Introduction"
      };
    }
  }
  
  /**
   * Build system prompt for personalized response
   * @param {Object} userContext - User context
   * @param {String} question - User question
   * @returns {String} System prompt
   */
  buildPersonalizedPrompt(userContext, question) {
    // Create prompt components based on personality and teaching style
    const personalityDirective = this.buildPersonalityDirective();
    const teachingStyleDirective = this.buildTeachingStyleDirective();
    const userContextSummary = this.buildUserContextSummary(userContext);
    
    return `
      You are STELLA (Space Training Enhancement and Learning Logic Assistant), an AI instructor for astronaut training.
      
      ${personalityDirective}
      
      ${teachingStyleDirective}
      
      STUDENT CONTEXT:
      ${userContextSummary}
      
      STUDENT QUESTION: "${question}"
      
      Respond as an expert space training instructor would, with the personality traits and teaching style specified above.
      Focus on being helpful while maintaining the instructor-student relationship.
    `;
  }
  
  /**
   * Build personality directive based on configuration
   * @returns {String} Personality directive
   */
  buildPersonalityDirective() {
    // Create descriptions based on configuration
    const honestyDesc = this.personalityConfig.honesty >= 7 
      ? "Be direct and straightforward in your guidance, prioritizing truth over comfort."
      : "Balance honesty with tact, focusing on constructive feedback.";
    
    const humorDesc = this.personalityConfig.humor >= 7
      ? "Incorporate appropriate humor to engage the student and make points memorable."
      : "Maintain a professional tone with limited humor.";
    
    const formalityDesc = this.personalityConfig.formality >= 7
      ? "Use formal language and structure in your responses."
      : "Use conversational, accessible language while maintaining professionalism.";
    
    const encouragementDesc = this.personalityConfig.encouragement >= 7
      ? "Offer frequent encouragement and positive reinforcement."
      : "Focus primarily on improvement opportunities while acknowledging progress.";
    
    const detailDesc = this.personalityConfig.detail >= 7
      ? "Provide comprehensive, detailed explanations."
      : "Keep explanations concise and focused on key points.";
    
    const challengeDesc = this.personalityConfig.challenge >= 7
      ? "Push the student beyond their comfort zone with challenging guidance."
      : "Offer accessible guidance that builds confidence gradually.";
    
    return `
      PERSONALITY TRAITS:
      - ${honestyDesc}
      - ${humorDesc}
      - ${formalityDesc}
      - ${encouragementDesc}
      - ${detailDesc}
      - ${challengeDesc}
      - Always maintain the demeanor of ${this.instructorPersona.background}.
    `;
  }
  
  /**
   * Build teaching style directive
   * @returns {String} Teaching style directive
   */
  buildTeachingStyleDirective() {
    // Convert rates to guidance
    const socraticGuidance = this.teachingStyle.socraticMethod >= 0.7
      ? "Frequently use questions to guide the student to their own insights."
      : "Balance direct instruction with occasional guiding questions.";
    
    const exampleGuidance = this.teachingStyle.exampleRate >= 0.7
      ? "Incorporate multiple concrete examples to illustrate concepts."
      : "Use targeted examples when they clarify complex points.";
    
    const analogyGuidance = this.teachingStyle.analogyRate >= 0.7
      ? "Use analogies that relate space concepts to familiar situations."
      : "Occasionally use analogies to bridge complex concepts.";
    
    const personalizeGuidance = this.teachingStyle.personalizeRate >= 0.7
      ? "Heavily reference the student's specific context and history."
      : "Include relevant references to the student's progress and goals.";
    
    return `
      TEACHING APPROACH:
      - ${socraticGuidance}
      - ${exampleGuidance}
      - ${analogyGuidance}
      - ${personalizeGuidance}
      - Connect concepts to real space missions and astronaut experiences.
      - Prioritize practical application over theoretical knowledge.
      - Always provide clear next steps or actionable guidance.
    `;
  }
  
  /**
   * Build summary of user context
   * @param {Object} userContext - User context
   * @returns {String} User context summary
   */
  buildUserContextSummary(userContext) {
    if (!userContext) {
      return "Limited information available about this student.";
    }
    
    // Extract key information
    const experienceLevel = userContext.profile?.experienceLevel || "Beginner";
    const currentModule = userContext.currentModule || "Introduction";
    const strengths = userContext.strengths || ["Not enough data to determine strengths"];
    const challenges = userContext.challenges || ["Not enough data to determine challenges"];
    const countdown = userContext.countdown || "Unknown";
    
    return `
      - Experience level: ${experienceLevel}
      - Current training module: ${currentModule}
      - Training strengths: ${strengths.join(', ')}
      - Areas for improvement: ${challenges.join(', ')}
      - Current countdown to readiness: ${this.formatCountdown(countdown)}
      - Recent progress: ${userContext.recentProgress || "No recent progress data"}
    `;
  }
  
  /**
   * Format countdown for display
   * @param {Number} countdownSeconds - Countdown in seconds
   * @returns {String} Formatted countdown
   */
  formatCountdown(countdownSeconds) {
    if (!countdownSeconds) return "Unknown";
    
    // Calculate years, days, hours, minutes, seconds
    const years = Math.floor(countdownSeconds / 31536000);
    const days = Math.floor((countdownSeconds % 31536000) / 86400);
    const hours = Math.floor((countdownSeconds % 86400) / 3600);
    
    if (years > 0) {
      return `${years}y ${days}d`;
    } else if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((countdownSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
  
  /**
   * Identify user strengths from progress data
   * @param {Object} userProgress - User progress data
   * @returns {Array} User strengths
   */
  identifyUserStrengths(userProgress) {
    const strengths = [];
    
    // Check physical training progress
    if (userProgress.physicalTraining && userProgress.physicalTraining.overallProgress > 70) {
      strengths.push('physical training');
    }
    
    // Check module progress for different types
    if (userProgress.moduleProgress && userProgress.moduleProgress.length > 0) {
      // Check for technical modules
      const technicalModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('tech') || m.moduleId.includes('technical')
      );
      
      if (technicalModules.length > 0 && this.getAverageCompletion(technicalModules) > 70) {
        strengths.push('technical knowledge');
      }
      
      // Check for social modules
      const socialModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('social') || m.moduleId.includes('community')
      );
      
      if (socialModules.length > 0 && this.getAverageCompletion(socialModules) > 70) {
        strengths.push('teamwork');
      }
    }
    
    // Check for achievements
    if (userProgress.achievements && userProgress.achievements.length > 3) {
      strengths.push('achievement orientation');
    }
    
    // Add default strength if none identified
    if (strengths.length === 0) {
      strengths.push('training persistence');
    }
    
    return strengths;
  }
  
  /**
   * Identify user challenges from progress data
   * @param {Object} userProgress - User progress data
   * @returns {Array} User challenges
   */
  identifyUserChallenges(userProgress) {
    const challenges = [];
    
    // Check physical training progress
    if (!userProgress.physicalTraining || userProgress.physicalTraining.overallProgress < 50) {
      challenges.push('physical conditioning');
    }
    
    // Check module progress for different types
    if (userProgress.moduleProgress && userProgress.moduleProgress.length > 0) {
      // Check for technical modules
      const technicalModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('tech') || m.moduleId.includes('technical')
      );
      
      if (technicalModules.length === 0 || this.getAverageCompletion(technicalModules) < 50) {
        challenges.push('technical systems');
      }
      
      // Check for social modules
      const socialModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('social') || m.moduleId.includes('community')
      );
      
      if (socialModules.length === 0 || this.getAverageCompletion(socialModules) < 50) {
        challenges.push('team collaboration');
      }
    }
    
    // Check for consistency
    if (!userProgress.lastActivity || 
        (new Date() - new Date(userProgress.lastActivity)) > (7 * 24 * 60 * 60 * 1000)) {
      challenges.push('training consistency');
    }
    
    return challenges;
  }
  
  /**
   * Get average completion percentage for modules
   * @param {Array} modules - Array of module progress objects
   * @returns {Number} Average completion percentage
   */
  getAverageCompletion(modules) {
    if (!modules || modules.length === 0) return 0;
    
    let totalProgress = 0;
    let count = 0;
    
    for (const module of modules) {
      // Check for different progress tracking methods
      if (module.progress !== undefined) {
        totalProgress += module.progress;
        count++;
      } else if (module.completedSessions !== undefined && module.totalSessions !== undefined) {
        totalProgress += (module.completedSessions / module.totalSessions) * 100;
        count++;
      }
    }
    
    return count > 0 ? totalProgress / count : 0;
  }
}

module.exports = StellaPersonalityService;