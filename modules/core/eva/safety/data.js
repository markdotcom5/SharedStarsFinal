// modules/core/eva/safety/data.js
const evaSafety = {
    protocols: [
        {
            id: 'eva-safety-001',
            name: 'Emergency Response Procedures',
            description: 'Critical safety protocols for EVA emergencies',
            scenarios: [
                {
                    type: 'Suit Malfunction',
                    steps: [
                        'Verify emergency oxygen supply',
                        'Check suit pressure readings',
                        'Initiate emergency return protocol',
                        'Maintain communication with control',
                    ],
                },
                {
                    type: 'Tether Break',
                    steps: [
                        'Activate backup tether',
                        'Use SAFER unit if necessary',
                        'Report situation to control',
                        'Begin emergency return',
                    ],
                },
            ],
        },
    ],
    checkLists: [
        {
            id: 'eva-check-001',
            name: 'Pre-EVA Safety Checklist',
            items: [
                'Suit pressure verification',
                'Communication systems check',
                'Tether integrity confirmation',
                'Tool inventory verification',
                'Emergency systems test',
            ],
        },
    ],
    hazards: [
        {
            id: 'eva-hazard-001',
            type: 'Micrometeroid',
            description: 'Small, high-velocity particles',
            mitigation: [
                'Maintain awareness of surroundings',
                'Use proper shielding',
                'Follow prescribed movement patterns',
            ],
        },
        {
            id: 'eva-hazard-002',
            type: 'Radiation',
            description: 'Solar and cosmic radiation exposure',
            mitigation: [
                'Monitor radiation levels',
                'Limit EVA duration',
                'Use radiation-hardened equipment',
            ],
        },
    ],
};

const getSafetyProtocols = () => evaSafety;

module.exports = {
    getSafetyProtocols,
    evaSafety,
};
