// routes/training/physical/mission1.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/authenticate');
const physicalTrainingService = require('../../../services/physicalTrainingService');

/**
 * GET /
 * Redirect to the static HTML file
 */
const path = require('path');

router.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission1-core-balance.html'));
});

/**
 * POST /start
 * Start a training session
 */
router.post('/start', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.session.user.id;
    const missionId = 'core-balance-foundation';
    
    const session = await physicalTrainingService.startTrainingSession(userId, missionId);
    res.json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    console.error('Error starting mission 1:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /progress
 * Update mission progress
 */
router.post('/progress', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.session.user.id;
    const { sessionId, progressData } = req.body;
    const missionId = 'core-balance-foundation';
    
    await physicalTrainingService.updateTrainingProgress(
      userId, missionId, sessionId, progressData
    );
    
    const stellaFeedback = {
      message: "I notice your core engagement has improved by 15% since your last session.",
      corrections: [
        "Try maintaining a neutral spine during the plank exercise",
        "Engage your core slightly more during balance drills"
      ],
      recommendations: [
        "Consider increasing plank hold time by 10 seconds next session",
        "Add single-leg balance variations to increase difficulty"
      ]
    };
    
    res.json({ success: true, feedback: stellaFeedback });
  } catch (error) {
    console.error('Error updating mission 1 progress:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /complete
 * Complete the mission
 */
router.post('/complete', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.session.user.id;
    const { sessionId, performanceData } = req.body;
    const missionId = 'core-balance-foundation';
    
    const results = await physicalTrainingService.completeMission(
      userId, missionId, sessionId, performanceData
    );
    
    const credits = await physicalTrainingService.calculateCredits(
      userId, missionId, performanceData
    );
    
    await physicalTrainingService.updateLeaderboard(
      userId, missionId, performanceData
    );
    
    res.json({ 
      success: true, 
      results,
      credits,
      unlockedContent: {
        nextMission: 'endurance-boost',
        achievements: ['Core Foundation Master']
      }
    });
  } catch (error) {
    console.error('Error completing mission 1:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Additional API endpoints for STELLA integration
router.post('/metrics', authenticate, async (req, res) => {
  // Handle real-time metrics updates
  try {
    const { metrics } = req.body;
    const userId = req.user._id || req.session.user.id;
    
    // Process with STELLA and return feedback
    res.json({
      success: true,
      feedback: {
        message: "Keep your core engaged. Your form is improving.",
        corrections: ["Maintain neutral spine", "Breathe steadily"]
      }
    });
  } catch (error) {
    console.error('Error processing metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;