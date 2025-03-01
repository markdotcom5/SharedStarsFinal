const { EventEmitter } = require('events');
const UserProgress = require('../models/UserProgress');

class AssessmentService extends EventEmitter {
    constructor() {
        super(); // ✅ Enables event handling
    }

    async scheduleAssessment(userId, moduleId, type) {
        try {
            const progress = await UserProgress.findOne({ userId }).lean();

            if (!progress) {
                throw new Error(`No progress found for user: ${userId}`);
            }

            const newAssessment = {
                moduleId,
                type,
                date: new Date(),
                nextAssessmentDate: this.calculateNextAssessmentDate(type),
            };

            // Push assessment and update only the needed field
            await UserProgress.updateOne(
                { userId },
                { $push: { assessments: newAssessment } }
            );

            return newAssessment;
        } catch (error) {
            console.error(`❌ Error scheduling assessment for user ${userId}:`, error);
            throw error;
        }
    }

    async recordAssessmentResult(userId, moduleId, type, score, feedback) {
        try {
            const progress = await UserProgress.findOne({ userId });

            if (!progress) {
                throw new Error(`No progress found for user: ${userId}`);
            }

            const assessment = progress.assessments.find(
                a => a.moduleId.equals(moduleId) && a.type === type
            );

            if (!assessment) {
                throw new Error(`Assessment not found for module ${moduleId} and type ${type}`);
            }

            assessment.score = score;
            assessment.feedback = feedback;
            assessment.date = new Date();

            await progress.save();

            // ✅ Emit event so other services (like AIIntegrationService) can react
            this.emit('assessment-complete', { userId, moduleId, type, score });

            // ✅ Check if certification is needed without blocking
            if (type === 'final' && score >= 80) {
                this.checkCertificationEligibility(userId, moduleId);
            }

            return assessment;
        } catch (error) {
            console.error(`❌ Error recording assessment result for user ${userId}:`, error);
            throw error;
        }
    }

    async checkCertificationEligibility(userId, moduleId) {
        try {
            console.log(`🔍 Checking certification eligibility for user ${userId}, module ${moduleId}`);
            // Add certification logic here if needed
        } catch (error) {
            console.error(`❌ Error checking certification eligibility for user ${userId}:`, error);
        }
    }

    calculateNextAssessmentDate(type) {
        const now = new Date();
        switch (type) {
            case 'weekly':
                return new Date(now.setDate(now.getDate() + 7));
            case 'final':
                return new Date(now.setMonth(now.getMonth() + 1));
            default:
                return new Date(now.setDate(now.getDate() + 14));
        }
    }
}

// ✅ Export as a ready-to-use instance
module.exports = new AssessmentService();
