// services/CountdownService.js
const mongoose = require('mongoose');
const UserProgress = require('../models/UserProgress');
const UserCountdown = require('../models/UserCountdown');

class CountdownService {
  constructor() {
    // Base countdown value in days (4 years)
    this.baseCountdown = 1460;
    
    // Base reduction values for different activity types
    this.baseReductions = {
      mission_completion: 18,     // Days reduced for completing a full mission
      exercise_completion: 0.8,   // Days for individual exercise completion
      assessment_completion: 3.2, // Days for completing assessments
      daily_engagement: 0.4,      // Daily login and activity
      social_contribution: 1.5    // Community engagement
    };
  }
  
  /**
   * Calculate countdown for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Countdown data
   */
  async getCountdown(userId) {
    try {
      // Get existing countdown info or create new
      let countdownInfo = await UserCountdown.findOne({ userId });
      
      if (!countdownInfo) {
        // Create new countdown for user
        countdownInfo = await this.initializeCountdown(userId);
      }
      
      // Get user progress to calculate potential reductions
      const userProgress = await UserProgress.findOne({ userId });
      
      // Calculate potential acceleration opportunities
      const accelerationOpportunities = this.identifyAccelerationOpportunities(userProgress);
      
      return {
        daysRemaining: countdownInfo.daysRemaining,
        baselineDate: countdownInfo.baselineDate,
        projectedDate: this.calculateProjectedDate(countdownInfo.daysRemaining),
        reductionHistory: countdownInfo.reductionHistory.slice(-5), // Last 5 reductions
        totalReduction: countdownInfo.totalReduction,
        accelerationOpportunities,
        nextMilestone: this.calculateNextMilestone(countdownInfo.daysRemaining),
        progress: this.calculateOverallProgress(countdownInfo)
      };
    } catch (error) {
      console.error('Error getting countdown:', error);
      throw error;
    }
  }
  
  /**
   * Initialize countdown for a new user
   * @param {string} userId - User ID
   * @returns {Promise<Object>} New countdown info
   */
  async initializeCountdown(userId) {
    try {
      const baselineDate = new Date();
      const countdownInfo = new UserCountdown({
        userId,
        daysRemaining: this.baseCountdown,
        baselineDate,
        totalReduction: 0,
        reductionHistory: [{
          date: baselineDate,
          amount: 0,
          reason: 'Countdown initialized',
          type: 'initialization'
        }]
      });
      
      await countdownInfo.save();
      return countdownInfo;
    } catch (error) {
      console.error('Error initializing countdown:', error);
      throw error;
    }
  }
  
  /**
   * Calculate reduction for an activity
   * @param {Object} activityData - Activity data
   * @returns {number} Days reduced
   */
  calculateCountdownReduction(activityData) {
    // Base reduction values by activity type
    const baseReduction = this.baseReductions[activityData.type] || 0.1;
    
    // Performance multipliers (quality matters)
    const performanceMultiplier = 
      activityData.performance ? 
      Math.max(0.5, Math.min(2.0, activityData.performance / 50)) : 
      1.0;
    
    // Calculate reduction with performance multiplier
    let reduction = baseReduction * performanceMultiplier;
    
    // Apply mission difficulty multiplier if applicable
    if (activityData.missionId && activityData.difficulty) {
      const difficultyMultipliers = {
        beginner: 0.8,
        intermediate: 1.0,
        advanced: 1.3,
        expert: 1.8
      };
      reduction *= difficultyMultipliers[activityData.difficulty] || 1.0;
    }
    
    // Apply consistency bonus
    if (activityData.consistencyStreak > 3) {
      reduction *= (1 + (activityData.consistencyStreak * 0.03));
    }
    
    return reduction;
  }
  
