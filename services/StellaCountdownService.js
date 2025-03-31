/**
 * StellaCountdownService.js - Precise countdown tracking and management
 */
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');

class StellaCountdownService {
  constructor(options = {}) {
    this.config = {
      // Base countdown in seconds (4 years)
      baseCountdown: 126144000, // 1460 days * 24 hours * 60 minutes * 60 seconds
      baseReductions: {
        mission_completion: 1555200,  // 18 days in seconds
        exercise_completion: 69120,   // 0.8 days in seconds
        assessment_completion: 276480, // 3.2 days in seconds
        daily_engagement: 34560,      // 0.4 days in seconds
        social_contribution: 129600,  // 1.5 days in seconds
        referral: 432000              // 5 days in seconds
      },
      // Real-time reduction rates (seconds per second of activity)
      realtimeRates: {
        active_training: 10,     // 10x acceleration during active training
        assessment_taking: 5,    // 5x acceleration during assessments
        mission_focus: 7,        // 7x acceleration during mission focus
        idle: 1                  // Base rate when logged in but idle
      },
      ...options
    };
    
    // Define countdown milestones (in seconds)
    this.milestones = [
      { seconds: 94608000, label: "3 Years to Readiness" },   // 1095 days
      { seconds: 63072000, label: "2 Years to Readiness" },   // 730 days
      { seconds: 31536000, label: "1 Year to Readiness" },    // 365 days
      { seconds: 15552000, label: "6 Months to Readiness" },  // 180 days
      { seconds: 7776000, label: "3 Months to Readiness" },   // 90 days
      { seconds: 2592000, label: "1 Month to Readiness" },    // 30 days
      { seconds: 604800, label: "Final Week of Training" },   // 7 days
      { seconds: 0, label: "Space Ready" }
    ];
    
    // Initialize real-time tracking
    this.activeUsers = new Map();
    
    console.log("✅ STELLA Countdown Service initialized with precise tracking");
  }
  
  /**
   * Start real-time countdown tracking for a user
   * @param {String} userId - User ID
   * @param {String} activityType - Type of activity (active_training, assessment_taking, etc.)
   * @returns {Object} Tracking data
   */
  startRealtimeTracking(userId, activityType = 'idle') {
    // Get acceleration rate based on activity type
    const accelerationRate = this.config.realtimeRates[activityType] || this.config.realtimeRates.idle;
    
    // Record start time and activity type
    const trackingData = {
      userId,
      activityType,
      accelerationRate,
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      accumulatedReduction: 0
    };
    
    // Store in active users map
    this.activeUsers.set(userId, trackingData);
    
    console.log(`✅ Started real-time tracking for user ${userId} with ${accelerationRate}x acceleration`);
    return trackingData;
  }
  
  /**
   * Update user's activity type during real-time tracking
   * @param {String} userId - User ID
   * @param {String} activityType - New activity type
   * @returns {Object} Updated tracking data
   */
  updateUserActivity(userId, activityType) {
    // Check if user is being tracked
    if (!this.activeUsers.has(userId)) {
      return this.startRealtimeTracking(userId, activityType);
    }
    
    // Get current tracking data
    const trackingData = this.activeUsers.get(userId);
    
    // Calculate reduction for time spent in previous activity
    const now = Date.now();
    const timeSpentMs = now - trackingData.lastUpdateTime;
    const timeSpentSeconds = timeSpentMs / 1000;
    const reduction = timeSpentSeconds * trackingData.accelerationRate;
    
    // Update tracking data
    trackingData.accumulatedReduction += reduction;
    trackingData.lastUpdateTime = now;
    trackingData.activityType = activityType;
    trackingData.accelerationRate = this.config.realtimeRates[activityType] || this.config.realtimeRates.idle;
    
    // Update in active users map
    this.activeUsers.set(userId, trackingData);
    
    console.log(`Updated user ${userId} to ${activityType} activity (${trackingData.accelerationRate}x acceleration)`);
    return trackingData;
  }
  
