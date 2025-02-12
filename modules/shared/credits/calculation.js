// ✅ Function to Calculate Credits Earned
function calculateCredits(tasksCompleted, assessmentsPassed) {
    return tasksCompleted * 10 + assessmentsPassed * 20; // Each task = 10 credits, each assessment = 20 credits
}

// ✅ Export function
module.exports = { calculateCredits };
