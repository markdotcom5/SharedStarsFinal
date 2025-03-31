// routes/api/stella-qa.js
const express = require('express');
const router = express.Router();

// Test endpoint - make sure this works first
router.get('/test', (req, res) => {
  res.json({ message: "STELLA API is working" });
});

// Main question endpoint - simplified version
router.post('/ask', (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ 
        success: false, 
        error: "Question is required" 
      });
    }
    
    // Simple hardcoded response for testing
    res.json({
      success: true,
      response: {
        message: `You asked: "${question}"`,
        messageId: "test123",
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: "An error occurred"
    });
  }
});
/**
 * STELLA system status
 */
router.get('/status', (req, res) => {
  const isOpenAIAvailable = !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "MISSING_KEY";
  
  res.json({
    success: true,
    status: {
      online: true,
      openai: isOpenAIAvailable ? 'available' : 'unavailable',
      version: '1.0',
      timestamp: new Date().toISOString()
    }
  });
});
/**
 * Get conversation statistics for a user
 */
router.get('/statistics/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId || userId === 'undefined') {
      return res.status(400).json({
        success: false,
        error: 'Valid userId is required'
      });
    }
    
    // For simplified version, return basic stats
    res.json({
      success: true,
      statistics: {
        totalMessages: 0,
        userMessages: 0,
        stellaMessages: 0,
        contextDistribution: [],
        dailyActivity: []
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch statistics: ' + error.message
    });
  }
});
module.exports = router;