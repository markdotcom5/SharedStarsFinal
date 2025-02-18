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

// ✅ Module configuration with structured data
const physicalModule = {
    id: 'core-phys-001',
    type: 'training', // Changed to match schema enum
    category: 'physical', // Changed to match schema enum
    name: 'Physical Training',
    description:
        'Comprehensive space readiness physical preparation program designed to prepare astronauts for the challenges of space environment',
    difficulty: 'beginner',
    duration: {
        weeks: 24,
        hoursPerWeek: 15,
    },
    prerequisites: [],
    objectives: [
        'Cardiovascular fitness for space adaptation',
        'Zero-G movement proficiency',
        'Space suit mobility mastery',
        'Bone and muscle preservation',
        'Balance and coordination in variable gravity',
        'Stress management and mental resilience',
    ],
    tasks: typeof tasks.getTasks === 'function' ? tasks.getTasks() : [],
    assessments:
        typeof assessments.getAssessments === 'function' ? assessments.getAssessments() : [],
    requirements:
        typeof requirements.getRequirements === 'function' ? requirements.getRequirements() : [],
    weeklyStructure: {
        week1: 'Foundation and Basic Adaptation',
        week2: 'Strength and Stability',
        week3: 'Endurance and Stress Management',
        week4: 'Skills Integration and Assessment',
    },
    certification: {
        name: 'Space Physical Readiness Certification',
        requirements: ['Complete all tasks', 'Pass final assessment with 80% or higher'],
        creditValue: 1000,
    },
};

// ✅ Initialize module in MongoDB if it doesn't exist
async function initializeModule() {
    try {
        const existingModule = await Module.findOne({ moduleId: physicalModule.id });
        if (!existingModule) {
            const newModule = new Module({
                moduleId: physicalModule.id,
                type: 'training', // Match schema enum
                category: 'physical', // Match schema enum
                title: physicalModule.name,
                name: physicalModule.name,
                description: physicalModule.description,
                difficulty: physicalModule.difficulty,
                prerequisites: physicalModule.prerequisites,
                objectives: physicalModule.objectives,
                tasks: physicalModule.tasks,
                weeklyStructure: physicalModule.weeklyStructure,
                certification: physicalModule.certification,
                trainingStructure: {
                    duration: {
                        weeks: physicalModule.duration.weeks,
                        minimumCompletionTime: 160,
                        maximumCompletionTime: 480,
                    },
                    certificationRequirements: {
                        minimumSessionCompletions: 20,
                        minimumSuccessRate: 80,
                        timeRequirements: {
                            minimumWeeks: 12,
                            maximumWeeks: 24,
                        },
                    },
                },
            });
            await newModule.save();
            console.log('✅ Physical module initialized in MongoDB');
        } else {
            console.log('ℹ️ Physical module already exists in MongoDB');
        }
    } catch (error) {
        console.error('❌ Error initializing physical module:', error);
        throw error;
    }
}

// Initialize module
initializeModule().catch(console.error);

// ✅ API Endpoint: Get module information
router.get('/', authenticate, async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({
            userId: req.user._id,
            'moduleProgress.moduleId': physicalModule.id,
        });

        const moduleInfo = {
            ...physicalModule,
            progress: userProgress
                ? userProgress.moduleProgress.find((p) => p.moduleId === physicalModule.id)
                      ?.progress || 0
                : 0,
        };

        res.json({
            success: true,
            module: moduleInfo,
        });
    } catch (error) {
        console.error('❌ Error fetching module info:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch module information',
        });
    }
});

// Debug endpoint
router.get('/debug/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        console.log('Debug - UserProgress model:', !!UserProgress);
        console.log('Debug - userId:', userId);

        const raw = await UserProgress.collection.findOne({
            userId: new mongoose.Types.ObjectId(userId),
        });

        console.log('Debug - Raw result:', raw);
        res.json({ result: raw });
    } catch (error) {
        console.error('Debug error:', error);
        res.json({ error: error.message });
    }
});
// Add a test route first
router.get('/test', (req, res) => {
    console.log('Physical module test route hit!');
    res.json({ message: 'Physical module test route working' });
});
// Mount sub-modules with authentication
router.use('/tasks', authenticate, tasks.router);
router.use('/assessments', authenticate, assessments.router);
router.use('/requirements', authenticate, requirements.router);

// ✅ API Endpoint: Get Weekly Structure Progress
router.get('/weekly-structure', authenticate, async (req, res) => {
    try {
        const userProgress = await UserProgress.findOne({ userId: req.user._id });
        const weeklyProgress = {
            week1: userProgress?.weeklyProgress?.week1 || 0,
            week2: userProgress?.weeklyProgress?.week2 || 0,
            week3: userProgress?.weeklyProgress?.week3 || 0,
            week4: userProgress?.weeklyProgress?.week4 || 0,
        };

        res.json({
            success: true,
            weeklyStructure: physicalModule.weeklyStructure,
            progress: weeklyProgress,
        });
    } catch (error) {
        console.error('❌ Error fetching weekly structure:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch weekly structure',
        });
    }
});
router.get('/progress/:userId', authenticate, async (req, res) => {
    console.log('Progress route hit!'); // Add this log
    try {
        const userProgress = await UserProgress.findOne({
            userId: new mongoose.Types.ObjectId(req.params.userId),
        });

        if (!userProgress) {
            return res.status(404).json({
                success: false,
                message: 'No training progress found',
            });
        }

        const physicalModule = userProgress.moduleProgress.find(
            (m) => m.moduleId === 'core-phys-001'
        );

        if (!physicalModule) {
            return res.status(404).json({
                success: false,
                message: 'Physical training module not found',
            });
        }

        res.json({
            success: true,
            progress: physicalModule,
        });
    } catch (error) {
        console.error('Error fetching progress:', error);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});
// ✅ API Endpoint: Get Certification Status
router.get('/certification', authenticate, async (req, res) => {
    try {
        const userProgress = (await UserProgress.findOne({ userId: req.user._id })) || {
            certifications: [],
        };
        const hasCertification = userProgress.certifications.some(
            (cert) => cert.name === physicalModule.certification.name
        );
        const progress = await calculateCertificationProgress(req.user._id);

        res.status(200).json({
            success: true,
            certification: physicalModule.certification,
            userStatus: {
                certified: hasCertification,
                progress,
            },
        });
    } catch (error) {
        console.error('❌ Error fetching certification status:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch certification status.',
        });
    }
});

// ✅ Function to Calculate Certification Progress
async function calculateCertificationProgress(userId) {
    try {
        const userProgress = await UserProgress.findOne({ userId });
        const moduleProgress = userProgress?.moduleProgress?.find(
            (p) => p.moduleId === physicalModule.id
        );

        if (!moduleProgress) return { tasksProgress: 0, assessmentProgress: 0, overallProgress: 0 };

        const tasksCompleted = moduleProgress.completedTasks?.length || 0;
        const totalTasks = Object.values(physicalModule.tasks).flat().length || 1;
        const assessmentScore = moduleProgress.assessmentScore || 0;

        return {
            tasksProgress: (tasksCompleted / totalTasks) * 100,
            assessmentProgress: assessmentScore,
            overallProgress:
                ((tasksCompleted / totalTasks) * 0.6 + (assessmentScore / 100) * 0.4) * 100,
        };
    } catch (error) {
        console.error('❌ Error calculating certification progress:', error);
        return { tasksProgress: 0, assessmentProgress: 0, overallProgress: 0 };
    }
}

// Export both the router and module data
module.exports = {
    router: router,
    moduleData: physicalModule, // Add this
    initializeModule, // Add this
};
