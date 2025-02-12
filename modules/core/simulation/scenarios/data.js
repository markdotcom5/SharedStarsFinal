// modules/simulation/scenarios.js
const getScenarios = () => {
    return [
      {
        id: 'SIM001',
        name: 'Launch Sequence',
        duration: '240 minutes',
        difficulty: 'high',
        participants: {
          minimum: 4,
          maximum: 6,
          roles: ['Commander', 'Pilot', 'Engineer', 'Mission Control']
        },
        phases: [
          {
            name: 'Pre-launch',
            duration: '60 minutes',
            tasks: ['Systems check', 'Weather assessment', 'Crew preparation']
          },
          {
            name: 'Launch',
            duration: '30 minutes',
            tasks: ['Engine ignition', 'Trajectory monitoring', 'Stage separation']
          },
          {
            name: 'Orbit insertion',
            duration: '90 minutes',
            tasks: ['Orbit adjustment', 'Systems stabilization', 'Status verification']
          },
          {
            name: 'Post-launch',
            duration: '60 minutes',
            tasks: ['System optimization', 'Mission confirmation', 'Initial operations']
          }
        ],
        emergencyScenarios: [
          'Engine malfunction',
          'Communication loss',
          'Trajectory deviation'
        ]
      },
      // Additional scenarios...
    ];
  };
  
  module.exports = { getScenarios };