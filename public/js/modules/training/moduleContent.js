// public/js/modules/training/moduleContent.js

/*
 * Optionally, if you plan to localize these strings, you can replace literal strings
 * with translation keys (e.g., "training.physical.title") and then use your language
 * system to dynamically insert the correct text based on the user's language.
 */

const trainingModules = {
  physical: {
      title: "Physical Training",
      description: "Essential physical preparation for space environments",
      duration: "6-8 months",
      certifications: ["ISO 31000", "OSHA Space Safety"],
      biometrics: {
          required: ["heart_rate", "blood_pressure", "vestibular_response"],
          thresholds: {
              heart_rate_max: 180,
              blood_pressure_max: "140/90",
              recovery_time_min: 180
          }
      },
      levels: [
          {
              id: "pt-1",
              name: "Zero-G Fundamentals",
              duration: "8 weeks",
              failureConditions: [
                  "Heart rate exceeds 180 bpm for >1 minute",
                  "Vestibular distress level > 7",
                  "Improper emergency response time"
              ],
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
                  },
                  {
                      type: "vestibular",
                      title: "Vestibular Adaptation Training",
                      duration: "45:00",
                      equipment: ["VR headset", "Motion platform"],
                      progressionLevels: [
                          "Basic orientation (2 weeks)",
                          "Complex maneuvers (3 weeks)",
                          "Emergency reorientation (3 weeks)"
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
      duration: "4-6 months",
      certifications: ["SpaceCraft Systems ISO 14620", "Emergency Response Level 3"],
      performanceMetrics: {
          required: ["system_response_time", "error_rate", "protocol_accuracy"],
          thresholds: {
              max_response_time: 3000,
              error_tolerance: 0.01,
              min_protocol_accuracy: 0.95
          }
      },
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
                              timeLimit: 300
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
      duration: "3-4 months",
      certifications: ["Mission Operations Level 2", "EVA Safety Certification"],
      teamMetrics: {
          required: ["team_coordination", "communication_efficiency", "crisis_response"],
          thresholds: {
              min_coordination: 0.85,
              max_response_time: 45,
              communication_accuracy: 0.98
          }
      },
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
          },
          {
              id: "st-3",
              name: "Crisis Management",
              content: [
                  {
                      type: "team_simulation",
                      title: "Multi-System Failure Response",
                      scenarios: [
                          {
                              name: "Cascading Systems Failure",
                              participants: ["Commander", "Engineer", "Life Support"],
                              objectives: [
                                  "Coordinate emergency response",
                                  "Manage resource allocation",
                                  "Maintain crew safety protocols"
                              ],
                              success_criteria: [
                                  "Resolution within 5 minutes",
                                  "Zero crew casualties",
                                  "Minimal system damage"
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