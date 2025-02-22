// modules/core/physical/index.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { ModuleTypes, ModuleCategories } = require('../../shared/types/ModuleTypes');
const tasks = require('./tasks');
const assessments = require('./assessments');
const requirements = require('./requirements');
const Module = require('../../../models/Module');
const UserProgress = require('../../../models/UserProgress');
const { authenticate } = require('../../../middleware/authenticate');

// Enhanced module configuration with phase structure
const physicalModule = {
    id: 'P1-PHY-001', // Updated to match phase system
    type: 'training',
    category: 'physical',
    name: 'Physical Training Foundation',
    phase: 1, // Explicit phase number
    phaseDetails: {
        name: 'Home-Based Training',
        location: 'remote',
        deliveryMethod: 'hybrid'
    },
    description: 'Foundation space readiness physical preparation program designed for home-based training',
    difficulty: 'beginner',
    duration: {
        weeks: 12,
        hoursPerWeek: 10
    },
    prerequisites: [],
    objectives: [
        'Basic cardiovascular fitness for space adaptation',
        'Foundational strength training',
        'Initial flexibility and mobility work',
        'Basic balance and coordination',
        'Introduction to stress management techniques'
    ],
    progression: {
        nextModules: ['P1-PHY-002', 'P1-TECH-001'],
        requiredFor: ['P2-SIM-001', 'P2-EVA-001']
    },
    weeklyStructure: {
        week1: {
            name: 'Foundation Building',
            activities: [
                'Initial fitness assessment',
                'Basic cardio introduction',
                'Core strength fundamentals'
            ]
        },
        week2: {
            name: 'Strength Development',
            activities: [
                'Bodyweight exercises',
                'Resistance band training',
                'Balance exercises'
            ]
        },
        week3: {
            name: 'Endurance Building',
            activities: [
                'Extended cardio sessions',
                'Circuit training',
                'Flexibility work'
            ]
        },
        week4: {
            name: 'Integration Week',
            activities: [
                'Combined workouts',
                'Progress assessment',
                'Technique refinement'
            ]
        }
    },
    requirements: {
        physical: {
            endurance: {
                description: '5k run',
                minimumMetric: '30 minutes',
                assessment: 'Timed run test'
            },
            strength: {
                description: 'Basic strength requirements',
                metrics: {
                    pushups: '20 consecutive',
                    squats: '30 consecutive',
                    plank: '2 minutes'
                }
            },
            flexibility: {
                description: 'Basic mobility assessment',
                metrics: {
                    hamstringFlexibility: 'Touch toes with straight legs',
                    shoulderMobility: 'Full overhead reach'
                }
            }
        },
        equipment: {
            required: [
                'Exercise mat',
                'Resistance bands',
                'Heart rate monitor'
            ],
            optional: [
                'Dumbbells',
                'Pull-up bar',
                'Exercise bike'
            ]
        }
    },
    certification: {
        name: 'Phase 1 Physical Readiness Certification',
        level: 'Foundation',
        requirements: [
            'Complete all weekly modules',
            'Pass physical assessments with 70% or higher',
            'Demonstrate proper form in all exercises',
            'Complete cardiovascular endurance test'
        ],
        creditValue: 500,
        validityPeriod: 6 // months
    },
    aiGuidance: {
        enabled: true,
        features: [
            'Real-time form correction',
            'Progress monitoring',
            'Adaptive difficulty adjustment',
            'Recovery recommendations'
        ]
    }
};

// Enhanced initialization with phase support
async function initializeModule() {
    try {
        const existingModule = await Module.findOne({ moduleId: physicalModule.id });
        if (!existingModule) {
            const newModule = new Module({
                moduleId: physicalModule.id,
                type: physicalModule.type,
                category: physicalModule.category,
                phase: physicalModule.phase,
                phaseDetails: physicalModule.phaseDetails,
                title: physicalModule.name,
                name: physicalModule.name,
                description: physicalModule.description,
                difficulty: physicalModule.difficulty,
                prerequisites: physicalModule.prerequisites,
                objectives: physicalModule.objectives,
                requirements: physicalModule.requirements,
                weeklyStructure: physicalModule.weeklyStructure,
                certification: physicalModule.certification,
                progression: physicalModule.progression,
                aiGuidance: physicalModule.aiGuidance,
                trainingStructure: {
                    duration: {
                        weeks: physicalModule.duration.weeks,
                        hoursPerWeek: physicalModule.duration.hoursPerWeek,
                        minimumCompletionTime: 80, // hours
                        maximumCompletionTime: 160 // hours
                    },
                    certificationRequirements: {
                        minimumSessionCompletions: 24,
                        minimumSuccessRate: 70,
                        timeRequirements: {
                            minimumWeeks: 8,
                            maximumWeeks: 16
                        }
                    }
                }
            });
            await newModule.save();
            console.log('✅ Phase 1 Physical module initialized in MongoDB');
        } else {
            console.log('ℹ️ Phase 1 Physical module already exists in MongoDB');
        }
    } catch (error) {
        console.error('❌ Error initializing physical module:', error);
        throw error;
    }
}

// Enhanced progress tracking
router.get('/progress/:userId', authenticate, async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({
            userId: new mongoose.Types.ObjectId(req.params.userId)
        });

        if (!userProgress) {
            return res.status(404).json({
                success: false,
                message: "No training progress found"
            });
        }

        const moduleProgress = userProgress.moduleProgress.find(m => 
            m.moduleId === physicalModule.id
        );

        if (!moduleProgress) {
            return res.status(404).json({
                success: false,
                message: "Physical training module not found"
            });
        }

        // Enhanced progress calculation
        const progress = {
            overall: moduleProgress.progress || 0,
            weeklyBreakdown: moduleProgress.weeklyProgress || {},
            requirements: {
                physical: calculatePhysicalRequirements(moduleProgress),
                equipment: checkEquipmentStatus(moduleProgress)
            },
            certification: {
                progress: calculateCertificationProgress(moduleProgress),
                eligible: checkCertificationEligibility(moduleProgress)
            },
            nextSteps: determineNextSteps(moduleProgress)
        };

        res.json({
            success: true,
            progress
        });

    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Keep existing routes...

module.exports = {
    router,
    moduleData: physicalModule,
    initializeModule
};