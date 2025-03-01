// modules/training/physical/index.js
const physicalTrainingModules = [
    {
      moduleId: 'zero-g-core-strength',
      name: 'Zero-G Core Strength',
      description: 'Strengthen core muscles to maintain control in microgravity.',
      type: 'physical',
      phase: 1,
      difficulty: 'beginner',
      duration: '30 minutes',
      exercises: [
        {
          id: 'plank-holds',
          name: 'Plank Holds',
          description: 'Hold a plank position with proper form',
          duration: '60 seconds',
          reps: 3,
          restBetween: '30 seconds'
        }
      ],
      challenge: {
        name: 'Endurance Plank',
        description: 'Hold a plank for 3 minutes straight',
        criteria: 'Maintain proper form throughout',
        bonusPoints: 50
      }
    }
  ];
  
  module.exports = physicalTrainingModules;
  