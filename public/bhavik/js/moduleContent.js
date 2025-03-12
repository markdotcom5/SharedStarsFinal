// public/js/modules/training/moduleContent.js

const trainingModules = {
    physical: {
        title: "Physical Training",
        description: "Essential physical preparation for space environments",
        levels: [
            {
                id: "pt-1",
                name: "Zero-G Fundamentals",
                content: [
                    {
                        type: "video",
                        title: "Introduction to Zero-G Movement",
                        url: "/videos/zero-g-intro.mp4",
                        duration: "15:00",
                        objectives: [
                            "Understand basic zero-gravity physics",
                            "Learn proper body positioning",
                            "Master basic movement techniques"
                        ],
                        assessment: {
                            type: "quiz",
                            questions: [
                                {
                                    question: "What is the primary consideration when moving in zero-G?",
                                    options: [
                                        "Conservation of momentum",
                                        "Running speed",
                                        "Ground friction",
                                        "Air resistance"
                                    ],
                                    correct: 0
                                }
                                // More questions...
                            ]
                        }
                    },
                    {
                        type: "interactive",
                        title: "Virtual Zero-G Simulation",
                        description: "Practice basic movement techniques in our virtual environment",
                        duration: "30:00",
                        checkpoints: [
                            "Basic orientation",
                            "Movement control",
                            "Emergency stops",
                            "Object handling"
                        ]
                    }
                ]
            },
            {
                id: "pt-2",
                name: "Cardiovascular Conditioning",
                content: [
                    {
                        type: "program",
                        title: "Space-Ready Cardio Program",
                        exercises: [
                            {
                                name: "HIIT Space Protocol",
                                duration: "20:00",
                                intervals: [
                                    { activity: "High-intensity", duration: "30s" },
                                    { activity: "Recovery", duration: "30s" }
                                ],
                                sets: 10
                            }
                        ]
                    }
                ]
            }
        ]
    },

    technical: {
        title: "Technical Training",
        description: "Master spacecraft systems and procedures",
        levels: [
            {
                id: "tt-1",
                name: "Systems Operations",
                content: [
                    {
                        type: "interactive",
                        title: "Life Support Systems",
                        components: [
                            {
                                name: "Oxygen Generation",
                                simulation: "oxygen-sim",
                                objectives: [
                                    "Monitor O2 levels",
                                    "Maintain system pressure",
                                    "Handle emergencies"
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "tt-2",
                name: "Emergency Procedures",
                content: [
                    {
                        type: "scenario",
                        title: "Critical System Failure Response",
                        scenarios: [
                            {
                                name: "Oxygen System Failure",
                                steps: [
                                    "Activate backup systems",
                                    "Isolate the failure",
                                    "Implement recovery procedures"
                                ],
                                timeLimit: 300 // seconds
                            }
                        ]
                    }
                ]
            }
        ]
    },

    simulation: {
        title: "Space Simulation",
        description: "Real-world mission scenarios and operations",
        levels: [
            {
                id: "st-1",
                name: "Basic Mission Operations",
                content: [
                    {
                        type: "mission",
                        title: "Orbital Docking Procedure",
                        phases: [
                            {
                                name: "Approach",
                                objectives: [
                                    "Match orbital velocity",
                                    "Maintain safe distance",
                                    "Monitor approach vectors"
                                ],
                                success_criteria: [
                                    "Velocity match within 0.1 m/s",
                                    "Keep 100m minimum distance",
                                    "Proper alignment maintained"
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: "st-2",
                name: "EVA Operations",
                content: [
                    {
                        type: "simulation",
                        title: "Spacewalk Basics",
                        scenarios: [
                            {
                                name: "Equipment Retrieval",
                                objectives: [
                                    "Safe tether management",
                                    "Tool usage in space",
                                    "Emergency return procedures"
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
};