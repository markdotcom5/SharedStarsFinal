// modules/simulation/teamRoles.js

const getRoles = () => {
    return {
        leadership: [
            {
                title: 'Mission Commander',
                responsibilities: [
                    'Overall mission success',
                    'Team coordination',
                    'Critical decision-making',
                ],
                requirements: {
                    experience: '1000 hours simulation',
                    certifications: ['Command Ready', 'Crisis Management'],
                    skills: ['Leadership', 'Strategic thinking', 'Communication'],
                },
            },
            {
                title: 'Flight Director',
                responsibilities: [
                    'Mission control operations',
                    'Resource management',
                    'Timeline maintenance',
                ],
                requirements: {
                    experience: '800 hours simulation',
                    certifications: ['Flight Operations', 'Mission Planning'],
                    skills: ['Organization', 'Multi-tasking', 'Problem-solving'],
                },
            },
            {
                title: 'Deputy Commander',
                responsibilities: [
                    'Assist the Mission Commander',
                    'Coordinate backup strategies',
                    'Manage secondary operations',
                ],
                requirements: {
                    experience: '700 hours simulation',
                    certifications: ['Deputy Command', 'Crisis Response'],
                    skills: ['Team leadership', 'Decision-making', 'Conflict resolution'],
                },
            },
        ],
        specialists: [
            {
                title: 'Systems Engineer',
                responsibilities: [
                    'System maintenance',
                    'Technical problem-solving',
                    'Performance optimization',
                ],
                requirements: {
                    experience: '500 hours simulation',
                    certifications: ['Technical Systems', 'Emergency Response'],
                    skills: ['Technical expertise', 'Analytical thinking', 'Quick response'],
                },
            },
            {
                title: 'Navigation Specialist',
                responsibilities: [
                    'Chart course and trajectory',
                    'Monitor navigation systems',
                    'Adjust route based on simulation data',
                ],
                requirements: {
                    experience: '400 hours simulation',
                    certifications: ['Navigation Systems', 'Astrogation Basics'],
                    skills: ['Spatial awareness', 'Precision', 'Analytical skills'],
                },
            },
            {
                title: 'Communication Specialist',
                responsibilities: [
                    'Maintain communication channels',
                    'Ensure signal integrity',
                    'Troubleshoot communication issues',
                ],
                requirements: {
                    experience: '300 hours simulation',
                    certifications: ['Communication Protocols', 'Signal Processing'],
                    skills: [
                        'Technical expertise',
                        'Interpersonal communication',
                        'Problem-solving',
                    ],
                },
            },
        ],
        support: [
            {
                title: 'Logistics Coordinator',
                responsibilities: [
                    'Manage supplies and equipment',
                    'Coordinate transportation of resources',
                    'Plan mission logistics',
                ],
                requirements: {
                    experience: '350 hours simulation',
                    certifications: ['Logistics Management', 'Resource Coordination'],
                    skills: ['Organization', 'Resource planning', 'Time management'],
                },
            },
            {
                title: 'Medical Officer',
                responsibilities: [
                    'Provide medical support to the crew',
                    'Manage health emergencies',
                    'Monitor crew wellbeing',
                ],
                requirements: {
                    experience: '300 hours simulation',
                    certifications: ['First Aid', 'Medical Operations'],
                    skills: ['Medical knowledge', 'Calm under pressure', 'Empathy'],
                },
            },
        ],
    };
};

module.exports = { getRoles };
