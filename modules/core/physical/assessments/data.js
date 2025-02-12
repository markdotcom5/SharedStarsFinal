const assessments = {
    physicalEndurance: {
        id: 'A100',
        name: 'Physical Endurance Test',
        duration: '60 minutes',
        criteria: [
            'Run 1.5 miles under 12 minutes',
            'Complete 30 pushups in a row',
            'Hold plank position for 2 minutes'
        ],
        credits: 100
    },

    agilityTest: {
        id: 'A200',
        name: 'Agility and Coordination',
        duration: '45 minutes',
        criteria: [
            'Complete shuttle run under 10 seconds',
            'Balance test on unstable surface'
        ],
        credits: 75
    },

    reactionTraining: {
        id: 'A300',
        name: 'Reaction Time & Reflex Training',
        duration: '30 minutes',
        criteria: [
            'Achieve <200ms reaction time on light reflex test',
            'Respond to 90% of sudden directional changes'
        ],
        credits: 90
    },

    microgravityTraining: {
        id: 'A400',
        name: 'Microgravity Adaptation Assessment',
        duration: '90 minutes',
        criteria: [
            'Maintain balance while floating for 5 minutes',
            'Successfully navigate through microgravity obstacle course'
        ],
        credits: 120
    }
};

// ✅ Function to retrieve assessments
function getAssessments() {
    return assessments;
}

// ✅ Export assessments
module.exports = { assessments, getAssessments };
