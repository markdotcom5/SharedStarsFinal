// services/assessmentService.js
const UserProgress = require('../models/UserProgress');

class AssessmentService {
    async scheduleAssessment(userId, moduleId, type) {
        try {
            const progress = await UserProgress.findOne({ userId });
            const newAssessment = {
                moduleId,
                type,
                date: new Date(),
                nextAssessmentDate: this.calculateNextAssessmentDate(type)
            };
            
            progress.assessments.push(newAssessment);
            await progress.save();
            return newAssessment;
        } catch (error) {
            console.error('Error scheduling assessment:', error);
            throw error;
        }
    }

    async recordAssessmentResult(userId, moduleId, type, score, feedback) {
        try {
            const progress = await UserProgress.findOne({ userId });
            const assessment = progress.assessments.find(
                a => a.moduleId.equals(moduleId) && a.type === type
            );
            
            if (assessment) {
                assessment.score = score;
                assessment.feedback = feedback;
                assessment.date = new Date();
                await progress.save();

                // Check if certification criteria are met
                if (type === 'final' && score >= 80) {
                    await this.checkCertificationEligibility(userId, moduleId);
                }
            }
            return assessment;
        } catch (error) {
            console.error('Error recording assessment:', error);
            throw error;
        }
    }

    calculateNextAssessmentDate(type) {
        const now = new Date();
        switch(type) {
            case 'weekly':
                return new Date(now.setDate(now.getDate() + 7));
            case 'final':
                return new Date(now.setMonth(now.getMonth() + 1));
            default:
                return new Date(now.setDate(now.getDate() + 14));
        }
    }
}

module.exports = new AssessmentService();