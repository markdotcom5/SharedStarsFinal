// modules/physical/requirements/data.js
const physicalRequirements = {
    baseline: {
        cardiovascular: {
            vo2max: '30 ml/kg/min minimum',
            bloodPressure: '140/90 maximum resting',
            restingHeartRate: '100 bpm maximum'
        },
        strength: {
            corePlank: '2 minutes minimum',
            pushUps: '20 consecutive minimum',
            squats: '25 consecutive minimum'
        },
        flexibility: {
            shoulderMobility: 'Full overhead range',
            hipFlexibility: 'Touch toes standing',
            trunkRotation: '45 degrees minimum'
        }
    },
    certificationLevels: {
        basic: {
            requirements: [/* List requirements */],
            credits: 500,
            unlocks: ['Basic EVA Training']
        },
        advanced: {
            requirements: [/* List requirements */],
            credits: 1000,
            unlocks: ['Advanced Space Operations']
        }
    }
};

module.exports = physicalRequirements;