  /**
   * Record activity and update countdown
   * @param {string} userId - User ID
   * @param {Object} activityData - Activity data
   * @returns {Promise<Object>} Updated countdown info
   */
  async recordActivity(userId, activityData) {
    try {
      // Calculate reduction for this activity
      const reduction = this.calculateCountdownReduction(activityData);
      
      // Get current countdown info
      let countdownInfo = await UserCountdown.findOne({ userId });
      if (!countdownInfo) {
        countdownInfo = await this.initializeCountdown(userId);
      }
      
      // Update countdown
      countdownInfo.daysRemaining -= reduction;
      countdownInfo.totalReduction += reduction;
      
      // Add to reduction history
      countdownInfo.reductionHistory.push({
        date: new Date(),
        amount: reduction,
        reason: activityData.description || `${activityData.type} completion`,
        type: activityData.type
      });
      
      // Save updated countdown
      await countdownInfo.save();
      
      return {
        daysRemaining: countdownInfo.daysRemaining,
        reduction,
        totalReduction: countdownInfo.totalReduction,
        projectedDate: this.calculateProjectedDate(countdownInfo.daysRemaining)
      };
    } catch (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  }
  
  /**
   * Calculate projected completion date based on days remaining
   * @param {number} daysRemaining - Days remaining
   * @returns {Date} Projected completion date
   */
  calculateProjectedDate(daysRemaining) {
    const projectedDate = new Date();
    projectedDate.setDate(projectedDate.getDate() + daysRemaining);
    return projectedDate;
  }
  
  /**
   * Calculate next milestone based on days remaining
   * @param {number} daysRemaining - Days remaining
   * @returns {Object} Next milestone info
   */
  calculateNextMilestone(daysRemaining) {
    const milestones = [
      { name: 'Space Ready', days: 0, description: 'Fully prepared for space missions' },
      { name: 'Mission Capable', days: 180, description: 'Basic mission readiness achieved' },
      { name: 'Advanced Training', days: 365, description: 'Ready for advanced training modules' },
      { name: 'Intermediate Training', days: 730, description: 'Completed basic training fundamentals' },
      { name: 'Training Initiated', days: 1095, description: 'Beginning the astronaut training journey' },
      { name: 'Starting Point', days: 1460, description: 'The start of your journey to space' }
    ];
    
    // Find next milestone
    for (const milestone of milestones) {
      if (daysRemaining >= milestone.days) {
        return {
          name: milestone.name,
          description: milestone.description,
          daysRemaining: daysRemaining - milestone.days,
          daysToMilestone: daysRemaining - milestone.days
        };
      }
    }
    
    // Default to first milestone
    return milestones[0];
  }
  
  /**
   * Calculate overall progress percentage
   * @param {Object} countdownInfo - Countdown info
   * @returns {number} Progress percentage
   */
  calculateOverallProgress(countdownInfo) {
    const totalProgress = (this.baseCountdown - countdownInfo.daysRemaining) / this.baseCountdown;
    return Math.min(100, Math.max(0, totalProgress * 100));
  }
  
  /**
   * Identify opportunities to accelerate countdown
   * @param {Object} userProgress - User progress data
   * @returns {Array} Acceleration opportunities
   */
  identifyAccelerationOpportunities(userProgress) {
    const opportunities = [];
    
    // No progress data available
    if (!userProgress) {
      return [
        {
          type: 'assessment',
          description: 'Complete initial assessment',
          potential: 'high',
          reduction: 5
        },
        {
          type: 'training',
          description: 'Start daily training routine',
          potential: 'medium',
          reduction: 3
        }
      ];
    }
    
    // Check for incomplete assessments
    if (!userProgress.completedAssessments || userProgress.completedAssessments < 3) {
      opportunities.push({
        type: 'assessment',
        description: 'Complete more skill assessments',
        potential: 'high',
        reduction: 5
      });
    }
    
    // Check training consistency
    if (!userProgress.consistentTraining) {
      opportunities.push({
        type: 'consistency',
        description: 'Train on consecutive days (3+ day streak)',
        potential: 'medium',
        reduction: 3
      });
    }
    
    // Check physical training
    if (!userProgress.physicalTraining || userProgress.physicalTraining.completedMissions < 3) {
      opportunities.push({
        type: 'physical',
        description: 'Complete more physical training modules',
        potential: 'high',
        reduction: 4
      });
    }
    
    // Check social engagement
    if (!userProgress.socialContributions || userProgress.socialContributions < 2) {
      opportunities.push({
        type: 'social',
        description: 'Engage with the community through contributions',
        potential: 'medium',
        reduction: 2
      });
    }
    
    return opportunities;
  }
}

module.exports = new CountdownService();