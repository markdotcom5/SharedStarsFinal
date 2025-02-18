// modules/technical/protocols/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');

const PROTOCOLS = {
    safety: [
        {
            id: 'SAFETY-001',
            name: 'Emergency Depressurization Protocol',
            type: 'emergency',
            priority: 'critical',
            steps: [
                'Verify pressure drop rate and location',
                'Don emergency oxygen mask',
                'Seal off affected compartment',
                'Initiate emergency communication protocol',
                'Begin pressure stabilization procedure',
            ],
            requiredEquipment: [
                'Pressure monitoring system',
                'Emergency oxygen supply',
                'Communication system',
            ],
            assessmentCriteria: {
                timeLimit: 180, // seconds
                minAccuracy: 95,
                criticalSteps: [1, 2], // steps that must be perfect
            },
        },
    ],
    communication: [
        {
            id: 'COMM-001',
            name: 'Mission Control Communication Protocol',
            type: 'standard',
            priority: 'high',
            procedures: [
                'Equipment check sequence',
                'Channel verification',
                'Communication window scheduling',
                'Emergency backup systems check',
            ],
            terminology: {
                standard: ['Copy that', 'Roger', 'Wilco'],
                emergency: ['Mayday', 'Pan-pan', 'Break-break'],
            },
        },
    ],
    maintenance: [
        {
            id: 'MAINT-001',
            name: 'Routine Systems Check Protocol',
            type: 'maintenance',
            priority: 'medium',
            schedule: 'daily',
            checkpoints: [
                'Life support systems',
                'Communication systems',
                'Navigation systems',
                'Power systems',
            ],
        },
    ],
};

function getProtocols() {
    return PROTOCOLS;
}

// Get all protocols
router.get('/', authenticate, (req, res) => {
    res.json({
        success: true,
        protocols: PROTOCOLS,
    });
});

// Get specific protocol
router.get('/:protocolId', authenticate, (req, res) => {
    const [category, ...rest] = req.params.protocolId.split('-');
    const protocol = PROTOCOLS[category.toLowerCase()]?.find((p) => p.id === req.params.protocolId);

    if (!protocol) {
        return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json({
        success: true,
        protocol,
    });
});

// Start protocol training
router.post('/:protocolId/start', authenticate, async (req, res) => {
    try {
        const [category, ...rest] = req.params.protocolId.split('-');
        const protocol = PROTOCOLS[category.toLowerCase()]?.find(
            (p) => p.id === req.params.protocolId
        );

        if (!protocol) {
            return res.status(404).json({ error: 'Protocol not found' });
        }

        const session = new TrainingSession({
            userId: req.user._id,
            moduleType: 'technical',
            moduleId: 'technical-001',
            protocolId: req.params.protocolId,
            status: 'in-progress',
            dateTime: new Date(),
            metrics: {
                completionRate: 0,
                effectivenessScore: 0,
                accuracy: 0,
            },
        });

        await session.save();

        res.json({
            success: true,
            message: `Protocol training ${protocol.name} started`,
            session: {
                id: session._id,
                protocol: protocol.id,
                timeLimit: protocol.assessmentCriteria?.timeLimit,
                requirements: protocol.requiredEquipment,
            },
        });
    } catch (error) {
        console.error('Error starting protocol training:', error);
        res.status(500).json({ error: 'Failed to start protocol training' });
    }
});
// ✅ Function to retrieve protocols
function getProtocols() {
    return {
        emergency: {
            id: 'P100',
            name: 'Emergency Protocols',
            description: 'Learn to handle spacecraft emergencies',
        },
        docking: {
            id: 'P200',
            name: 'Docking Procedures',
            description: 'Master docking techniques with space stations',
        },
        EVA: {
            id: 'P300',
            name: 'EVA Safety and Operations',
            description: 'Prepare for extravehicular activity in space',
        },
    };
}

// ✅ Export router and getProtocols function
module.exports = {
    router,
    getProtocols,
};
