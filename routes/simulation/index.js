const express = require('express');
const router = express.Router();

// Serve Simulation Training Module Page
router.get('/', async (req, res) => {
    try {
        res.render('training/modules/simulation', { 
            title: "Simulation Training Module",
            content: {
                currentPhase: "Simulation Training",
                title: "🚀 Simulation Training",
                description: "Realistic space mission scenarios and problem-solving training.",
                objectives: [
                    "Perform docking operations under real-time conditions",
                    "Train for emergency spacecraft failures",
                    "Execute AI-assisted simulations with STELLA"
                ],
                certification: true,
                certProgress: 50,
                certDescription: "Complete this module to earn your Simulation Readiness Certification.",
                progress: 30,
                modules: [
                    { name: "Docking Operations", progress: 40 },
                    { name: "Mission Failure Recovery", progress: 20 },
                    { name: "Orbital Maneuvers", progress: 70 }
                ],
                moduleId: "simulation-001",
                moduleType: "simulation",
                feedbackHistory: []
            }
        });
    } catch (error) {
        console.error("❌ Error loading Simulation Training Module:", error);
        res.status(500).render('error', { message: "Failed to load training module" });
    }
});

module.exports = router;
