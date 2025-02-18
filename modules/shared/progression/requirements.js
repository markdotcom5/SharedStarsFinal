const requirements = {
    basicTraining: {
        id: 'R100',
        description: 'Complete all basic physical training modules',
    },
    advancedTech: {
        id: 'R200',
        description: 'Pass technical training with at least 85% score',
    },
    leadership: {
        id: 'R300',
        description: 'Demonstrate leadership in a full simulation scenario',
    },
};

// ✅ Function to Retrieve Requirements
function getRequirements() {
    return requirements;
}

// ✅ Export requirements
module.exports = { requirements, getRequirements };
