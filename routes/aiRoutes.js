const express = require('express');
const router = express.Router();
const { createChatCompletion } = require('../services/openaiService');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger') || console;

/**
 * Enhanced AI processing endpoint
 * Processes requests through various AI subsystems
 */
router.post('/process', authenticate, async (req, res) => {
  try {
    const { context, query } = req.body;
    
    if (!context || !query) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    let response;
    
    // Handle space/physical training questions using centralized OpenAI service
    if (context.moduleType === 'physical' || context.trainingType === 'space') {
      try {
        response = await createChatCompletion([
          { role: "system", content: "Context for physical or space training scenario." },
          { role: "user", content: context.question || query }
        ]);
        
        return res.json({
          success: true,
          data: response.choices[0].message.content,
          source: 'ai',
          context: context
        });
      } catch (error) {
        logger.error("OpenAI chat completion error:", error);
        return res.status(500).json({ error: 'AI processing error', details: error.message });
      }
    }
    
    // Default response if no specific handler matched
    return res.json({
      success: true,
      data: "I'll help you with that query.",
      source: 'default',
      context: context
    });
  } catch (error) {
    logger.error('AI processing error:', error);
    res.status(500).json({ error: 'AI processing error', details: error.message });
  }
});

module.exports = router;
