const creditThresholds = {
    bronze: 100,
    silver: 300,
    gold: 600,
    platinum: 1000
};

// ✅ Function to Check User Level Based on Credits
function getCreditLevel(credits) {
    if (credits >= creditThresholds.platinum) return 'Platinum';
    if (credits >= creditThresholds.gold) return 'Gold';
    if (credits >= creditThresholds.silver) return 'Silver';
    return 'Bronze';
}

// ✅ Export thresholds
module.exports = { creditThresholds, getCreditLevel };
