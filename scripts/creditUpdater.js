const User = require('../models/User'); // Adjust path if necessary

// Subscription credits mapping
const subscriptionCredits = {
    Individual: 50,
    Family: 90, // Adjust as needed for Family tiers
    Galactic: 2048 / 12, // Prorated annual credits
};

// Function to update monthly credits
const updateMonthlyCredits = async () => {
    console.log('Running monthly credit update...');
    try {
        const users = await User.find();
        for (const user of users) {
            const credits = subscriptionCredits[user.subscription] || 0;
            user.stelTrekCredits += credits;
            user.spaceReadinessScore += credits; // Update readiness score
            await user.save();
        }
        console.log('Monthly credit update completed successfully.');
    } catch (error) {
        console.error('Failed to update monthly credits:', error.message);
    }
};

// Schedule the update for testing (replace with cron schedule in production)
(async () => {
    await updateMonthlyCredits();
})();

module.exports = { updateMonthlyCredits }; // Export for external use
