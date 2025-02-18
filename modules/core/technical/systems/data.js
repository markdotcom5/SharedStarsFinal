// modules/technical/systems/data.js
const technicalSystems = {
    lifeSupportSystems: {
        id: 'TS100',
        name: 'Life Support Systems Training',
        duration: '4 weeks',
        modules: [
            {
                id: 'TS101',
                name: 'Air Recycling Systems',
                duration: '160 minutes',
                components: [
                    {
                        name: 'CO2 Scrubbing Systems',
                        theory: 'Understanding CO2 removal',
                        practical: 'System maintenance simulation',
                        assessment: 'System troubleshooting test',
                    },
                ],
                certification: 'Life Support Systems Level 1',
            },
            {
                id: 'TS102',
                name: 'Water Recycling Systems',
                duration: '180 minutes',
                components: [
                    /* Components */
                ],
            },
        ],
    },
    navigationSystems: {
        id: 'TS200',
        name: 'Space Navigation Systems',
        modules: [
            /* Navigation modules */
        ],
    },
};
