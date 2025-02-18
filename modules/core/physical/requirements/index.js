const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');

// ✅ Structured Data: Physical Requirements
const PHYSICAL_REQUIREMENTS = {
    baseline: {
        cardiovascular: {
            restingHeartRate: '60-100 bpm',
            bloodPressure: '< 140/90 mmHg',
            vo2Max: '> 30 ml/kg/min',
        },
        strength: {
            coreStrength: 'Hold plank 60 seconds',
            upperBody: '10 proper pushups',
            lowerBody: '20 bodyweight squats',
        },
        flexibility: {
            hipFlexibility: 'Touch toes while seated',
            shoulderMobility: 'Hands meet behind back',
            ankleFlexibility: '> 30° dorsiflexion',
        },
    },
    medical: {
        clearance: ['Physical examination', 'ECG test', 'Blood work'],
        contraindications: ['Uncontrolled hypertension', 'Recent surgery', 'Acute illness'],
    },
    equipment: {
        personal: ['Heart rate monitor', 'Proper athletic shoes', 'Training attire'],
        facility: [
            'Cardiovascular equipment',
            'Resistance training equipment',
            'Flexibility assessment tools',
        ],
    },
};

// ✅ Function to Retrieve Physical Requirements
function getRequirements(category = null) {
    if (!category) return PHYSICAL_REQUIREMENTS;
    return PHYSICAL_REQUIREMENTS[category] || null;
}

// ✅ API Endpoint: Get All Requirements
router.get('/all', authenticate, (req, res) => {
    res.json({
        success: true,
        requirements: getRequirements(),
    });
});

// ✅ API Endpoint: Get Specific Category of Requirements
router.get('/:category', authenticate, (req, res) => {
    const category = req.params.category.toLowerCase();
    const data = getRequirements(category);

    if (!data) {
        return res.status(404).json({
            success: false,
            error: `No requirements found for category: ${category}`,
        });
    }

    res.json({
        success: true,
        category,
        requirements: data,
    });
});

// ✅ Export Router and `getRequirements()`
module.exports = {
    router, // ✅ Express Routes
    getRequirements, // ✅ Function for other modules to use
};
