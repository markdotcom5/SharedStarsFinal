const mongoose = require('mongoose'); // ✅ Import mongoose
const express = require('express');
const router = express.Router();
const Module = require('../../../models/Module'); // ✅ Ensure Module model is correctly referenced

// ✅ Import Submodules Correctly
const procedures = require('./procedures');
const equipment = require('./equipment');
const safety = require('./safety');

// ✅ EVA Module Data
const evaModule = {
    id: 'core-eva-001',
    type: 'training',
    category: 'eva',
    name: 'EVA Training',
    description:
        'Comprehensive extravehicular activity training program covering spacewalk procedures, equipment operation, and safety protocols.',
    difficulty: 'advanced',
    duration: {
        weeks: 16,
        hoursPerWeek: 20,
    },
    prerequisites: [
        { module: new mongoose.Types.ObjectId('679f85e84f5b978f15667cf9'), minimumScore: 70 },
        { module: new mongoose.Types.ObjectId('679f888e85bf36b5653de4db'), minimumScore: 75 },
    ],
    objectives: [
        'Master EVA suit operations and maintenance',
        'Perform complex tasks in zero-gravity environment',
        'Execute emergency procedures and safety protocols',
        'Demonstrate proficiency in EVA tool usage',
        'Complete simulated repair and maintenance tasks',
    ],
    weeklyStructure: {
        week1: 'EVA Fundamentals and Safety',
        week2: 'Suit Operations and Maintenance',
        week3: 'Basic Mobility and Tool Usage',
        week4: 'Advanced Procedures and Emergency Response',
    },
    certification: {
        name: 'EVA Operations Certification',
        requirements: [
            'Complete all EVA training modules',
            'Pass practical assessment with 85% or higher',
            'Successfully complete 3 simulated EVA missions',
            'Demonstrate emergency procedure proficiency',
        ],
        creditValue: 2000,
    },
    trainingLevels: {
        basic: {
            name: 'EVA Fundamentals',
            duration: '4 weeks',
            requirements: ['Physical Fitness Certification', 'Basic Space Safety'],
        },
        intermediate: {
            name: 'Advanced EVA Operations',
            duration: '6 weeks',
            requirements: ['EVA Fundamentals Completion', 'Zero-G Adaptation'],
        },
        advanced: {
            name: 'Mission Specialist EVA',
            duration: '6 weeks',
            requirements: ['Advanced EVA Operations', 'Technical Systems Mastery'],
        },
    },
};

// ✅ MongoDB Initialization Function
async function initializeModule() {
    try {
        const existingModule = await Module.findOne({ moduleId: evaModule.id });
        if (!existingModule) {
            const newModule = new Module({
                moduleId: evaModule.id,
                type: 'training',
                category: evaModule.category,
                title: evaModule.name,
                name: evaModule.name,
                description: evaModule.description,
                difficulty: evaModule.difficulty,
                prerequisites: evaModule.prerequisites,
                objectives: evaModule.objectives,
                weeklyStructure: evaModule.weeklyStructure,
                certification: evaModule.certification,
                trainingStructure: {
                    duration: {
                        weeks: evaModule.duration.weeks,
                        minimumCompletionTime: 240, // 16 weeks * 15 hours
                        maximumCompletionTime: 480, // Maximum flexibility
                    },
                    certificationRequirements: {
                        minimumSessionCompletions: 48, // 3 sessions per week
                        minimumSuccessRate: 85,
                        timeRequirements: {
                            minimumWeeks: 16,
                            maximumWeeks: 24,
                        },
                    },
                },
            });
            await newModule.save();
            console.log('✅ EVA module initialized in MongoDB');
        } else {
            console.log('ℹ️ EVA module already exists in MongoDB');
        }
    } catch (error) {
        console.error('❌ Error initializing EVA module:', error);
        throw error;
    }
}

// ✅ Initialize the module
initializeModule().catch(console.error);

// ✅ Mount Sub-Module Routes Correctly
router.use('/procedures', procedures.router);
router.use('/equipment', equipment.router);
router.use('/safety', safety.router);

// ✅ Export the Router and Module Data
module.exports = {
    router,
    moduleData: evaModule,
};
