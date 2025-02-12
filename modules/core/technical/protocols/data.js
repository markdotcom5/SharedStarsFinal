// modules/technical/protocols.js

const getProtocols = () => {
    return {
      emergency: {
        categories: [
          'Life Support Failure',
          'Power System Failure',
          'Navigation System Failure',
          'Radiation Leak',
          'Fire Outbreak'
        ],
        responses: [
          'Immediate assessment',
          'System isolation',
          'Emergency evacuation',
          'Deploy backup systems',
          'Activate alarm protocols'
        ]
      },
      maintenance: {
        schedules: [
          'Daily checks',
          'Weekly maintenance',
          'Monthly overhaul',
          'Quarterly inspections',
          'Annual calibration'
        ],
        procedures: [
          'System diagnostics',
          'Component replacement',
          'Performance verification',
          'Lubrication and cleaning',
          'Firmware update'
        ]
      },
      communication: {
        channels: [
          'Primary Radio',
          'Secondary Radio',
          'Satellite Link',
          'Internal Network'
        ],
        protocols: [
          'Signal encryption',
          'Redundant communication paths',
          'Automated error correction',
          'Priority messaging'
        ]
      },
      security: {
        measures: [
          'Access control',
          'Intrusion detection',
          'Physical security barriers',
          'Cybersecurity protocols'
        ],
        procedures: [
          'Regular security audits',
          'Incident response drills',
          'Threat assessment',
          'Data encryption enforcement'
        ]
      },
      software: {
        updates: [
          'Patch management',
          'Version control',
          'Continuous integration',
          'Automated testing'
        ],
        procedures: [
          'Rollback procedures',
          'Deployment protocols',
          'Bug tracking',
          'User acceptance testing'
        ]
      },
      hardware: {
        diagnostics: [
          'Thermal imaging',
          'Stress testing',
          'Load balancing',
          'Redundancy verification'
        ],
        procedures: [
          'Component replacement',
          'Hardware calibration',
          'Preventive maintenance',
          'Upgrade scheduling'
        ]
      }
    };
  };
  
  module.exports = { getProtocols };
  