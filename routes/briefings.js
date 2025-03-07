const express = require('express');
const router = express.Router();
const { DailyBriefing } = require('../models/DailyBriefing');
const dailyBriefingService = require('../services/dailyBriefingService');
const authMiddleware = require('../middleware/authenticate');

// Get today's briefing
router.get('/today', authMiddleware, async (req, res) => {
  try {
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find today's briefing
    let briefing = await DailyBriefing.findOne({
      date: { $gte: today }
    });
    
    // If no briefing exists yet, generate one
    if (!briefing) {
      briefing = await dailyBriefingService.generateTodaysBriefing();
      
      if (!briefing) {
        return res.status(404).json({ success: false, message: "Today's briefing is not available yet" });
      }
    }
    
    // Record that user viewed this briefing
    await DailyBriefing.updateOne(
      { _id: briefing._id },
      { $addToSet: { viewers: req.user.id } }
    );
    
    res.json({ success: true, briefing });
  } catch (error) {
    console.error('Error fetching briefing:', error);
    res.status(500).json({ success: false, message: "Error fetching today's briefing" });
  }
});

// Get user's briefing preferences
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    // Get user preferences from user model
    const user = await User.findById(req.user.id).select('preferences.receiveBriefings preferences.briefingTime preferences.briefingTimezone');
    
    res.json({ 
      success: true, 
      preferences: {
        receiveBriefings: user.preferences?.receiveBriefings || false,
        briefingTime: user.preferences?.briefingTime || '06:00',
        briefingTimezone: user.preferences?.briefingTimezone || 'UTC'
      }
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ success: false, message: "Error fetching briefing preferences" });
  }
});

// Update briefing preferences
router.post('/preferences', authMiddleware, async (req, res) => {
  try {
    const { receiveBriefings, briefingTime, briefingTimezone } = req.body;
    
    // Update user preferences
    await User.updateOne(
      { _id: req.user.id },
      { 
        $set: { 
          'preferences.receiveBriefings': !!receiveBriefings,
          'preferences.briefingTime': briefingTime || '06:00',
          'preferences.briefingTimezone': briefingTimezone || 'UTC'
        } 
      }
    );
    
    // If user just subscribed, send confirmation email
    if (receiveBriefings) {
      const user = await User.findById(req.user.id);
      await emailService.sendBriefingSubscriptionConfirmation(user.email, {
        preferredTime: briefingTime || '06:00',
        timezone: briefingTimezone || 'UTC'
      });
    }
    
    res.json({ success: true, message: "Preferences updated successfully" });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ success: false, message: "Error updating briefing preferences" });
  }
});

module.exports = router;