  /**
   * End real-time tracking and apply accumulated reduction
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Final tracking results
   */
  async endRealtimeTracking(userId) {
    // Check if user is being tracked
    if (!this.activeUsers.has(userId)) {
      return { error: 'User not currently being tracked' };
    }
    
    // Get tracking data
    const trackingData = this.activeUsers.get(userId);
    
    // Calculate final reduction
    const now = Date.now();
    const timeSpentMs = now - trackingData.lastUpdateTime;
    const timeSpentSeconds = timeSpentMs / 1000;
    const finalReduction = timeSpentSeconds * trackingData.accelerationRate;
    
    // Add to accumulated reduction
    trackingData.accumulatedReduction += finalReduction;
    
    // Total session time
    const totalTimeMs = now - trackingData.startTime;
    const totalTimeMinutes = Math.round(totalTimeMs / 60000);
    
    // Remove from active users
    this.activeUsers.delete(userId);
    
    // Apply the reduction to user's countdown
    const result = await this.applyCountdownReduction(userId, {
      type: 'realtime_session',
      activityType: trackingData.activityType,
      durationMinutes: totalTimeMinutes,
      reduction: trackingData.accumulatedReduction
    });
    
    console.log(`Ended real-time tracking for user ${userId}. Reduced countdown by ${trackingData.accumulatedReduction.toFixed(2)} seconds`);
    return {
      userId,
      sessionDuration: totalTimeMinutes,
      activityType: trackingData.activityType,
      totalReduction: trackingData.accumulatedReduction,
      newCountdown: result.newCountdown
    };
  }
  
  /**
   * Apply countdown reduction to user
   * @param {String} userId - User ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Updated countdown information
   */
  async applyCountdownReduction(userId, activityData) {
    try {
      // Get current user progress
      const userProgress = await UserProgress.findOne({ userId });
      if (!userProgress) {
        throw new Error('User progress not found');
      }
      
      // Extract current countdown value (default to baseCountdown if not set)
      const currentCountdown = userProgress.spaceReadiness?.countdown || this.config.baseCountdown;
      
      // Use reduction from activity data or calculate it
      let reduction = activityData.reduction;
      if (reduction === undefined) {
        reduction = this.calculateCountdownReduction(activityData);
      }
      
      // Calculate new countdown value (ensure it doesn't go below 0)
      const newCountdown = Math.max(0, currentCountdown - reduction);
      
      // Update user progress record
      await UserProgress.findOneAndUpdate(
        { userId },
        { 
          $set: { 'spaceReadiness.countdown': newCountdown },
          $push: { 
            'spaceReadiness.reductions': {
              date: new Date(),
              activityType: activityData.type,
              reduction,
              currentCountdown: newCountdown
            }
          }
        }
      );
      
      // Return updated countdown info
      return {
        previousCountdown: currentCountdown,
        reduction,
        newCountdown,
        activity: activityData.type,
        nextMilestone: this.getNextCountdownMilestone(newCountdown),
        formatted: this.formatCountdown(newCountdown)
      };
    } catch (error) {
      console.error('Error updating countdown:', error);
      return {
        error: 'Failed to update countdown',
        details: error.message
      };
    }
  }
  
  /**
   * Calculate countdown reduction from activity
   * @param {Object} activityData - Activity data
   * @returns {Number} Reduction amount in seconds
   */
  calculateCountdownReduction(activityData) {
    // Base reduction values by activity type
    const baseReduction = this.config.baseReductions[activityData.type] || 8640; // Default 0.1 days
    
    // Performance multipliers (quality matters)
    const performanceMultiplier = 
      activityData.performance ? 
      Math.max(0.5, Math.min(2.0, activityData.performance / 50)) : 
      1.0;
    
    // Calculate base reduction
    let reduction = baseReduction * performanceMultiplier;
    
    // Apply mission difficulty multiplier if applicable
    if (activityData.missionId) {
      const missionDifficulty = this.getMissionDifficulty(activityData.missionId) || 1.0;
      reduction *= missionDifficulty;
    }
    
    // Apply consistency bonus
    if (activityData.consistencyStreak > 3) {
      reduction *= (1 + (activityData.consistencyStreak * 0.03));
    }
    
    return reduction;
  }
  
  /**
   * Get mission difficulty multiplier
   * @param {String} missionId - Mission ID
   * @returns {Number} Difficulty multiplier
   */
  getMissionDifficulty(missionId) {
    // Extract mission number from ID if available
    const missionNumber = parseInt(missionId.replace(/[^0-9]/g, '')) || 1;
    
    // Higher number missions are more difficult and give more reduction
    return 1 + (missionNumber * 0.1) - 0.1; // Mission 1 = 1.0, Mission 2 = 1.1, etc.
  }
  
