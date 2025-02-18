const getMissions = () => {
    return {
        types: [
            {
                id: 'MT001',
                name: 'Orbital Deployment',
                duration: '6-8 hours',
                objectives: ['Satellite deployment', 'Orbital positioning', 'System verification'],
                requirements: {
                    crew: 4,
                    equipment: ['Deployment system', 'Navigation console', 'Communication array'],
                    prerequisites: ['Basic orbital mechanics', 'Equipment operation certification'],
                },
            },
            {
                id: 'MT002',
                name: 'Space Station Docking',
                duration: '4-6 hours',
                objectives: [
                    'Approach vector calculation',
                    'Docking procedure execution',
                    'System integration verification',
                ],
                requirements: {
                    crew: 5,
                    equipment: ['Docking simulator', 'Proximity sensors', 'Communication systems'],
                    prerequisites: ['Advanced navigation', 'Docking procedures certification'],
                },
            },
            {
                id: 'MT003',
                name: 'EVA Operations',
                duration: '5-7 hours',
                objectives: [
                    'External repairs',
                    'Equipment installation',
                    'Safety protocol adherence',
                ],
                requirements: {
                    crew: 6,
                    equipment: ['EVA suits', 'Tool sets', 'Safety tethers', 'External cameras'],
                    prerequisites: [
                        'EVA certification',
                        'Tool operation training',
                        'Emergency response training',
                    ],
                },
            },
            {
                id: 'MT004',
                name: 'Emergency Response',
                duration: '3-4 hours',
                objectives: [
                    'System failure management',
                    'Crew evacuation procedures',
                    'Emergency repairs',
                ],
                requirements: {
                    crew: 5,
                    equipment: ['Emergency kits', 'Repair tools', 'Life support backup'],
                    prerequisites: [
                        'Emergency response certification',
                        'Crisis management training',
                    ],
                },
            },
            {
                id: 'MT005',
                name: 'Science Operations',
                duration: '8-10 hours',
                objectives: ['Experiment execution', 'Data collection', 'Sample processing'],
                requirements: {
                    crew: 3,
                    equipment: ['Research equipment', 'Data storage systems', 'Sample containers'],
                    prerequisites: [
                        'Science procedures training',
                        'Equipment handling certification',
                    ],
                },
            },
        ],
        procedures: {
            standard: [
                'Pre-mission briefing',
                'Equipment check',
                'Mission execution',
                'Post-mission review',
                'Data collection and analysis',
                'Mission report generation',
                'Performance evaluation',
                'Lessons learned documentation',
            ],
            emergency: [
                'Abort protocols',
                'Emergency response',
                'Recovery procedures',
                'System isolation procedures',
                'Emergency communication protocols',
                'Rapid evacuation procedures',
                'Backup system activation',
                'Emergency resource management',
            ],
            maintenance: [
                'Pre-mission equipment inspection',
                'In-mission system monitoring',
                'Post-mission maintenance',
                'Equipment calibration checks',
                'System performance verification',
            ],
            communication: [
                'Mission control protocols',
                'Inter-crew communication',
                'Emergency channel procedures',
                'Status reporting requirements',
            ],
        },
        safetyProtocols: {
            preOperation: [
                'Safety briefing completion',
                'Equipment safety verification',
                'Environmental checks',
            ],
            duringOperation: [
                'Continuous monitoring',
                'Regular safety checks',
                'Communication maintenance',
            ],
            emergencyResponse: [
                'Immediate assessment protocols',
                'Emergency equipment deployment',
                'Evacuation procedures',
            ],
        },
    };
};

module.exports = { getMissions };
const technicalTasks = {
    avionics: {
        id: 'T100',
        name: 'Avionics Systems Training',
        duration: '4 weeks',
        sessions: [
            {
                id: 'T100-1',
                name: 'Electronics & Circuitry Basics',
                duration: '120 minutes',
                exercises: [
                    {
                        name: 'Circuit Board Assembly',
                        sets: 3,
                        duration: '30 minutes',
                        description: 'Assemble and troubleshoot a spacecraft avionics board',
                    },
                    {
                        name: 'Power Management Simulation',
                        sets: 2,
                        duration: '45 minutes',
                        description:
                            'Balance electrical loads in a spacecraft power grid simulation',
                    },
                ],
                credits: 80,
            },
        ],
    },

    robotics: {
        id: 'T200',
        name: 'Space Robotics Training',
        duration: '5 weeks',
        sessions: [
            {
                id: 'T200-1',
                name: 'Robotic Arm Operations',
                duration: '150 minutes',
                exercises: [
                    {
                        name: 'Precision Grasping Tasks',
                        sets: 3,
                        duration: '30 minutes',
                        description: 'Operate robotic arms to capture a floating object',
                    },
                    {
                        name: 'Robotic Maintenance Sim',
                        sets: 2,
                        duration: '45 minutes',
                        description: 'Perform simulated repairs using robotic arms',
                    },
                ],
                credits: 120,
            },
        ],
    },
};

// ✅ Function to Retrieve Tasks
function getTasks() {
    return technicalTasks;
}

// ✅ Export Tasks
module.exports = { technicalTasks, getTasks };
