// services/certificationService.js
const UserProgress = require('../models/UserProgress');
const Module = require('../models/Module');

class CertificationService {
    async checkCertificationEligibility(userId, moduleId) {
        try {
            const [progress, module] = await Promise.all([
                UserProgress.findOne({ userId }),
                Module.findById(moduleId)
            ]);

            const moduleProgress = progress.moduleProgress.find(
                mp => mp.moduleId.equals(moduleId)
            );

            if (this.meetsRequirements(moduleProgress, module)) {
                await this.awardCertification(userId, moduleId, module);
            }
        } catch (error) {
            console.error('Error checking certification eligibility:', error);
            throw error;
        }
    }

    meetsRequirements(moduleProgress, module) {
        return (
            moduleProgress.overallProgress >= 100 &&
            this.allMilestonesAchieved(moduleProgress, module) &&
            this.assessmentsPassed(moduleProgress)
        );
    }

    async awardCertification(userId, moduleId, module) {
        try {
            const progress = await UserProgress.findOne({ userId });
            
            const certification = {
                name: module.certification.name,
                moduleId,
                earnedDate: new Date(),
                expiryDate: new Date(Date.now() + (365 * 24 * 60 * 60 * 1000)), // 1 year
                level: module.difficulty,
                creditsEarned: module.certification.creditValue
            };

            progress.certifications.push(certification);
            progress.credits.total += certification.creditsEarned;
            await progress.save();

            return certification;
        } catch (error) {
            console.error('Error awarding certification:', error);
            throw error;
        }
    }
}

module.exports = new CertificationService();