  /**
   * Format countdown for display
   * @param {Number} countdownSeconds - Countdown in seconds
   * @returns {Object} Formatted countdown
   */
  formatCountdown(countdownSeconds) {
    // Calculate years, days, hours, minutes, seconds
    const years = Math.floor(countdownSeconds / 31536000);
    const days = Math.floor((countdownSeconds % 31536000) / 86400);
    const hours = Math.floor((countdownSeconds % 86400) / 3600);
    const minutes = Math.floor((countdownSeconds % 3600) / 60);
    const seconds = Math.floor(countdownSeconds % 60);
    
    // Create display strings
    const longFormat = `${years}y ${days}d ${hours}h ${minutes}m ${seconds}s`;
    
    let shortFormat = '';
    if (years > 0) {
      shortFormat = `${years}y ${days}d`;
    } else if (days > 0) {
      shortFormat = `${days}d ${hours}h`;
    } else {
      shortFormat = `${hours}h ${minutes}m ${seconds}s`;
    }
    
    // Calculate percentage complete
    const percentComplete = ((this.config.baseCountdown - countdownSeconds) / this.config.baseCountdown * 100).toFixed(2);
    
    return {
      totalSeconds: countdownSeconds,
      components: { years, days, hours, minutes, seconds },
      display: { long: longFormat, short: shortFormat },
      percentComplete
    };
  }
  
  /**
   * Get next countdown milestone
   * @param {Number} countdown - Current countdown in seconds
   * @returns {Object} Next milestone information
   */
  getNextCountdownMilestone(countdown) {
    // Find the next milestone below current countdown
    for (let i = 0; i < this.milestones.length; i++) {
      if (countdown > this.milestones[i].seconds) {
        return {
          seconds: this.milestones[i].seconds,
          label: this.milestones[i].label,
          secondsRemaining: countdown - this.milestones[i].seconds,
          formattedTimeRemaining: this.formatCountdownDuration(countdown - this.milestones[i].seconds)
        };
      }
    }
    
    // If already at 0, return completed status
    return {
      seconds: 0,
      label: "Space Ready",
      secondsRemaining: 0,
      formattedTimeRemaining: "0 seconds"
    };
  }
  
