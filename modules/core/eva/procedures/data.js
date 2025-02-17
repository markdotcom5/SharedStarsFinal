// modules/core/eva/procedures/data.js
const evaProcedures = {
    basic: [
        {
            id: 'eva-proc-001',
            name: 'Airlock Operations',
            description: 'Standard airlock entry and exit procedures',
            steps: [
                'Pre-breathe protocol initiation',
                'Suit pressure check',
                'Airlock depressurization',
                'Safety tether verification',
                'Egress procedures'
            ],
            duration: 45,
            difficulty: 'beginner',
            requirements: ['Basic suit qualification', 'Pressure training completion']
        },
        {
            id: 'eva-proc-002',
            name: 'Basic Mobility',
            description: 'Fundamental movement in zero-gravity environment',
            steps: [
                'Handrail translation',
                'Body positioning',
                'Tool management',
                'Tether management',
                'Emergency return procedures'
            ],
            duration: 60,
            difficulty: 'beginner',
            requirements: ['Zero-G adaptation', 'Physical fitness certification']
        }
    ],
    advanced: [
        {
            id: 'eva-proc-003',
            name: 'Complex Repairs',
            description: 'Advanced repair procedures in space environment',
            steps: [
                'Tool preparation',
                'Work site setup',
                'Repair sequence execution',
                'Quality verification',
                'Site cleanup'
            ],
            duration: 90,
            difficulty: 'advanced',
            requirements: ['Basic EVA certification', 'Technical systems training']
        }
    ]
};

const getProcedures = () => evaProcedures;

module.exports = {
    getProcedures,
    evaProcedures
};