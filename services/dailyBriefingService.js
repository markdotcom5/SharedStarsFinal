// services/dailyBriefingService.js
const mongoose = require('mongoose');
const { DailyBriefing, UserBriefingPreference, BriefingDelivery } = require('../models/DailyBriefing');
const User = require('../models/User');
const STELLA_AI = require('./STELLA_AI');
const emailService = require('./emailService');
const notificationService = require('./notificationService');
const logger = require('../utils/logger');

/**
 * Daily Briefing Service
 * Handles generation, delivery, and management of Daily Presidential Space Briefings
 */
class DailyBriefingService {
  /**
   * Generate a new daily briefing
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} The generated briefing
   */
  async generateDailyBriefing(options = {}) {
    try {
      const { 
        alertStatus = 'GREEN',
        overrideExisting = false,
        draftMode = false
      } = options;
      
      logger.info('Generating daily briefing', { alertStatus, draftMode });
      
      // Check if a briefing already exists for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingBriefing = await DailyBriefing.findOne({
        date: { $gte: today },
        active: true
      });
      
      if (existingBriefing && !overrideExisting) {
        logger.info('Briefing already exists for today', { briefingId: existingBriefing._id });
        return existingBriefing;
      }
      
      // Generate the briefing content using STELLA AI
      const generatedContent = await STELLA_AI.generateDailyBriefing({ alertStatus });
      
      // Create new briefing document
      const newBriefing = new DailyBriefing({
        date: new Date(),
        title: generatedContent.title || 'DAILY PRESIDENTIAL SPACE BRIEFING',
        alertStatus,
        sections: generatedContent.sections,
        trainingDirective: generatedContent.trainingDirective,
        active: !draftMode,
        metaData: {
          wordCount: generatedContent.wordCount || this._estimateWordCount(generatedContent),
          topicTags: generatedContent.topicTags || [],
          readTimeMinutes: Math.ceil((generatedContent.wordCount || this._estimateWordCount(generatedContent)) / 200)
        }
      });
      
      await newBriefing.save();
      
      // If replacing existing briefing, mark it as inactive
      if (existingBriefing && overrideExisting) {
        existingBriefing.active = false;
        await existingBriefing.save();
      }
      
      logger.info('Successfully generated new briefing', { briefingId: newBriefing._id, draftMode });
      
