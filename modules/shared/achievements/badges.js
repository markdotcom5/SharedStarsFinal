const badges = {
    explorer: {
        id: 'B100',
        name: 'Explorer Badge',
        description: 'Awarded for completing the first space training session'
    },
    commander: {
        id: 'B200',
        name: 'Commander Badge',
        description: 'Earned after leading a successful mission simulation'
    },
    endurance: {
        id: 'B300',
        name: 'Endurance Master',
        description: 'Awarded for completing an advanced endurance task'
    }
};

// ✅ Function to retrieve all badges
function getBadges() {
    return badges;
}

// ✅ Export badges
module.exports = { badges, getBadges };
