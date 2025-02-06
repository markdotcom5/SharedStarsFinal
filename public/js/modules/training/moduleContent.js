// public/js/modules/training/moduleContent.js

/*
 * Optionally, if you plan to localize these strings, you can replace literal strings
 * with translation keys (e.g., "training.physical.title") and then use your language
 * system to dynamically insert the correct text based on the user's language.
 */

const trainingModules = {
    physical: {
      title: "Physical Training", // Consider replacing with: "training.physical.title"
      description: "Essential physical preparation for space environments", // or "training.physical.description"
      levels: [
        {
          id: "pt-1",
          name: "Zero-G Fundamentals", // "training.physical.level1.name"
          content: [
            {
              type: "video",
              title: "Introduction to Zero-G Movement", // "training.physical.level1.video.title"
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
                  // Additional questions can be added here...
                ]
              }
            },
            {
              type: "interactive",
              title: "Virtual Zero-G Simulation", // "training.physical.level1.interactive.title"
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
          name: "Cardiovascular Conditioning", // "training.physical.level2.name"
          content: [
            {
              type: "program",
              title: "Space-Ready Cardio Program", // "training.physical.level2.program.title"
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
      title: "Technical Training", // or "training.technical.title"
      description: "Master spacecraft systems and procedures", // "training.technical.description"
      levels: [
        {
          id: "tt-1",
          name: "Systems Operations", // "training.technical.level1.name"
          content: [
            {
              type: "interactive",
              title: "Life Support Systems", // "training.technical.level1.interactive.title"
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
          name: "Emergency Procedures", // "training.technical.level2.name"
          content: [
            {
              type: "scenario",
              title: "Critical System Failure Response", // "training.technical.level2.scenario.title"
              scenarios: [
                {
                  name: "Oxygen System Failure",
                  steps: [
                    "Activate backup systems",
                    "Isolate the failure",
                    "Implement recovery procedures"
                  ],
                  timeLimit: 300 // in seconds
                }
              ]
            }
          ]
        }
      ]
    },
  
    simulation: {
      title: "Space Simulation", // or "training.simulation.title"
      description: "Real-world mission scenarios and operations", // "training.simulation.description"
      levels: [
        {
          id: "st-1",
          name: "Basic Mission Operations", // "training.simulation.level1.name"
          content: [
            {
              type: "mission",
              title: "Orbital Docking Procedure", // "training.simulation.level1.mission.title"
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
          name: "EVA Operations", // "training.simulation.level2.name"
          content: [
            {
              type: "simulation",
              title: "Spacewalk Basics", // "training.simulation.level2.simulation.title"
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
  
  export default trainingModules;
  