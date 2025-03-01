// services/STELLA_AI/briefingGenerator.js
const { OpenAI } = require('openai');
const User = require('../../models/User');
const { DailyBriefing } = require('../../models/DailyBriefing');
const config = require('../../config');
const logger = require('../../utils/logger');
const physicalMissions = require('../../public/js/training/physical/mission-data.json').physicalMissions;

/**
 * STELLA Briefing Generator
 * Handles the generation of Daily Presidential Space Briefings using AI
 */
class BriefingGenerator {
  constructor() {
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    
    // Section types
    this.sectionTypes = [
      'STRATEGIC',
      'ASTRONOMICAL',
      'TECHNOLOGICAL',
      'TRAINING'
    ];
    
    // Keywords for each section type to guide generation
    this.sectionKeywords = {
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
  }

  /**
   * Generate a complete daily briefing
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Generated briefing content
   */
  async generateDailyBriefing(options = {}) {
    try {
      const { alertStatus = 'GREEN' } = options;
      
      logger.info('Generating daily briefing content', { alertStatus });
      
      // Generate sections
      const sections = [];
      for (const sectionType of this.sectionTypes) {
        if (sectionType === 'TRAINING') continue; // Handle training directive separately
        
        const section = await this.generateSection(sectionType, alertStatus);
        sections.push(section);
      }
      
      // Generate training directive
      const trainingDirective = await this.generateTrainingDirective();
      
      // Count total words for metadata
      const wordCount = this.countWords(sections, trainingDirective);
      
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
      
      logger.info('Successfully generated briefing content', { 
        sections: sections.length,
        wordCount,
        tags: topicTags.length
      });
      
      return briefing;
    } catch (error) {
      logger.error('Error generating daily briefing', { 
        error: error.message, 
        stack: error.stack 
      });
      throw new Error('Failed to generate briefing content: ' + error.message);
    }
  }
  
  /**
   * Generate a briefing section
   * @param {string} sectionType - Type of section to generate
   * @param {string} alertStatus - Current alert status
   * @returns {Promise<Object>} Generated section
   */
  async generateSection(sectionType, alertStatus) {
    try {
      // Get random keywords to guide generation
      const keywords = this.getRandomKeywords(sectionType);
      
      // Prepare prompt based on section type
      const prompt = this.buildSectionPrompt(sectionType, alertStatus, keywords);
      
      // Generate content using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model || "gpt-4",
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
      
      // Extract generated content
      const content = completion.choices[0].message.content.trim();
      
      // Generate a title by prompting again or extracting from content
      const title = await this.generateSectionTitle(sectionType, content);
      
      return {
        sectionType,
        title,
        content,
        classification: this.getSectionClassification(sectionType, alertStatus)
      };
    } catch (error) {
      logger.error('Error generating section', { 
        sectionType, 
        error: error.message 
      });
      
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
      // Select a random mission to feature
      const randomMissionIndex = Math.floor(Math.random() * physicalMissions.length);
      const mission = physicalMissions[randomMissionIndex];
      
      // Select random exercises from the mission
      const exercises = mission.exercises || [];
      const selectedExercises = [];
      
      if (exercises.length > 0) {
        // Pick 1-2 random exercises
        const numExercises = Math.min(exercises.length, Math.floor(Math.random() * 2) + 1);
        const shuffled = [...exercises].sort(() => 0.5 - Math.random());
        selectedExercises.push(...shuffled.slice(0, numExercises));
      }
      
      // Generate directive content using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model || "gpt-4",
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
            content: `Generate a training directive focusing on "${mission.name}" (${mission.type}).
                      Mission description: ${mission.description}
                      ${selectedExercises.length > 0 ? `Key exercises: ${selectedExercises.map(e => e.name).join(', ')}` : ''}
                      
                      Make this directive sound like it's preparing trainees for critical space operations. 
                      Explain why these skills are essential for mission success and safety.
                      Maximum 3-4 sentences.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      // Extract generated content
      const content = completion.choices[0].message.content.trim();
      
      return {
        content,
        relatedMissionId: mission.id,
        exerciseIds: selectedExercises.map(ex => ex.id)
      };
    } catch (error) {
      logger.error('Error generating training directive', { 
        error: error.message 
      });
      
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
      // Get user's training progress (simplified for example)
      // In a real implementation, this would use actual training data
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // This would be replaced with actual progress data from your system
      const userProgress = {
        completedMissions: [],
        activeMission: null,
        strengths: [],
        weaknesses: []
      };
      
      // Find mission with lowest progress that's not complete
      const incompleteMissions = physicalMissions
        .filter(mission => !userProgress.completedMissions.includes(mission.id))
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
      
      // Get interesting exercises
      const exercises = targetMission.exercises || [];
      const selectedExercises = [];
      
      if (exercises.length > 0) {
        // Pick 1-2 random exercises
        const numExercises = Math.min(exercises.length, 2);
        const shuffled = [...exercises].sort(() => 0.5 - Math.random());
        selectedExercises.push(...shuffled.slice(0, numExercises));
      }
      
      // Generate personalized directive using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model || "gpt-4",
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
            content: `Generate a personalized training directive for a trainee focusing on "${targetMission.name}" (${targetMission.type}).
                      Mission description: ${targetMission.description}
                      ${selectedExercises.length > 0 ? `Focus exercises: ${selectedExercises.map(e => e.name).join(', ')}` : ''}
                      
                      Strengths: ${userProgress.strengths.join(', ') || 'Unknown'}
                      Areas for improvement: ${userProgress.weaknesses.join(', ') || 'Unknown'}
                      
                      Make this directive sound personal but urgent, as if the trainee's readiness is critical for an upcoming mission.
                      Maximum 3-4 sentences.`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      // Extract generated content
      const content = completion.choices[0].message.content.trim();
      
      return {
        content,
        relatedMissionId: targetMission.id,
        exerciseIds: selectedExercises.map(ex => ex.id)
      };
    } catch (error) {
      logger.error('Error generating personalized directive', { 
        userId, 
        error: error.message 
      });
      
      // Fallback to generic directive
      return this.generateTrainingDirective();
    }
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
      logger.warn('Error generating section title', { 
        sectionType, 
        error: error.message 
      });
      
      // Fallback: Use default title
      return this.getFallbackTitle(sectionType);
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
   * Get random keywords for a section type
   * @param {string} sectionType - Type of section
   * @returns {string[]} Array of keywords
   */
  getRandomKeywords(sectionType) {
    const keywords = this.sectionKeywords[sectionType] || [];
    if (keywords.length === 0) return [];
    
    // Shuffle and pick 2-3 keywords
    const shuffled = [...keywords].sort(() => 0.5 - Math.random());
    const count = Math.floor(Math.random() * 2) + 2; // 2-3 keywords
    
    return shuffled.slice(0, count);
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
  countWords(sections, trainingDirective) {
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
    for (const [type, keywords] of Object.entries(this.sectionKeywords)) {
      for (const keyword of keywords) {
        if (allContent.toLowerCase().includes(keyword.toLowerCase())) {
          tags.add(keyword.toLowerCase());
        }
      }
    }
    
    // Convert set to array and limit to 10 tags
    return [...tags].slice(0, 10);
  }
}

module.exports = new BriefingGenerator();