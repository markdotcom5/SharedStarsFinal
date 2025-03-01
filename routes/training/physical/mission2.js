// routes/training/physical/mission2.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../middleware/authenticate');
const physicalTrainingService = require('../../../services/physicalTrainingService');
const path = require('path');

/**
 * GET /
 * Serve the static HTML file for Endurance Boost
 */
router.get('/', authenticate, (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'training-modules', 'physical', 'mission2-endurance.html'));
});

/**
 * GET /data
 * Get endurance zones and mission data
 */
router.get('/data', authenticate, async (req, res) => {
  try {
    // Get endurance zones for the interface
    const enduranceZones = [
      { id: 'warmup', name: 'Warm-up Zone', duration: '5 min', targetHR: 120 },
      { id: 'aerobic', name: 'Aerobic Zone', duration: '15 min', targetHR: 140 },
      { id: 'threshold', name: 'Threshold Zone', duration: '5 min', targetHR: 160 },
      { id: 'cooldown', name: 'Cool-down Zone', duration: '5 min', targetHR: 110 }
    ];
    
    res.json({
      success: true,
      mission: {
        id: 'endurance-boost',
        name: 'Endurance Boost',
        description: 'Build cardiovascular fitness for extended space operations.'
      },
      enduranceZones
    });
  } catch (error) {
    console.error('Error loading mission 2 data:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /start
 * Start Endurance training session
 */
router.post('/start', authenticate, async (req, res) => {
  try {
    const userId = req.user._id || req.session.user.id;
    const missionId = 'endurance-boost';
    
    const session = await physicalTrainingService.startTrainingSession(userId, missionId);
    res.json({ success: true, sessionId: session.sessionId });
  } catch (error) {
    console.error('Error starting mission 2:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * POST /metrics
 * Process real-time endurance metrics
 */
router.post('/metrics', authenticate, async (req, res) => {
  try {
    const { sessionId, metrics } = req.body;
    const userId = req.user._id || req.session.user.id;
    
    // Process the metrics with STELLA
    const analysis = {
      message: "Your heart rate is responding well. Try to maintain this intensity for another 2 minutes.",
      insights: [
        {
          title: "Heart Rate Variability",
          description: "Your HRV shows improved recovery capacity compared to last session."
        },
        {
          title: "Oxygen Utilization",
          description: "Your O₂ saturation remains optimal throughout the session."
        },
        {
          title: "Zone Adherence",
          description: "You're staying within target zones effectively."
        }
      ]
    };
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error processing endurance metrics:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

/**
 * GET /metrics
 * Get current endurance metrics for STELLA interface
 */
router.get('/metrics', authenticate, async (req, res) => {
  try {
    // Generate simulated metrics for STELLA interface
    const metrics = {
      heartRate: Math.floor(120 + Math.random() * 40),
      o2Saturation: Math.floor(95 + Math.random() * 5),
      hrv: Math.floor(50 + Math.random() * 20),
      vo2: Math.floor(35 + Math.random() * 10),
      currentZone: "Aerobic",
      timeInZone: Math.floor(30 + Math.random() * 90),
      efficiency: Math.floor(75 + Math.random() * 20),
      recovery: Math.floor(15 + Math.random() * 10)
    };
    
    res.json({ success: true, metrics });
  } catch (error) {
    console.error('Error fetching endurance metrics:', error);
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
    const missionId = 'endurance-boost';
    
    // Update progress through service
    await physicalTrainingService.updateTrainingProgress(
      userId, missionId, sessionId, progressData
    );
    
    // Get feedback from STELLA
    const stellaFeedback = await physicalTrainingService.getSTELLAFeedback(
      userId, missionId, progressData
    );
    
    res.json({ success: true, feedback: stellaFeedback });
  } catch (error) {
    console.error('Error updating mission 2 progress:', error);
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
    const missionId = 'endurance-boost';
    
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
        nextMission: 'strength-training',
        achievements: ['Endurance Master']
      }
    });
  } catch (error) {
    console.error('Error completing mission 2:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;