  /**
   * Format a countdown duration for display
   * @param {Number} seconds - Duration in seconds
   * @returns {String} Formatted duration
   */
  formatCountdownDuration(seconds) {
    if (seconds >= 31536000) {
      // More than a year
      const years = Math.floor(seconds / 31536000);
      const days = Math.floor((seconds % 31536000) / 86400);
      return `${years} year${years !== 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''}`;
    } else if (seconds >= 86400) {
      // More than a day
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      return `${days} day${days !== 1 ? 's' : ''} and ${hours} hour${hours !== 1 ? 's' : ''}`;
    } else if (seconds >= 3600) {
      // More than an hour
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours} hour${hours !== 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    } else if (seconds >= 60) {
      // More than a minute
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${secs} second${secs !== 1 ? 's' : ''}`;
    } else {
      // Less than a minute
      return `${seconds} second${seconds !== 1 ? 's' : ''}`;
    }
  }
  
  /**
   * Generate a special challenge for user
   * @param {String} userId - User ID
   * @returns {Promise<Object>} Special challenge
   */
  async generateSpecialChallenge(userId) {
    try {
      // Get user progress
      const userProgress = await UserProgress.findOne({ userId });
      if (!userProgress) throw new Error('User progress not found');
      
      // Determine user's strengths and challenges
      const strengths = this.identifyUserStrengths(userProgress);
      const challenges = this.identifyUserChallenges(userProgress);
      
      // Focus on a challenge area but leverage a strength
      const focusArea = challenges.length > 0 ? challenges[0] : 'general';
      const leveragedStrength = strengths.length > 0 ? strengths[0] : 'consistency';
      
      // Generate a challenge
      const challenge = {
        id: `sc-${Date.now()}`,
        title: `${this.capitalizeFirstLetter(focusArea)} Mastery Challenge`,
        description: `Complete 3 ${focusArea} training sessions with excellent form within 7 days.`,
        focusArea,
        leveragedStrength,
        difficulty: 'challenging',
        timeLimit: 7, // days
        reward: {
          countdownReduction: 2073600, // 24 days in seconds
          bonusCredits: 200
        },
        requirements: {
          sessions: 3,
          minimumQuality: 85,
          timeFrame: 7 // days
        }
      };
      
      // Save challenge to user record
      await UserProgress.findOneAndUpdate(
        { userId },
        { 
          $push: { 
            'spaceReadiness.specialChallenges': challenge 
          }
        }
      );
      
      return challenge;
    } catch (error) {
      console.error('Error generating special challenge:', error);
      
      // Return fallback challenge
      return {
        id: `sc-${Date.now()}`,
        title: 'Training Intensity Challenge',
        description: 'Complete 3 training sessions in the next 5 days to accelerate your space readiness.',
        focusArea: 'consistency',
        difficulty: 'moderate',
        timeLimit: 5, // days
        reward: {
          countdownReduction: 1036800, // 12 days in seconds
          bonusCredits: 100
        }
      };
    }
  }
  
  /**
   * Identify user strengths from progress data
   * @param {Object} userProgress - User progress data
   * @returns {Array} User strengths
   */
  identifyUserStrengths(userProgress) {
    const strengths = [];
    
    // Example implementation - would be more sophisticated in practice
    // based on module completion rates, assessment scores, etc.
    
    // Check physical training progress
    if (userProgress.physicalTraining && userProgress.physicalTraining.overallProgress > 70) {
      strengths.push('physical');
    }
    
    // Check module progress for different types
    if (userProgress.moduleProgress && userProgress.moduleProgress.length > 0) {
      // Check for technical modules
      const technicalModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('tech') || m.moduleId.includes('technical')
      );
      
      if (technicalModules.length > 0 && this.getAverageCompletion(technicalModules) > 70) {
        strengths.push('technical');
      }
      
      // Check for social modules
      const socialModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('social') || m.moduleId.includes('community')
      );
      
      if (socialModules.length > 0 && this.getAverageCompletion(socialModules) > 70) {
        strengths.push('social');
      }
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
    
    // Example implementation - would be more sophisticated in practice
    
    // Check physical training progress
    if (!userProgress.physicalTraining || userProgress.physicalTraining.overallProgress < 50) {
      challenges.push('physical');
    }
    
    // Check module progress for different types
    if (userProgress.moduleProgress && userProgress.moduleProgress.length > 0) {
      // Check for technical modules
      const technicalModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('tech') || m.moduleId.includes('technical')
      );
      
      if (technicalModules.length === 0 || this.getAverageCompletion(technicalModules) < 50) {
        challenges.push('technical');
      }
      
      // Check for social modules
      const socialModules = userProgress.moduleProgress.filter(m => 
        m.moduleId.includes('social') || m.moduleId.includes('community')
      );
      
      if (socialModules.length === 0 || this.getAverageCompletion(socialModules) < 50) {
        challenges.push('social');
      }
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
  
  /**
   * Capitalize first letter of a string
   * @param {String} string - Input string
   * @returns {String} Capitalized string
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
  
  /**
   * Explain countdown system to user
   * @param {String} userId - User ID
   * @returns {Promise<String>} Explanation text
   */
  async generateCountdownExplanation(userId) {
    try {
      // Get user progress
      const userProgress = await UserProgress.findOne({ userId });
      const currentCountdown = userProgress?.spaceReadiness?.countdown || this.config.baseCountdown;
      const startingCountdown = this.config.baseCountdown;
      
      // Calculate progress
      const secondsReduced = startingCountdown - currentCountdown;
      const percentComplete = (secondsReduced / startingCountdown * 100).toFixed(1);
      
      // Get next milestone
      const nextMilestone = this.getNextCountdownMilestone(currentCountdown);
      const formattedCountdown = this.formatCountdown(currentCountdown);
      
      return `
        Your Space Readiness Countdown tracks your journey to becoming fully prepared for space operations.
        
        Starting at ${this.formatCountdownDuration(startingCountdown)} (4 years), you've reduced it by ${this.formatCountdownDuration(secondsReduced)} so far - that's ${percentComplete}% of the way to space readiness!
        
        Current countdown: ${formattedCountdown.display.long}
        
        Your next milestone is "${nextMilestone.label}" in ${nextMilestone.formattedTimeRemaining}.
        
        Different activities reduce your countdown at different rates:
        - Completing missions: ~18 days each
        - Assessments: ~3 days each
        - Exercise sessions: ~1 day each
        - Special challenges: 12-36 days each
        
        Real-time training acceleration:
        - Active training: 10x normal rate
        - Assessment taking: 5x normal rate
        - Mission focus: 7x normal rate
        
        Consistency creates a compounding effect, with consecutive training days providing bonus reductions.
        
        Focus on completing missions and special challenges to accelerate your countdown most effectively.
      `;
    } catch (error) {
      console.error('Error generating countdown explanation:', error);
      return `
        The Space Readiness Countdown represents your journey to becoming fully prepared for space operations.
        
        Starting at 4 years, your training activities reduce this countdown at different rates, with real-time acceleration during active training.
        
        Focus on completing training missions and special challenges to accelerate your countdown most effectively.
      `;
    }
  }
}

module.exports = StellaCountdownService;