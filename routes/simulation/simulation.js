const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const SimulationTraining = require('../../models/SimulationTraining');  // ✅ Correct

// Start a new simulation session
router.post('/start', authenticate, async (req, res) => {
  console.log("Request Path:", req.path); // Debug URL issues

  try {
    const { simulationId, userId } = req.body;
    if (!simulationId || !userId) {
      return res.status(400).json({ error: 'simulationId and userId are required' });
    }

    const newSession = new Simulation({
      sessionId: `session-${Date.now()}`,
      simulationId,
      userId,
      status: 'in-progress',
      progress: 0
    });

    await newSession.save();
    res.status(201).json({ message: 'Simulation started successfully', session: newSession });

  } catch (error) {
    res.status(500).json({ error: 'Failed to start simulation', details: error.message });
  }
});

// ✅ Get simulation session status
router.get('/:sessionId/status', authenticate, async (req, res) => {
  try {
    const session = await Simulation.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    res.json({ success: true, status: session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve simulation status', details: error.message });
  }
});

// ✅ API: Get Simulation Training Module
router.get('/', async (req, res) => {
  console.log("🔍 API Hit: GET /api/simulation");
  try {
      console.log("🔎 Running MongoDB Query: Looking for moduleId 'core-sim-001'");
      let moduleData = await SimulationTraining.findOne({ moduleId: 'core-sim-001' });

      if (!moduleData) {
          console.log("❌ Simulation Training Module Not Found in MongoDB—Returning Default Data");
          moduleData = {
              moduleId: "core-sim-001",
              moduleName: "Mission Simulation Training",
              difficulty: "advanced",
              durationWeeks: 24,
              scenarios: [
                  { 
                      name: "Docking Operations",
                      description: "Trainees pilot a virtual spacecraft toward a space station with real-time AI guidance.",
                      keySkills: ["Approach Velocity Control", "Orientation Alignment", "Docking Stability"],
                      challenges: ["Thruster Malfunctions", "Sensor Failures", "Autonomous Docking Trials"]
                  }
              ],
              trainingFormats: ["Solo AI-Guided", "Meetup Training", "Academy Training"],
              certification: {
                  name: "Space Mission Simulation Certification",
                  requirements: ["Complete all core scenarios", "Demonstrate proficiency in mission planning", "Achieve 85%+ in emergency response drills"],
                  creditValue: 1500
              }
          };
      }

      console.log("✅ Simulation Training Module Found:", moduleData);
      res.json({ success: true, module: moduleData });
  } catch (error) {
      console.error('❌ Error fetching simulation module:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch Simulation Training Module' });
  }
});

// Submit progress updates
router.post('/:sessionId/progress', authenticate, async (req, res) => {
  try {
    const { progress, feedback, credits } = req.body;
    const session = await Simulation.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    session.progress = progress || session.progress;
    if (feedback) session.feedback.push(feedback);
    if (credits) session.creditsEarned += credits;

    await session.save();
    res.json({ success: true, updatedSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update simulation progress', details: error.message });
  }
});

// Complete the simulation
router.post('/:sessionId/complete', authenticate, async (req, res) => {
  try {
    const { completionPercentage, successRate, metrics } = req.body;
    const session = await Simulation.findOne({ sessionId: req.params.sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Simulation session not found' });
    }

    session.status = 'completed';
    session.results = { completionPercentage, successRate, metrics };
    session.completionTime = Date.now();
    await session.save();

    res.json({ success: true, completedSession: session });
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete simulation', details: error.message });
  }
});

// Get leaderboard rankings
router.get('/leaderboard', authenticate, async (req, res) => {
  try {
    const leaderboard = await Simulation.find({ status: 'completed' })
      .sort({ creditsEarned: -1 })
      .limit(10);
    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve leaderboard', details: error.message });
  }
});

// Get user mission control dashboard
router.get('/mission-control/:userId', authenticate, async (req, res) => {
  try {
    const userMissions = await Simulation.find({ userId: req.params.userId }).sort({ completionTime: -1 });
    res.status(200).json(userMissions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve mission control data', details: error.message });
  }
});

module.exports = router;
