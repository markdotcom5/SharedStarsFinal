/**
 * StellaBriefingService.js
 * Handles STELLA's daily presidential space briefings capabilities
 */
const mongoose = require('mongoose');
const dailyBriefingService = require('./dailyBriefingService');

class StellaBriefingService {
  constructor(options = {}) {
    this.config = {
      alertProbabilities: {
        GREEN: 0.8,    // 80% chance of GREEN status
        AMBER: 0.15,   // 15% chance of AMBER status
        RED: 0.05      // 5% chance of RED status
      },
      briefingClassification: 'COSMIC-1 CLEARANCE',
      sectionTypes: ['STRATEGIC', 'ASTRONOMICAL', 'TECHNOLOGICAL', 'TRAINING'],
      ...options
    };
    
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
    
    console.log("✅ STELLA Briefing Service initialized");
  }
  
  /**
   * Generate a daily presidential space briefing
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated briefing
   */
  async generateDailyBriefing(options = {}) {
    try {
      // Determine alert status if not provided
      let alertStatus = options.alertStatus;
      if (!alertStatus) {
        alertStatus = this.determineAlertStatus();
      }
      
      console.log(`🔄 Generating Daily Presidential Space Briefing with alert status: ${alertStatus}`);
      
      // Generate sections
      const sections = [];
      
      for (const sectionType of this.config.sectionTypes) {
        if (sectionType === 'TRAINING') continue; // Handle training directive separately
        
        try {
          const section = await this.generateBriefingSection(sectionType, alertStatus);
          sections.push(section);
        } catch (sectionError) {
          console.error(`❌ Error generating section: ${sectionError}`);
          // Add a fallback section instead of failing completely
          sections.push({
            sectionType,
            title: this.getFallbackTitle(sectionType),
            content: this.getFallbackContent(sectionType, alertStatus),
            classification: 'CONFIDENTIAL'
          });
        }
      }
      
      // Generate training directive
      let trainingDirective;
      try {
        trainingDirective = await this.generateTrainingDirective(options.userId);
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
      const wordCount = this.countBriefingWords(sections, trainingDirective);
      
      // Extract topic tags
      const topicTags = this.extractTopicTags(sections);
      
      // Assemble final briefing
      const briefing = {
        title: 'DAILY PRESIDENTIAL SPACE BRIEFING',
        alertStatus,
        sections,
        trainingDirective,
        wordCount,
        topicTags
      };
      
      // If in standalone mode, save the briefing using dailyBriefingService
      if (options.saveToDatabase) {
        try {
          return await dailyBriefingService.generateDailyBriefing({
            alertStatus,
            overrideExisting: options.overrideExisting,
            draftMode: options.draftMode
          });
        } catch (error) {
          console.error('Error saving briefing to database:', error);
          // Return generated content even if saving failed
          return briefing;
        }
      }
      
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
      
      // Delegate to OpenAI/API integrations in STELLA_AI for actual content generation
      // In the service-oriented approach, this would be a call to openaiService
      
      // For now, return a placeholder
      return {
        sectionType,
        title: this.getFallbackTitle(sectionType),
        content: this.getFallbackContent(sectionType, alertStatus),
        classification: this.getSectionClassification(sectionType, alertStatus)
      };
    } catch (error) {
      console.error('❌ Error generating section:', error);
      throw error;
    }
  }
  
  /**
   * Generate a personalized training directive
   * @param {string} userId - Optional user ID for personalization
   * @returns {Promise<Object>} Generated training directive
   */
  async generateTrainingDirective(userId = null) {
    // If we have a userId, this should delegate to the countdownService to
    // integrate the directive with the countdown system
    return {
      content: "Focus on core stability and balance training this week. These foundational skills are critical for all space operations and will prepare you for the microgravity challenges ahead.",
      relatedMissionId: "mission1",
      exerciseIds: ["planks", "stability-ball"]
    };
  }
  
  /**
   * Build a prompt for generating a section
   * @param {string} sectionType - Type of section
   * @param {string} alertStatus - Current alert status
   * @param {string[]} keywords - Keywords to include
   * @returns {string} Prompt for content generation
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
   * Determine alert status based on probabilities
   * @returns {string} Alert status (GREEN, AMBER, RED)
   */
  determineAlertStatus() {
    const random = Math.random();
    
    if (random < this.config.alertProbabilities.GREEN) {
      return 'GREEN';
    } else if (random < this.config.alertProbabilities.GREEN + this.config.alertProbabilities.AMBER) {
      return 'AMBER';
    } else {
      return 'RED';
    }
  }
  
  /**
   * Get random keywords for a section type
   * @param {string} sectionType - Section type
   * @returns {string[]} Random keywords
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
   * Get section classification based on type and alert status
   * @param {string} sectionType - Section type
   * @param {string} alertStatus - Alert status
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
   * Get fallback title for a section
   * @param {string} sectionType - Section type
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
   * @param {string} sectionType - Section type
   * @param {string} alertStatus - Alert status
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
   * Count words in a briefing
   * @param {Array} sections - Briefing sections
   * @param {Object} trainingDirective - Training directive
   * @returns {number} Word count
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
   * @param {Array} sections - Briefing sections
   * @returns {string[]} Topic tags
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
   * Send briefing to users
   * @param {string} briefingId - ID of briefing to send
   * @returns {Promise<Object>} Delivery statistics
   */
  async deliverBriefing(briefingId) {
    try {
      // Delegate to existing dailyBriefingService
      return await dailyBriefingService.deliverBriefingToSubscribers(briefingId);
    } catch (error) {
      console.error('Error delivering briefing:', error);
      throw error;
    }
  }
  
  /**
   * Get user's latest briefing
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Latest briefing for user
   */
  async getUserLatestBriefing(userId) {
    try {
      // Delegate to existing dailyBriefingService
      return await dailyBriefingService.getLatestBriefing(userId);
    } catch (error) {
      console.error('Error getting latest briefing:', error);
      throw error;
    }
  }
  
  /**
   * Get user's briefing history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} User's briefing history
   */
  async getUserBriefingHistory(userId, options) {
    try {
      // Delegate to existing dailyBriefingService
      return await dailyBriefingService.getUserBriefingHistory(userId, options);
    } catch (error) {
      console.error('Error getting briefing history:', error);
      throw error;
    }
  }
}

module.exports = StellaBriefingService;