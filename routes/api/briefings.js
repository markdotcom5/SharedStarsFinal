// routes/api/briefings.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { authenticate } = require('../../middleware/authenticate');
const { DailyBriefing, UserBriefingPreference, BriefingDelivery } = require('../../models/DailyBriefing');
const User = require('../../models/User');
const STELLA_AI = require('../../services/STELLA_AI');
const emailService = require('../../services/emailService');
const { validateEmail } = require('../../utils/validators');

/**
 * GET /api/briefings/daily
 * Get the most recent daily briefing
 */
router.get('/daily', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user?.id;
    
    // Get today's briefing (or the most recent one)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const briefing = await DailyBriefing.findOne({
      date: { $gte: today },
      active: true
    }).sort({ date: -1 });
    
    // If no briefing for today, get the most recent one
    const recentBriefing = briefing || await DailyBriefing.findOne({ active: true }).sort({ date: -1 });
    
    if (!recentBriefing) {
      return res.status(404).json({ 
        success: false, 
        message: 'No briefings available at this time' 
      });
    }
    
    // Record that the user viewed this briefing
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
    
    // Update the user's last viewed briefing
    await UserBriefingPreference.findOneAndUpdate(
      { userId },
      { $set: { lastViewedBriefing: recentBriefing._id, updatedAt: new Date() } },
      { upsert: true }
    );
    
    // Return the briefing with personalized training directive if applicable
    let personalizedBriefing = recentBriefing.toObject();
    
    // Check if user has progress data to personalize the training directive
    try {
      const userSpecificDirective = await STELLA_AI.getPersonalizedTrainingDirective(userId);
      if (userSpecificDirective) {
        personalizedBriefing.trainingDirective.content = userSpecificDirective.content;
        personalizedBriefing.trainingDirective.relatedMissionId = userSpecificDirective.missionId;
      }
    } catch (error) {
      console.warn('Error generating personalized training directive:', error);
      // Continue with generic directive
    }
    
    res.json({
      success: true,
      briefing: personalizedBriefing,
      isLatest: briefing !== null
    });
  } catch (error) {
    console.error('Error fetching daily briefing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/briefings/history
 * Get user's briefing history
 */
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user?.id;
    const { page = 1, limit = 10 } = req.query;
    
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
      return {
        ...delivery.briefingId.toObject(),
        viewedAt: delivery.openedAt,
        deliveryMethod: delivery.deliveryMethod
      };
    });
    
    // Get total count for pagination
    const totalBriefings = await BriefingDelivery.countDocuments({ 
      userId, 
      opened: true 
    });
    
    res.json({
      success: true,
      briefings,
      pagination: {
        total: totalBriefings,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalBriefings / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching briefing history:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/briefings/subscribe
 * Subscribe to daily briefings
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user?.id;
    const { 
      receiveBriefings = true, 
      deliveryMethod = 'BOTH',
      email,
      preferredTime = '06:00',
      timezone = 'UTC'
    } = req.body;
    
    // Validate email if provided and delivery method requires it
    if ((deliveryMethod === 'EMAIL' || deliveryMethod === 'BOTH') && email) {
      if (!validateEmail(email)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid email address' 
        });
      }
      
      // Update user's email if needed
      const user = await User.findById(userId);
      if (user && (!user.email || user.email !== email)) {
        user.email = email;
        await user.save();
      }
    }
    
    // Update or create user preferences
    const preferences = await UserBriefingPreference.findOneAndUpdate(
      { userId },
      { 
        $set: { 
          receiveBriefings,
          deliveryMethod,
          preferredTime,
          preferredTimezone: timezone,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    // Send a confirmation email if email delivery is enabled
    if ((deliveryMethod === 'EMAIL' || deliveryMethod === 'BOTH') && email) {
      try {
        await emailService.sendBriefingSubscriptionConfirmation(email, {
          preferredTime,
          timezone
        });
      } catch (emailError) {
        console.warn('Error sending confirmation email:', emailError);
        // Continue despite email error
      }
    }
    
    res.json({
      success: true,
      message: 'Successfully subscribed to Daily Presidential Space Briefings',
      preferences
    });
  } catch (error) {
    console.error('Error subscribing to briefings:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * PUT /api/briefings/preferences
 * Update briefing preferences
 */
router.put('/preferences', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user?.id;
    const { 
      receiveBriefings,
      deliveryMethod,
      preferredTime,
      timezone,
      notificationsEnabled,
      contentPreferences
    } = req.body;
    
    // Construct update object with only provided fields
    const updateData = { updatedAt: new Date() };
    if (receiveBriefings !== undefined) updateData.receiveBriefings = receiveBriefings;
    if (deliveryMethod) updateData.deliveryMethod = deliveryMethod;
    if (preferredTime) updateData.preferredTime = preferredTime;
    if (timezone) updateData.preferredTimezone = timezone;
    if (notificationsEnabled !== undefined) updateData.notificationsEnabled = notificationsEnabled;
    
    // Handle content preferences if provided
    if (contentPreferences) {
      if (contentPreferences.strategicDevelopments !== undefined) {
        updateData['contentPreferences.strategicDevelopments'] = contentPreferences.strategicDevelopments;
      }
      if (contentPreferences.astronomicalPhenomena !== undefined) {
        updateData['contentPreferences.astronomicalPhenomena'] = contentPreferences.astronomicalPhenomena;
      }
      if (contentPreferences.technologicalBreakthroughs !== undefined) {
        updateData['contentPreferences.technologicalBreakthroughs'] = contentPreferences.technologicalBreakthroughs;
      }
      if (contentPreferences.trainingDirectives !== undefined) {
        updateData['contentPreferences.trainingDirectives'] = contentPreferences.trainingDirectives;
      }
    }
    
    // Update preferences
    const preferences = await UserBriefingPreference.findOneAndUpdate(
      { userId },
      { $set: updateData },
      { upsert: true, new: true }
    );
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Error updating briefing preferences:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /api/briefings/engagement
 * Record user engagement with a briefing
 */
router.post('/engagement', authenticate, async (req, res) => {
  try {
    const userId = req.user?._id || req.session.user?.id;
    const { 
      briefingId, 
      timeSpentSeconds, 
      sectionsExpanded, 
      trainingDirectiveClicked,
      sharedBriefing
    } = req.body;
    
    // Validate briefing exists
    const briefing = await DailyBriefing.findById(briefingId);
    if (!briefing) {
      return res.status(404).json({ success: false, error: 'Briefing not found' });
    }
    
    // Update engagement metrics
    await BriefingDelivery.findOneAndUpdate(
      { userId, briefingId },
      {
        $set: {
          'engagementMetrics.timeSpentSeconds': timeSpentSeconds,
          'engagementMetrics.sectionsExpanded': sectionsExpanded,
          'engagementMetrics.trainingDirectiveClicked': trainingDirectiveClicked,
          'engagementMetrics.sharedBriefing': sharedBriefing
        }
      }
    );
    
    // If user clicked the training directive, record that for personalization
    if (trainingDirectiveClicked && briefing.trainingDirective.relatedMissionId) {
      try {
        await STELLA_AI.recordTrainingInterest(userId, briefing.trainingDirective.relatedMissionId);
      } catch (error) {
        console.warn('Error recording training interest:', error);
        // Continue despite error
      }
    }
    
    res.json({
      success: true,
      message: 'Engagement recorded'
    });
  } catch (error) {
    console.error('Error recording briefing engagement:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * ADMIN ENDPOINTS
 * These endpoints are for admin use only and should be protected accordingly
 */

/**
 * POST /api/briefings/generate
 * Generate a new daily briefing
 * Admin only endpoint
 */
router.post('/generate', authenticate, async (req, res) => {
  // Ensure user has admin privileges
  if (!req.user?.isAdmin && !req.session.user?.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const { 
      alertStatus = 'GREEN',
      overrideContent = false,
      draftMode = false
    } = req.body;
    
    // Check if a briefing already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingBriefing = await DailyBriefing.findOne({
      date: { $gte: today },
      active: true
    });
    
    if (existingBriefing && !overrideContent) {
      return res.status(400).json({ 
        success: false, 
        error: 'A briefing already exists for today. Use overrideContent=true to replace it.',
        existingBriefingId: existingBriefing._id
      });
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
        wordCount: generatedContent.wordCount,
        topicTags: generatedContent.topicTags,
        readTimeMinutes: Math.ceil(generatedContent.wordCount / 200) // Approx. reading time
      }
    });
    
    await newBriefing.save();
    
    // If replacing existing briefing, mark it as inactive
    if (existingBriefing && overrideContent) {
      existingBriefing.active = false;
      await existingBriefing.save();
    }
    
    // Queue email delivery if not in draft mode
    if (!draftMode) {
      // This will be handled by a scheduled job, but trigger it manually for immediacy
      const emailService = require('../../services/emailService');
      emailService.queueBriefingDelivery(newBriefing._id);
    }
    
    res.json({
      success: true,
      message: draftMode ? 'Briefing draft created' : 'Briefing generated and will be delivered',
      briefingId: newBriefing._id,
      briefing: newBriefing
    });
  } catch (error) {
    console.error('Error generating briefing:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /api/briefings/delivery-stats
 * Get briefing delivery statistics
 * Admin only endpoint
 */
router.get('/delivery-stats', authenticate, async (req, res) => {
  // Ensure user has admin privileges
  if (!req.user?.isAdmin && !req.session.user?.isAdmin) {
    return res.status(403).json({ success: false, error: 'Unauthorized' });
  }
  
  try {
    const { briefingId, days = 30 } = req.query;
    
    // Set date limit
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - parseInt(days));
    
    // Prepare match condition
    const matchCondition = { deliveredAt: { $gte: dateLimit } };
    if (briefingId) matchCondition.briefingId = mongoose.Types.ObjectId(briefingId);
    
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
    deliveryStats.forEach(stat => {
      const briefingId = stat._id.briefingId.toString();
      const method = stat._id.deliveryMethod;
      
      if (!formattedStats[briefingId]) {
        formattedStats[briefingId] = {
          methods: {}
        };
      }
      
      formattedStats[briefingId].methods[method] = {
        delivered: stat.totalDelivered,
        opened: stat.totalOpened,
        openRate: (stat.totalOpened / stat.totalDelivered * 100).toFixed(2) + '%',
        averageTimeSpent: Math.round(stat.averageTimeSpent || 0),
        trainingClicks: stat.trainingClicks,
        trainingClickRate: (stat.trainingClicks / stat.totalOpened * 100).toFixed(2) + '%'
      };
    });
    
    res.json({
      success: true,
      stats: formattedStats,
      dailyStats: briefingId ? null : dailyStats,
      period: `${days} days`
    });
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;