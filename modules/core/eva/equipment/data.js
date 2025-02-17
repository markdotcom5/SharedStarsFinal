// modules/core/eva/equipment/data.js
const evaEquipment = {
    suits: [
        {
            id: 'eva-suit-001',
            name: 'Basic Training Suit',
            description: 'Entry-level EVA suit for training purposes',
            specifications: {
                weight: '115 kg',
                operatingPressure: '4.3 psi',
                oxygenSupply: '8 hours',
                cooling: 'Liquid cooling and ventilation garment'
            },
            components: [
                'Primary life support system',
                'Secondary oxygen pack',
                'Display and control module',
                'Waste management system'
            ],
            maintenanceChecklist: [
                'Pressure integrity check',
                'Oxygen supply verification',
                'Communication systems test',
                'Battery charge level'
            ]
        }
    ],
    tools: [
        {
            id: 'eva-tool-001',
            name: 'Multi-purpose Tool Kit',
            description: 'Standard EVA toolkit for basic operations',
            contents: [
                'Tether hooks',
                'Power tool',
                'Safety wire',
                'Capture bags'
            ],
            usage: [
                'Equipment securing',
                'Basic repairs',
                'Sample collection',
                'Component installation'
            ]
        }
    ],
    safetyEquipment: [
        {
            id: 'eva-safety-001',
            name: 'Safety Tether System',
            description: 'Primary safety restraint system',
            components: [
                'Main tether',
                'Backup tether',
                'Quick-release mechanism',
                'Status indicators'
            ]
        }
    ]
};

const getEquipment = () => evaEquipment;

module.exports = {
    getEquipment,
    evaEquipment
};