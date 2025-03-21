// /public/js/training/physical/mission-data.js

/**
 * Physical Training Missions Data
 * Contains all missions, exercises, and related data for the Physical Training module
 */
const physicalMissions = [
  {
    id: "mission1",
    name: "Core & Balance Foundation",
    slug: "core-balance-foundation",
    type: "core-balance",
    description: "Master stability in zero-gravity environments through core strength and balance training",
    progress: 40,
    exercises: [
      {
        id: "planks", 
        name: "AI-Monitored Planks",
        type: "Core",
        description: "Maintain proper plank position while STELLA monitors your form and core engagement.",
        sets: 3,
        duration: "60s",
        rest: "30s",
        compliance: "OSHA Safety Protocol: Zero-G Stability Training"
      },
      {
        id: "stability-ball", 
        name: "Stability Ball Workouts",
        type: "Balance",
        description: "Perform core exercises on stability ball to improve balance and stability.",
        sets: 3,
        reps: 12,
        rest: "45s",
        compliance: "ISO 31000:2018 Risk Management Compliant"
      },
      {
        id: "single-leg", 
        name: "Single-Leg Balance Drills",
        type: "Stability",
        description: "Practice balancing on one leg to improve proprioception and stability.",
        sets: 2,
        duration: "30s",
        rest: "20s",
        compliance: "OSHA Safety Protocol: Microgravity Adaptation"
      }
    ],
    premiumExercises: [
      {
        id: "zero-g-adapt", 
        name: "Zero-G Adaptation",
        type: "Advanced",
        description: "Specialized exercises to prepare for disorientation in microgravity environments.",
        sets: 1,
        duration: "5m",
        intensity: "Med",
        compliance: "NASA-STD-3001 Space Flight Human System Standard"
      }
    ],
    certification: "Core Stability Certification",
    metrics: ["coreEngagement", "balance", "stability", "posture"]
  },
  {
    id: "mission2",
    name: "Endurance Boost",
    slug: "endurance-boost",
    type: "endurance",
    description: "Build cardiovascular fitness for extended space operations",
    progress: 0,
    zones: [
      { id: 'warmup', name: 'Warm-up Zone', duration: '5 min', targetHR: 120 },
      { id: 'aerobic', name: 'Aerobic Zone', duration: '15 min', targetHR: 140 },
      { id: 'threshold', name: 'Threshold Zone', duration: '5 min', targetHR: 160 },
      { id: 'cooldown', name: 'Cool-down Zone', duration: '5 min', targetHR: 110 }
    ],
    exercises: [
      {
        id: "interval-training",
        name: "Interval Training",
        type: "Cardio", 
        description: "High-intensity interval training adapted for space conditions",
        sets: 5,
        duration: "45s",
        rest: "30s",
        compliance: "NASA Cardiovascular Training Protocol"
      },
      {
        id: "cardio-adapt",
        name: "Cardiovascular Adaptation",
        type: "Endurance",
        description: "Exercises that help adapt cardiovascular system to space conditions",
        duration: "15m",
        compliance: "ISS Crew Health Standards"
      },
      {
        id: "recovery-tech",
        name: "Recovery Techniques",
        type: "Recovery",
        description: "Techniques to optimize recovery between cardio sessions",
        sets: 1,
        duration: "10m",
        compliance: "Space Medicine Recovery Protocol"
      }
    ],
    certification: "Endurance Training Certification",
    metrics: ["heartRate", "o2Saturation", "hrv", "vo2"]
  },
  {
    id: "mission3",
    name: "Strength Training Without Gravity",
    slug: "strength-training",
    type: "strength",
    description: "Build muscular strength for space operations in a zero-gravity environment",
    progress: 0,
    exercises: [
      {
        id: "resistance-band",
        name: "Resistance Band Training",
        type: "Strength",
        description: "Use resistance bands to simulate weight in zero-G",
        sets: 4,
        reps: 12,
        rest: "60s",
        compliance: "ISS Resistance Training Protocol"
      },
      {
        id: "bodyweight",
        name: "Bodyweight Resistance Exercises",
        type: "Strength",
        description: "Leverage your own body mass for resistance training",
        sets: 3,
        reps: 15,
        rest: "45s",
        compliance: "NASA Strength Maintenance Standard"
      },
      {
        id: "multi-directional",
        name: "Multi-Directional Strength Training",
        type: "Functional",
        description: "Build strength that works in all directions of movement",
        sets: 3,
        duration: "5m",
        rest: "60s",
        compliance: "3D Movement Protocol for Microgravity"
      }
    ],
    certification: "Space Strength Certification",
    metrics: ["force", "muscleActivation", "formAccuracy", "power"]
  },
  {
    id: "mission4",
    name: "Microgravity Coordination Drills",
    slug: "microgravity-coordination",
    type: "coordination",
    description: "Master coordination and spatial awareness in microgravity environments",
    progress: 0,
    exercises: [
      {
        id: "spatial-orientation",
        name: "Spatial Orientation Exercises",
        type: "Coordination",
        description: "Enhance your ability to orient yourself in three-dimensional space",
        sets: 3,
        duration: "45s",
        rest: "30s",
        compliance: "NASA Spatial Orientation Protocol"
      },
      {
        id: "tool-manipulation",
        name: "Tool Manipulation Training",
        type: "Fine Motor",
        description: "Practice precise tool handling in simulated microgravity",
        sets: 4,
        duration: "60s",
        rest: "30s",
        compliance: "OSHA Tool Handling Safety Protocol"
      },
      {
        id: "multi-axis-rotation",
        name: "Multi-Axis Rotation Exercises",
        type: "Vestibular",
        description: "Train your vestibular system for rotation in multiple axes",
        sets: 2,
        duration: "90s",
        rest: "60s",
        compliance: "ISS Vestibular Training Standard"
      }
    ],
    certification: "Microgravity Coordination Certification",
    metrics: ["spatialOrientation", "toolPrecision", "vestibularAdaptation", "coordinationSpeed"]
  },
  {
    id: "mission5",
    name: "Grip & Dexterity Challenge",
    slug: "grip-dexterity",
    type: "dexterity",
    description: "Enhance hand strength, fine motor control, and grip endurance for EVA operations",
    progress: 0,
    exercises: [
      {
        id: "grip-strength",
        name: "Grip Strength Training",
        type: "Strength",
        description: "Develop hand and forearm strength needed for EVA tool operation",
        sets: 4,
        reps: 12,
        rest: "45s",
        compliance: "EVA Tool Operation Standard"
      },
      {
        id: "fine-motor",
        name: "Fine Motor Control Drills",
        type: "Dexterity",
        description: "Practice precise finger movements while wearing space suit gloves",
        sets: 3,
        duration: "120s",
        rest: "60s",
        compliance: "NASA Gloved Operations Protocol"
      },
      {
        id: "precision-movements",
        name: "Precision Hand Movements",
        type: "Control",
        description: "Execute precise hand positioning and rotation tasks",
        sets: 3,
        reps: 15,
        rest: "45s",
        compliance: "ISS EVA Precision Standard"
      }
    ],
    certification: "EVA Dexterity Certification",
    metrics: ["gripStrength", "fingerPrecision", "endurance", "controlAccuracy"]
  },
  {
    id: "mission6",
    name: "Flexibility & Mobility for Space",
    slug: "flexibility-mobility",
    type: "flexibility",
    description: "Develop joint mobility and range of motion needed for confined space operations",
    progress: 0,
    exercises: [
      {
        id: "zero-g-stretching",
        name: "Zero-G Stretching Routines",
        type: "Flexibility",
        description: "Full-body stretching optimized for microgravity environments",
        sets: 1,
        duration: "15m",
        compliance: "ISS Crew Health Protocol"
      },
      {
        id: "joint-mobility",
        name: "Joint Mobility Drills",
        type: "Mobility",
        description: "Enhance range of motion in key joints needed for EVA operations",
        sets: 3,
        reps: 15,
        rest: "30s",
        compliance: "EVA Mobility Standard"
      },
      {
        id: "dynamic-adaptability",
        name: "Dynamic Microgravity Adaptation",
        type: "Adaptability",
        description: "Train your body to smoothly transition between different postures in space",
        sets: 2,
        duration: "5m",
        rest: "60s",
        compliance: "NASA Posture Transition Protocol"
      }
    ],
    certification: "Space Mobility Certification",
    metrics: ["flexibility", "rangeOfMotion", "jointHealth", "postureTransition"]
  },
  {
    id: "mission7",
    name: "Postural Control & Adaptation",
    slug: "postural-control",
    type: "postural",
    description: "Master control of your posture and spinal alignment in variable gravity environments",
    progress: 0,
    exercises: [
      {
        id: "neutral-spine",
        name: "Neutral Spine Training",
        type: "Alignment",
        description: "Develop awareness and control of spinal alignment in microgravity",
        sets: 3,
        duration: "5m",
        rest: "60s",
        compliance: "NASA Spinal Health Standard"
      },
      {
        id: "dynamic-postural",
        name: "Dynamic Postural Adjustments",
        type: "Control",
        description: "Practice maintaining proper alignment during movement",
        sets: 4,
        duration: "3m",
        rest: "45s",
        compliance: "ISS Movement Protocol"
      },
      {
        id: "postural-awareness",
        name: "Postural Awareness Drills",
        type: "Proprioception",
        description: "Enhance your body's position sense without visual feedback",
        sets: 2,
        duration: "4m",
        rest: "60s",
        compliance: "EVA Proprioception Standard"
      }
    ],
    certification: "Postural Control Certification",
    metrics: ["spinalAlignment", "posturalStability", "proprioception", "muscleTension"]
  },
  {
    id: "mission8",
    name: "Reaction Speed & Reflexes",
    slug: "reaction-reflexes",
    type: "speed",
    description: "Develop quick reaction times and reflexes critical for emergency response in space",
    progress: 0,
    exercises: [
      {
        id: "rapid-response",
        name: "Rapid Response Drills",
        type: "Reaction",
        description: "Train for immediate action in response to visual and auditory cues",
        sets: 5,
        duration: "2m",
        rest: "45s",
        compliance: "Emergency Response Standard"
      },
      {
        id: "hand-eye",
        name: "Hand-Eye Coordination Tests",
        type: "Coordination",
        description: "Enhance coordination between visual input and physical response",
        sets: 3,
        duration: "3m",
        rest: "60s",
        compliance: "ISS Operation Protocol"
      },
      {
        id: "reflex-ai",
        name: "Reflex Training with AI Feedback",
        type: "Neural",
        description: "STELLA analyzes and helps improve your neural response patterns",
        sets: 4,
        duration: "4m",
        rest: "30s",
        compliance: "Neural Adaptation Standard"
      }
    ],
    certification: "Space Reflex Certification",
    metrics: ["reactionTime", "responseAccuracy", "decisionSpeed", "movementTime"]
  },
  {
    id: "mission9",
    name: "Explosive Power & Force Control",
    slug: "power-force-control",
    type: "power",
    description: "Develop controlled power generation for emergency scenarios and precise force application",
    progress: 0,
    exercises: [
      {
        id: "jump-plyometric",
        name: "Jump & Plyometric Drills",
        type: "Power",
        description: "Develop explosive strength needed for emergency maneuvers",
        sets: 4,
        reps: 8,
        rest: "90s",
        compliance: "Emergency Mobility Standard"
      },
      {
        id: "controlled-strength",
        name: "Controlled Strength Training",
        type: "Force Control",
        description: "Practice applying precise amounts of force during tasks",
        sets: 3,
        duration: "4m",
        rest: "60s",
        compliance: "Precision Operation Protocol"
      },
      {
        id: "microgravity-force",
        name: "Microgravity Force Application",
        type: "Adaptation",
        description: "Learn to generate and control force in the absence of gravity",
        sets: 3,
        reps: 10,
        rest: "75s",
        compliance: "EVA Force Control Standard"
      }
    ],
    certification: "Force Control Certification",
    metrics: ["powerOutput", "forceAccuracy", "explosiveStrength", "controlPrecision"]
  },
  {
    id: "mission10",
    name: "Recovery & Fatigue Management",
    slug: "recovery-management",
    type: "recovery",
    description: "Master techniques to optimize recovery and manage fatigue during extended space missions",
    progress: 0,
    exercises: [
      {
        id: "active-recovery",
        name: "Active Recovery Techniques",
        type: "Recovery",
        description: "Learn methods to accelerate recovery between demanding tasks",
        sets: 1,
        duration: "20m",
        compliance: "ISS Crew Recovery Protocol"
      },
      {
        id: "fatigue-monitoring",
        name: "AI-Based Fatigue Monitoring",
        type: "Management",
        description: "STELLA analyzes your fatigue patterns and provides personalized interventions",
        sets: 1,
        duration: "15m",
        compliance: "NASA Fatigue Countermeasure System"
      },
      {
        id: "breathing-relaxation",
        name: "Breathing & Relaxation Protocols",
        type: "Restoration",
        description: "Practice breathing techniques that optimize oxygen utilization and promote recovery",
        sets: 2,
        duration: "10m",
        compliance: "ISS Stress Management Standard"
      }
    ],
    certification: "Fatigue Management Certification",
    metrics: ["recoveryRate", "fatigueResistance", "stressReduction", "sleepQuality"]
  }
];

// Make missions accessible to browser environment
if (typeof window !== 'undefined') {
  window.physicalMissions = physicalMissions;
}

// Make missions accessible to Node.js environment
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { physicalMissions };
}