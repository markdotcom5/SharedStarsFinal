// services/taskCompletionService.js
const UserProgress = require('../models/UserProgress');

class TaskCompletionService {
    async recordTaskCompletion(userId, moduleId, sessionId, exerciseResults) {
        try {
            const progress = await UserProgress.findOne({ userId });
            const moduleProgress = progress.moduleProgress.find((mp) =>
                mp.moduleId.equals(moduleId)
            );

            if (!moduleProgress) {
                throw new Error('Module progress not found');
            }

            const session = moduleProgress.sessions.find((s) => s.sessionId === sessionId);
            if (session) {
                session.completions += 1;
                session.attempts.push({
                    date: new Date(),
                    exercises: exerciseResults,
                });

                // Calculate and update session score
                const score = this.calculateSessionScore(exerciseResults);
                if (score > session.bestScore) {
                    session.bestScore = score;
                }
            }

            // Update overall progress
            moduleProgress.overallProgress = this.calculateOverallProgress(moduleProgress);
            await progress.save();

            // Award credits
            await this.awardCredits(userId, moduleId, sessionId, score);

            return moduleProgress;
        } catch (error) {
            console.error('Error recording task completion:', error);
            throw error;
        }
    }

    calculateSessionScore(exerciseResults) {
        // Implementation of score calculation based on exercise results
        return Math.average(exerciseResults.map((e) => e.score));
    }

    calculateOverallProgress(moduleProgress) {
        // Implementation of overall progress calculation
        return (
            (moduleProgress.sessions.reduce((acc, s) => acc + s.completions, 0) /
                (moduleProgress.sessions.length * moduleProgress.requiredCompletions)) *
            100
        );
    }
}

module.exports = new TaskCompletionService();
