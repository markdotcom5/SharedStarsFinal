// modules/physical/tasks/data.js
const physicalTasks = {
    zeroGAdaptation: {
        id: 'PT100',
        name: 'Zero-G Movement Series',
        duration: '4 weeks',
        sessions: [
            {
                id: 'PT100-1',
                name: 'Basic Movement Patterns',
                duration: '120 minutes',
                exercises: [
                    {
                        name: 'Neutral Body Position',
                        sets: 3,
                        duration: '10 minutes',
                        description: 'Master the neutral floating position'
                    },
                    {
                        name: 'Push-Pull Navigation',
                        sets: 4,
                        duration: '15 minutes',
                        description: 'Movement using handrails and fixed points'
                    },
                    {
                        name: 'Rotation Control',
                        sets: 3,
                        duration: '15 minutes',
                        description: 'Body rotation and stabilization techniques'
                    }
                ],
                credits: 50
            },
            {
                id: 'PT100-2',
                name: 'Advanced Movement Control',
                duration: '150 minutes',
                exercises: [
                    {
                        name: 'Multi-Axis Rotation',
                        sets: 4,
                        duration: '20 minutes',
                        description: 'Complex rotation and stabilization'
                    },
                    {
                        name: 'Tool Manipulation',
                        sets: 3,
                        duration: '25 minutes',
                        description: 'Using tools while floating'
                    }
                ],
                credits: 65
            }
        ]
    },

    spaceSuitMobility: {
        id: 'PT200',
        name: 'Space Suit Mobility Training',
        duration: '3 weeks',
        sessions: [
            {
                id: 'PT200-1',
                name: 'Suit Familiarization',
                duration: '180 minutes',
                exercises: [
                    {
                        name: 'Suit Donning/Doffing',
                        sets: 5,
                        duration: '30 minutes',
                        description: 'Proper suit entry and exit procedures'
                    },
                    {
                        name: 'Range of Motion Exercises',
                        sets: 4,
                        duration: '20 minutes',
                        description: 'Joint mobility in pressurized suit'
                    }
                ],
                credits: 75
            },
            {
                id: 'PT200-2',
                name: 'Advanced Suit Operations',
                duration: '210 minutes',
                exercises: [
                    {
                        name: 'Complex Tool Usage',
                        sets: 4,
                        duration: '45 minutes',
                        description: 'Using specialized tools while suited'
                    },
                    {
                        name: 'Emergency Procedures',
                        sets: 3,
                        duration: '40 minutes',
                        description: 'Emergency response in suit'
                    }
                ],
                credits: 90
            }
        ]
    }
};

// Adding new certification preparation session
const certificationPrep = {
    id: 'PT800',
    name: 'Certification Preparation',
    duration: '1 week',
    sessions: [
        {
            id: 'PT800-1',
            name: 'Final Integration Training',
            duration: '240 minutes',
            exercises: [
                {
                    name: 'Combined Skills Assessment',
                    sets: 1,
                    duration: '120 minutes',
                    description: 'Full evaluation of all learned skills.'
                },
                {
                    name: 'Emergency Scenario Response',
                    sets: 2,
                    duration: '60 minutes',
                    description: 'Emergency reaction training for spaceflight incidents.'
                }
            ] // ✅ Properly closed exercises array
        }
    ] // ✅ Properly closed sessions array
}; // ✅ Properly closed certificationPrep object
// Function to get all tasks
function getTasks() {
    return { physicalTasks, certificationPrep };
}

// Export updated object
module.exports = { physicalTasks, certificationPrep, getTasks };
