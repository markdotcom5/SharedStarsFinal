const express = require('express');
const router = express.Router();
const TechnicalTraining = require('../../../models/TechnicalTraining');

const technicalModule = {
    id: 'technical-001',
    name: 'Technical Systems Training',
    description: 'Comprehensive spacecraft systems and operations training...',
    duration: { weeks: 24, hoursPerWeek: 15 },
    objectives: [
        'Spacecraft systems mastery',
        'Navigation and flight controls',
        'Life support systems management',
        'Emergency protocols proficiency'
    ],
    weeklyStructure: {
        week1: 'Basic Systems and Life Support',
        week2: 'Navigation and Communications',
        week3: 'Power and Propulsion',
        week4: 'Emergency Procedures'
    }
};

// ✅ API: Get Technical Module Data
router.get('/', async (req, res) => {
    res.json({ success: true, module: technicalModule });
});

module.exports = { router, moduleData: technicalModule };
