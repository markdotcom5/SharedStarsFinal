// modules/physical/assessments/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');
const ASSESSMENTS = {
    physicalEndurance: {
        name: 'Physical Endurance Test',
        duration: '60 minutes',
        criteria: [
            'Run 1.5 miles under 12 minutes',
            'Complete 30 pushups in a row',
            'Hold plank position for 2 minutes',
        ],
    },
    agilityTest: {
        name: 'Agility and Coordination',
        duration: '45 minutes',
        criteria: ['Complete shuttle run under 10 seconds', 'Balance test on unstable surface'],
    },
};

const PHYSICAL_ASSESSMENTS = {
    cardio: {
        name: 'Cardiovascular Fitness Assessment',
        duration: 30, // minutes
        metrics: ['heartRate', 'recoveryTime', 'endurance'],
        requirements: ['heart rate monitor', 'treadmill/track'],
        passingCriteria: {
            heartRateRecovery: '< 120bpm within 5 minutes',
            enduranceTime: '> 20 minutes at target zone',
        },
    },
    strength: {
        name: 'Strength Baseline Assessment',
        duration: 45,
        metrics: ['maxLoad', 'repetitions', 'form'],
        requirements: ['weight equipment', 'spotter'],
        passingCriteria: {
            bodyweightSquats: '> 20 with proper form',
            pushups: '> 15 consecutive',
        },
    },
    flexibility: {
        name: 'Flexibility and Mobility Assessment',
        duration: 30,
        metrics: ['rangeOfMotion', 'jointMobility', 'balance'],
        requirements: ['mobility measurement tools'],
        passingCriteria: {
            trunkFlexion: '> 10cm past toes',
            shoulderMobility: 'full overhead range',
        },
    },
};

// Get available assessments
router.get('/', authenticate, (req, res) => {
    res.json({
        success: true,
        assessments: Object.keys(PHYSICAL_ASSESSMENTS).map((key) => ({
            id: key,
            ...PHYSICAL_ASSESSMENTS[key],
        })),
    });
});

// Get specific assessment details
router.get('/:assessmentId', authenticate, (req, res) => {
    const assessment = PHYSICAL_ASSESSMENTS[req.params.assessmentId];
    if (!assessment) {
        return res.status(404).json({ error: 'Assessment not found' });
    }
    res.json({
        success: true,
        assessment: {
            id: req.params.assessmentId,
            ...assessment,
        },
    });
});

// Start assessment
router.post('/:assessmentId/start', authenticate, async (req, res) => {
    try {
        const assessment = PHYSICAL_ASSESSMENTS[req.params.assessmentId];
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        // Create assessment session
        const session = new TrainingSession({
            userId: req.user._id,
            moduleType: 'physical',
            assessmentType: req.params.assessmentId,
            status: 'in-progress',
            metrics: {
                completionRate: 0,
                effectivenessScore: 0,
            },
        });

        await session.save();

        res.json({
            success: true,
            message: `${assessment.name} started`,
            session: {
                id: session._id,
                assessmentType: req.params.assessmentId,
                duration: assessment.duration,
                metrics: assessment.metrics,
            },
        });
    } catch (error) {
        console.error('Error starting assessment:', error);
        res.status(500).json({ error: 'Failed to start assessment' });
    }
});
function getAssessments() {
    return ASSESSMENTS; // ✅ Make sure ASSESSMENTS is defined above
}

module.exports = {
    router, // ✅ Exporting Express routes
    getAssessments,
};