      return newBriefing;
    } catch (error) {
      logger.error('Error generating daily briefing', { error: error.message, stack: error.stack });
      throw new Error('Failed to generate daily briefing: ' + error.message);
    }
  }
  
  /**
   * Deliver briefing to all subscribed users
   * @param {string} briefingId - ID of the briefing to deliver
   * @returns {Promise<Object>} Delivery statistics
   */
  async deliverBriefingToSubscribers(briefingId) {
    try {
      const briefing = await DailyBriefing.findById(briefingId);
      if (!briefing || !briefing.active) {
        throw new Error('Briefing not found or inactive');
      }
      
      logger.info('Starting briefing delivery', { briefingId });
      
      // Get all subscribed users
      const subscribers = await UserBriefingPreference.find({
        receiveBriefings: true
      }).populate('userId', 'email username');
      
      logger.info(`Found ${subscribers.length} subscribers for briefing delivery`);
      
      const deliveryStats = {
        total: subscribers.length,
        email: 0,
        inApp: 0,
        push: 0,
        errors: 0
      };
      
      // Process each subscriber
      for (const subscriber of subscribers) {
        try {
          const user = subscriber.userId;
          if (!user) continue;
          
          // Create delivery record
          const deliveryMethods = [];
          
          // Email delivery
          if ((subscriber.deliveryMethod === 'EMAIL' || subscriber.deliveryMethod === 'BOTH') && user.email) {
            try {
              await emailService.sendBriefingEmail(user.email, {
                briefingId: briefing._id,
                userId: user._id,
                title: briefing.title,
                alertStatus: briefing.alertStatus,
                date: briefing.date
              });
              
              deliveryMethods.push('EMAIL');
              deliveryStats.email++;
              
              // Create delivery record for email
              await BriefingDelivery.create({
                userId: user._id,
                briefingId: briefing._id,
                deliveryMethod: 'EMAIL',
                deliveryStatus: { status: 'DELIVERED' }
              });
            } catch (emailError) {
              logger.error('Error sending briefing email', { 
                userId: user._id, 
                email: user.email, 
                error: emailError.message 
              });
              
              // Record failed delivery
              await BriefingDelivery.create({
                userId: user._id,
                briefingId: briefing._id,
                deliveryMethod: 'EMAIL',
                deliveryStatus: { 
                  status: 'FAILED', 
                  errorMessage: emailError.message 
                }
              });
              
              deliveryStats.errors++;
            }
          }
          
          // In-app notification
          if (subscriber.deliveryMethod === 'IN_APP' || subscriber.deliveryMethod === 'BOTH') {
            try {
              await notificationService.createNotification({
                userId: user._id,
                type: 'BRIEFING',
                title: `🔒 ${briefing.alertStatus} ALERT: New Presidential Space Briefing`,
                message: 'Classified intelligence has been delivered to your dashboard.',
                data: { briefingId: briefing._id },
                priority: briefing.alertStatus === 'RED' ? 'HIGH' : 'NORMAL'
              });
              
              deliveryMethods.push('IN_APP');
              deliveryStats.inApp++;
              
              // Create delivery record for in-app
              await BriefingDelivery.create({
                userId: user._id,
                briefingId: briefing._id,
                deliveryMethod: 'IN_APP',
                deliveryStatus: { status: 'DELIVERED' }
              });
            } catch (notifError) {
              logger.error('Error creating in-app notification', { 
                userId: user._id, 
                error: notifError.message 
              });
              
              // Record failed delivery
              await BriefingDelivery.create({
                userId: user._id,
                briefingId: briefing._id,
                deliveryMethod: 'IN_APP',
                deliveryStatus: { 
                  status: 'FAILED', 
                  errorMessage: notifError.message 
                }
              });
              
              deliveryStats.errors++;
            }
          }
          
          // Push notification (if supported and enabled)
          if (subscriber.notificationsEnabled && notificationService.supportsPushNotifications()) {
            try {
              await notificationService.sendPushNotification({
                userId: user._id,
                title: `🔒 ALERT: Daily Presidential Space Briefing`,
                body: `${briefing.alertStatus} status update available in your secure dashboard.`,
                data: { briefingId: briefing._id }
              });
              
              deliveryMethods.push('PUSH');
              deliveryStats.push++;
            } catch (pushError) {
              logger.warn('Error sending push notification', {
                userId: user._id,
                error: pushError.message
              });
              // Don't count push notification failures in error stats
            }
          }
          
          logger.debug('Briefing delivered to user', { 
            userId: user._id, 
            methods: deliveryMethods.join(', ') 
          });
        } catch (subscriberError) {
          logger.error('Error processing subscriber', { 
            subscriberId: subscriber._id, 
            error: subscriberError.message 
          });
          deliveryStats.errors++;
        }
      }
      
      logger.info('Completed briefing delivery', { 
        briefingId, 
        totalSubscribers: deliveryStats.total,
        emailDeliveries: deliveryStats.email,
        inAppDeliveries: deliveryStats.inApp,
        pushNotifications: deliveryStats.push,
        errors: deliveryStats.errors
      });
      
      return deliveryStats;
    } catch (error) {
      logger.error('Error delivering briefing', { 
        briefingId, 
        error: error.message, 
        stack: error.stack 
      });
      throw new Error('Failed to deliver briefing: ' + error.message);
    }
  }
  
  /**
   * Get the most recent daily briefing, with personalization for the user
   * @param {string} userId - User ID for personalization
   * @returns {Promise<Object>} The latest briefing
   */
  async getLatestBriefing(userId) {
    try {
      // Get today's briefing or most recent one
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const briefing = await DailyBriefing.findOne({
        date: { $gte: today },
        active: true
      }).sort({ date: -1 });
      
      // If no briefing for today, get the most recent one
      const recentBriefing = briefing || await DailyBriefing.findOne({ 
        active: true 
      }).sort({ date: -1 });
      
      if (!recentBriefing) {
        logger.warn('No active briefings available');
        return null;
      }
      
      // Check if user has viewed this briefing
      const existingDelivery = await BriefingDelivery.findOne({
        userId,
        briefingId: recentBriefing._id,
        deliveryMethod: 'IN_APP'
      });
      
      // If not already tracked, record this view
      if (!existingDelivery || !existingDelivery.opened) {
        await BriefingDelivery.findOneAndUpdate(
          { userId, briefingId: recentBriefing._id, deliveryMethod: 'IN_APP' },
          { 
            $set: { 
              opened: true, 
              openedAt: new Date() 
            },
            $setOnInsert: {
              userId,
              briefingId: recentBriefing._id,
              deliveryMethod: 'IN_APP',
              deliveryStatus: { status: 'DELIVERED' }
            }
          },
          { upsert: true, new: true }
        );
        
        // Update last viewed briefing
        await UserBriefingPreference.findOneAndUpdate(
          { userId },
          { 
            $set: { 
              lastViewedBriefing: recentBriefing._id, 
              updatedAt: new Date() 
            } 
          },
          { upsert: true }
        );
      }
      
      // Get personalized briefing for user if possible
      let personalizedBriefing = recentBriefing.toObject();
      
      try {
        // Get user-specific training directive
        const userDirective = await this._getPersonalizedTrainingDirective(userId);
        if (userDirective) {
          personalizedBriefing.trainingDirective = userDirective;
        }
      } catch (error) {
        logger.warn('Error personalizing briefing', { 
          userId, 
          briefingId: recentBriefing._id, 
          error: error.message 
        });
        // Continue with generic briefing
      }
      
      return {
        briefing: personalizedBriefing,
        isLatest: briefing !== null, // true if this is today's briefing
        viewed: existingDelivery?.opened || false
      };
    } catch (error) {
      logger.error('Error fetching latest briefing', { 
        userId, 
        error: error.message 
      });
      throw new Error('Failed to fetch latest briefing: ' + error.message);
    }
  }
  
  /**
   * Get user's briefing history
   * @param {string} userId - User ID
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Briefing history with pagination
   */
  async getUserBriefingHistory(userId, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      
      // Get briefings the user has viewed
      const deliveries = await BriefingDelivery.find({ 
        userId, 
        opened: true 
      })
      .sort({ openedAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('briefingId');
      
      // Extract and format the briefings
      const briefings = deliveries.map(delivery => {
        if (!delivery.briefingId) return null;
        
        return {
          _id: delivery.briefingId._id,
          title: delivery.briefingId.title,
          date: delivery.briefingId.date,
          alertStatus: delivery.briefingId.alertStatus,
          viewedAt: delivery.openedAt,
          deliveryMethod: delivery.deliveryMethod,
          engagementMetrics: delivery.engagementMetrics || {}
        };
      }).filter(Boolean); // Remove null entries
      
      // Get total count for pagination
      const totalBriefings = await BriefingDelivery.countDocuments({ 
        userId, 
        opened: true 
      });
      
      return {
        briefings,
        pagination: {
          total: totalBriefings,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(totalBriefings / parseInt(limit))
        }
      };
    } catch (error) {
      logger.error('Error fetching user briefing history', { 
        userId, 
        error: error.message 
      });
      throw new Error('Failed to fetch briefing history: ' + error.message);
    }
  }
  
  /**
   * Update user's briefing preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - New preferences
   * @returns {Promise<Object>} Updated preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }
      
      // Validate email if provided and needed
      if ((preferences.deliveryMethod === 'EMAIL' || preferences.deliveryMethod === 'BOTH') && 
          preferences.email && user.email !== preferences.email) {
        // Validate email format
        if (!this._validateEmail(preferences.email)) {
          throw new Error('Invalid email format');
        }
        
        // Update user's email
        user.email = preferences.email;
        await user.save();
        
        logger.info('Updated user email for briefing delivery', { 
          userId, 
          email: preferences.email 
        });
      }
      
      // Construct update object with only provided fields
      const updateData = { updatedAt: new Date() };
      
      if (preferences.receiveBriefings !== undefined) updateData.receiveBriefings = preferences.receiveBriefings;
      if (preferences.deliveryMethod) updateData.deliveryMethod = preferences.deliveryMethod;
      if (preferences.preferredTime) updateData.preferredTime = preferences.preferredTime;
      if (preferences.timezone) updateData.preferredTimezone = preferences.timezone;
      if (preferences.notificationsEnabled !== undefined) updateData.notificationsEnabled = preferences.notificationsEnabled;
      
      // Handle content preferences if provided
      if (preferences.contentPreferences) {
        if (preferences.contentPreferences.strategicDevelopments !== undefined) {
          updateData['contentPreferences.strategicDevelopments'] = preferences.contentPreferences.strategicDevelopments;
        }
        if (preferences.contentPreferences.astronomicalPhenomena !== undefined) {
          updateData['contentPreferences.astronomicalPhenomena'] = preferences.contentPreferences.astronomicalPhenomena;
        }
        if (preferences.contentPreferences.technologicalBreakthroughs !== undefined) {
          updateData['contentPreferences.technologicalBreakthroughs'] = preferences.contentPreferences.technologicalBreakthroughs;
        }
        if (preferences.contentPreferences.trainingDirectives !== undefined) {
          updateData['contentPreferences.trainingDirectives'] = preferences.contentPreferences.trainingDirectives;
        }
      }
      
      // Update preferences
      const updatedPreferences = await UserBriefingPreference.findOneAndUpdate(
        { userId },
        { $set: updateData },
        { upsert: true, new: true }
      );
      
      logger.info('Updated user briefing preferences', { userId });
      
      return updatedPreferences;
    } catch (error) {
      logger.error('Error updating user preferences', { 
        userId, 
        error: error.message 
      });
      throw new Error('Failed to update preferences: ' + error.message);
    }
  }
  
  /**
   * Record user engagement with a briefing
   * @param {string} userId - User ID
   * @param {string} briefingId - Briefing ID
   * @param {Object} engagementData - Engagement metrics
   * @returns {Promise<Object>} Updated delivery record
   */
  async recordBriefingEngagement(userId, briefingId, engagementData) {
    try {
      const { 
        timeSpentSeconds, 
        sectionsExpanded, 
        trainingDirectiveClicked,
        sharedBriefing
      } = engagementData;
      
      // Find delivery record
      const delivery = await BriefingDelivery.findOne({
        userId,
        briefingId
      });
      
      if (!delivery) {
        throw new Error('Briefing delivery record not found');
      }
      
      // Update engagement metrics
      delivery.engagementMetrics = {
        ...delivery.engagementMetrics,
        timeSpentSeconds,
        sectionsExpanded,
        trainingDirectiveClicked,
        sharedBriefing
      };
      
      // Ensure opened is set
      delivery.opened = true;
      if (!delivery.openedAt) {
        delivery.openedAt = new Date();
      }
      
      await delivery.save();
      
      // If user clicked the training directive, record for personalization
      if (trainingDirectiveClicked) {
        const briefing = await DailyBriefing.findById(briefingId);
        if (briefing?.trainingDirective?.relatedMissionId) {
          try {
            await STELLA_AI.recordTrainingInterest(userId, briefing.trainingDirective.relatedMissionId);
          } catch (error) {
            logger.warn('Error recording training interest', { 
              userId, 
              missionId: briefing.trainingDirective.relatedMissionId,
              error: error.message
            });
          }
        }
      }
      
      logger.info('Recorded briefing engagement', { 
        userId, 
        briefingId, 
        timeSpent: timeSpentSeconds,
        trainingClicked: trainingDirectiveClicked
      });
      
      return delivery;
    } catch (error) {
      logger.error('Error recording briefing engagement', { 
        userId, 
        briefingId, 
        error: error.message 
      });
      throw new Error('Failed to record engagement: ' + error.message);
    }
  }
  
  /**
   * Get briefing delivery statistics
   * @param {Object} options - Filter options
   * @returns {Promise<Object>} Delivery statistics
   */
  async getDeliveryStatistics(options = {}) {
    try {
      const { briefingId, days = 30 } = options;
      
      // Set date limit
      const dateLimit = new Date();
      dateLimit.setDate(dateLimit.getDate() - parseInt(days));
      
      // Prepare match condition
      const matchCondition = { 
        deliveredAt: { $gte: dateLimit }
      };
      
      if (briefingId) {
        matchCondition.briefingId = mongoose.Types.ObjectId(briefingId);
      }
      
      // Get overall stats
      const deliveryStats = await BriefingDelivery.aggregate([
        { $match: matchCondition },
        { $group: {
          _id: {
            briefingId: '$briefingId',
            deliveryMethod: '$deliveryMethod'
          },
          totalDelivered: { $sum: 1 },
          totalOpened: { $sum: { $cond: ['$opened', 1, 0] } },
          averageTimeSpent: { $avg: '$engagementMetrics.timeSpentSeconds' },
          trainingClicks: { $sum: { $cond: ['$engagementMetrics.trainingDirectiveClicked', 1, 0] } }
        }}
      ]);
      
      // Get daily stats if looking at all briefings
      let dailyStats = [];
      if (!briefingId) {
        dailyStats = await BriefingDelivery.aggregate([
          { $match: matchCondition },
          { $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$deliveredAt' } },
              method: '$deliveryMethod'
            },
            delivered: { $sum: 1 },
            opened: { $sum: { $cond: ['$opened', 1, 0] } }
          }},
          { $sort: { '_id.date': 1 } }
        ]);
      }
      
      // Format the results
      const formattedStats = {};
      
      for (const stat of deliveryStats) {
        const briefingIdStr = stat._id.briefingId.toString();
        const method = stat._id.deliveryMethod;
        
        if (!formattedStats[briefingIdStr]) {
          formattedStats[briefingIdStr] = {
            methods: {}
          };
        }
        
        formattedStats[briefingIdStr].methods[method] = {
          delivered: stat.totalDelivered,
          opened: stat.totalOpened,
          openRate: stat.totalDelivered > 0 ? (stat.totalOpened / stat.totalDelivered * 100).toFixed(2) + '%' : '0%',
          averageTimeSpent: Math.round(stat.averageTimeSpent || 0),
          trainingClicks: stat.trainingClicks,
          trainingClickRate: stat.totalOpened > 0 ? (stat.trainingClicks / stat.totalOpened * 100).toFixed(2) + '%' : '0%'
        };
      }
      
      return {
        stats: formattedStats,
        dailyStats: briefingId ? null : dailyStats,
        period: `${days} days`
      };
    } catch (error) {
      logger.error('Error fetching delivery statistics', { 
        error: error.message 
      });
      throw new Error('Failed to fetch delivery statistics: ' + error.message);
    }
  }
  
  /**
   * Schedule the generation and delivery of daily briefings
   * Typically called by a cron job scheduler
   * @returns {Promise<Object>} Result of the scheduled operation
   */
  async scheduleDailyBriefing() {
    try {
      logger.info('Scheduled daily briefing generation started');
      
      // Generate new briefing
      const briefing = await this.generateDailyBriefing({
        alertStatus: this._determineAlertStatus(),
        overrideExisting: false,
        draftMode: false
      });
      
      // Deliver to subscribers
      const deliveryStats = await this.deliverBriefingToSubscribers(briefing._id);
      
      logger.info('Scheduled daily briefing completed', {
        briefingId: briefing._id,
        deliveryStats
      });
      
      return {
        success: true,
        briefingId: briefing._id,
        deliveryStats
      };
    } catch (error) {
      logger.error('Error in scheduled daily briefing', { 
        error: error.message, 
        stack: error.stack 
      });
      
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * Clean up old delivery records to manage database size
   * @param {number} daysToKeep - Days of records to retain
   * @returns {Promise<number>} Number of records removed
   */
  async cleanupOldDeliveryRecords(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const result = await BriefingDelivery.deleteMany({
        deliveredAt: { $lt: cutoffDate },
        opened: true // Only delete records that have been opened
      });
      
      logger.info(`Cleaned up old delivery records`, {
        recordsRemoved: result.deletedCount,
        olderThan: cutoffDate
      });
      
      return result.deletedCount;
    } catch (error) {
      logger.error('Error cleaning up old delivery records', { 
        error: error.message 
      });
      throw new Error('Failed to clean up old records: ' + error.message);
    }
  }
  
  /**
   * PRIVATE METHODS
   */
  
  /**
   * Get personalized training directive for a user
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Personalized directive or null
   * @private
   */
  async _getPersonalizedTrainingDirective(userId) {
    try {
      // Get user progress from STELLA AI
      const userProgress = await STELLA_AI.getUserTrainingProgress(userId);
      
      // Exit early if no training data
      if (!userProgress || !userProgress.missions || userProgress.missions.length === 0) {
        return null;
      }
      
      // Find mission with lowest progress that's not complete
      const incompleteMissions = userProgress.missions
        .filter(mission => mission.progress < 100)
        .sort((a, b) => a.progress - b.progress);
      
      if (incompleteMissions.length === 0) {
        // All missions completed, recommend advanced training
        return {
          content: "Congratulations on completing all basic training missions! Focus on maintaining your skills with advanced training scenarios and specialized microgravity adaptations.",
          relatedMissionId: null,
          exerciseIds: []
        };
      }
      
      // Get the mission with lowest progress
      const targetMission = incompleteMissions[0];
      
      // Get personalized recommendations
      const recommendations = await STELLA_AI.getPersonalizedRecommendations(userId, targetMission.id);
      
      // Get interesting exercises
      const exerciseIds = recommendations.exercises?.map(ex => ex.id) || [];
      
      return {
        content: `Focus on ${targetMission.name} (${targetMission.progress}% complete). ${recommendations.advice || 'Prioritize exercises that challenge your current capabilities.'}`,
        relatedMissionId: targetMission.id,
        exerciseIds
      };
    } catch (error) {
      logger.warn('Error generating personalized directive', { 
        userId, 
        error: error.message 
      });
      return null;
    }
  }
  
  /**
   * Determine daily alert status based on various factors
   * @returns {string} Alert status (GREEN, AMBER, RED)
   * @private
   */
  _determineAlertStatus() {
    // In a real implementation, this might consider:
    // - Space weather forecasts
    // - Scheduled launches or EVAs
    // - Current geopolitical space events
    // - Upcoming astronomical events
    
    // For demo purposes, mostly return GREEN with occasional AMBER or rare RED
    const randomValue = Math.random();
    if (randomValue > 0.95) {
      return 'RED';
    } else if (randomValue > 0.8) {
      return 'AMBER';
    } else {
      return 'GREEN';
    }
  }
  
  /**
   * Estimate word count from briefing content
   * @param {Object} content - Generated content
   * @returns {number} Estimated word count
   * @private
   */
  _estimateWordCount(content) {
    let totalWords = 0;
    
    // Count words in sections
    if (content.sections && Array.isArray(content.sections)) {
      content.sections.forEach(section => {
        if (section.title) {
          totalWords += section.title.split(/\s+/).length;
        }
        if (section.content) {
          totalWords += section.content.split(/\s+/).length;
        }
      });
    }
    
    // Count words in training directive
    if (content.trainingDirective && content.trainingDirective.content) {
      totalWords += content.trainingDirective.content.split(/\s+/).length;
    }
    
    return totalWords;
  }
  
  /**
   * Validate email format
   * @param {string} email - Email to validate
   * @returns {boolean} Whether email is valid
   * @private
   */
  _validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Create singleton instance
const dailyBriefingService = new DailyBriefingService();

module.exports = dailyBriefingService;