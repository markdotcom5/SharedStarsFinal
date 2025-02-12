const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const SimulationTraining = require('../../models/SimulationTraining'); // ✅ Corrected path

const simulationModule = {
    id: 'simulation-001',
    name: 'Mission Simulation Training',
    description: 'Immersive mission simulations with AI-powered real-time feedback.',
    difficulty: 'advanced',
    duration: { weeks: 24, hoursPerWeek: 15 },
    trainingFormats: [
        'Solo AI-Guided Training',
        'Meetup Training Sessions',
        'SharedStars Academy In-House Training (Coming Soon)'
    ],
    objectives: [
        'Mission planning and execution',
        'Emergency scenario management',
        'Decision-making under pressure',
        'Real-world spacefaring skill mastery'
    ],
    scenarios: {
        dockingOperations: {
            name: "Docking Operations",
            duration: "Months 1-2",
            description: "Trainees pilot a virtual spacecraft toward a space station with real-time AI guidance.",
            keySkills: ["Approach Velocity Control", "Orientation Alignment", "Docking Stability"],
            challenges: ["Thruster Malfunctions", "Sensor Failures", "Autonomous Docking Trials"]
        },
        spacewalkMaintenance: {
            name: "Spacewalk Maintenance",
            duration: "Months 3-4",
            description: "Conduct extravehicular activities, repairing spacecraft panels in zero-G.",
            keySkills: ["Tool Handling in Zero-G", "Component Diagnosis", "Tether Navigation"],
            challenges: ["Equipment Failures", "Oxygen Management", "Unexpected Obstacles"]
        },
        emergencyResponse: {
            name: "Emergency Response Scenarios",
            duration: "Months 5-6",
            description: "Manage spacecraft crises with AI-driven multi-team coordination exercises.",
            keySkills: ["Crisis Management", "Resource Allocation", "Safety Protocol Execution"],
            challenges: ["Simulated Solar Storm", "Electrical System Failure", "Team Communication"]
        }
    },
    creditEarnings: {
        homeTraining: { min: 30, max: 50 },
        meetupParticipation: { min: 50, max: 100 },
        academyTraining: { min: 100, max: 200 }
    },
    certification: {
        name: 'Space Mission Simulation Certification',
        requirements: [
            'Complete all core scenarios',
            'Demonstrate proficiency in mission planning',
            'Achieve 85%+ in emergency response drills'
        ],
        creditValue: 1500
    }
};

// ✅ API: Get Simulation Module Data
router.get('/', async (req, res) => {
    res.json({ success: true, module: simulationModule });
});

// ✅ API: Get Training Format Details
router.get('/training-formats', async (req, res) => {
    res.json({
        success: true,
        formats: simulationModule.trainingFormats
    });
});

// ✅ API: Get Advanced AI Training Reports
router.get('/ai-training-reports', async (req, res) => {
    res.json({
        success: true,
        reports: {
            dockingOperations: {
                accuracyRate: "85%",
                avgCompletionTime: "10 minutes",
                improvementAreas: ["Approach Speed Consistency", "Alignment Adjustments"]
            },
            spacewalkMaintenance: {
                accuracyRate: "78%",
                avgCompletionTime: "15 minutes",
                improvementAreas: ["Tool Efficiency", "Mobility Control"]
            },
            emergencyResponse: {
                accuracyRate: "92%",
                avgCompletionTime: "8 minutes",
                improvementAreas: ["Communication Speed", "Task Prioritization"]
            }
        }
    });
});

// ✅ API: Get Training Exercises Per Scenario
router.get('/scenarios/:scenarioId', async (req, res) => {
    const scenario = simulationModule.scenarios[req.params.scenarioId];
    if (!scenario) return res.status(404).json({ success: false, message: "Scenario not found." });

    res.json({ success: true, scenario });
});

// ✅ API: Get Certification Status
router.get('/certification', async (req, res) => {
    res.json({
        success: true,
        certification: simulationModule.certification
    });
});

module.exports = { router, moduleData: simulationModule };
