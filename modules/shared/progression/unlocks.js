const unlocks = {
    zeroGTraining: {
        id: 'U100',
        description:
            'Unlock advanced Zero-G movement training after completing basic space adaptation',
    },
    marsMission: {
        id: 'U200',
        description: 'Unlock Mars surface mission after completing interplanetary travel training',
    },
    commandCenter: {
        id: 'U300',
        description: 'Unlock Command Center simulations after earning Commander Certification',
    },
};

// ✅ Function to Retrieve Unlocks
function getUnlocks() {
    return unlocks;
}

// ✅ Export unlocks
module.exports = { unlocks, getUnlocks };
