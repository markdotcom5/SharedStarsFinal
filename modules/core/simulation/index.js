const express = require('express');
const router = express.Router();
const scenarios = require('./scenarios');
const missions = require('./missions');
const teamRoles = require('./teamRoles');

// ✅ Ensure functions exist before calling them
const getScenarios = scenarios.getScenarios ? scenarios.getScenarios() : () => ({});
const getMissions = missions.getMissions ? missions.getMissions() : () => ({});
const getRoles = teamRoles.getRoles ? teamRoles.getRoles() : () => ({});

// ✅ Mission Simulation Module Configuration
const simulationModule = {
    id: 'simulation-001',
    name: 'Mission Simulation',
    description: 'Advanced mission scenarios and team-based space operations training',
    difficulty: 'advanced',
    duration: '8 weeks',
    prerequisites: ['physical-001', 'technical-001'],
    objectives: [
        'Full mission scenario mastery',
        'Team coordination excellence',
        'Crisis management proficiency',
        'Decision-making under pressure',
        'Multi-system operations',
        'Mission planning expertise',
    ],
    scenarios: getScenarios(),
    missions: getMissions(),
    teamRoles: getRoles(),
    weeklyStructure: {
        week1: 'Mission Planning and Basics',
        week2: 'Launch and Orbital Operations',
        week3: 'Team Coordination',
        week4: 'Emergency and EVA Operations',
        week5: 'Advanced Mission Scenarios',
        week6: 'Crisis Management',
        week7: 'Full Mission Integration',
        week8: 'Command Certification',
    },
    certification: {
        name: 'Space Mission Commander Certification',
        requirements: [
            'Complete all simulation tasks',
            'Lead successful full mission simulation',
            'Pass command certification assessment',
            '90% overall performance rating',
        ],
    },
};

// ✅ Function to get simulations
function getSimulations() {
    return simulations;
}

// ✅ API Endpoint: Get all simulations
router.get('/', (req, res) => {
    res.json({
        success: true,
        simulations: getSimulations(),
    });
});

// ✅ Export router and function
module.exports = {
    router,
    getSimulations,
};
