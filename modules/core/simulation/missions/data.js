// modules/simulation/missions.js
const getMissions = () => {
    return {
      types: [
        {
          id: 'MT001',
          name: 'Orbital Deployment',
          duration: '6-8 hours',
          objectives: [
            'Satellite deployment',
            'Orbital positioning',
            'System verification'
          ],
          requirements: {
            crew: 4,
            equipment: ['Deployment system', 'Navigation console', 'Communication array'],
            prerequisites: ['Basic orbital mechanics', 'Equipment operation certification']
          }
        },
        {
          id: 'MT002',
          name: 'Space Station Docking',
          duration: '4-6 hours',
          objectives: [
            'Approach vector calculation',
            'Docking procedure execution',
            'System integration verification'
          ],
          requirements: {
            crew: 5,
            equipment: ['Docking simulator', 'Proximity sensors', 'Communication systems'],
            prerequisites: ['Advanced navigation', 'Docking procedures certification']
          }
        }
        // Additional mission types...
      ],
      procedures: {
        standard: [
          'Pre-mission briefing',
          'Equipment check',
          'Mission execution',
          'Post-mission review'
        ],
        emergency: [
          'Abort protocols',
          'Emergency response',
          'Recovery procedures'
        ]
      }
    };
  };
  
  module.exports = { getMissions };