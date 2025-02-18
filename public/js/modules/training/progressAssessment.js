// public/js/modules/training/progressAssessment.js

class ProgressAssessment {
    constructor(fsdTraining, aiGuidance) {
        this.fsd = fsdTraining;
        this.aiGuidance = aiGuidance;
        this.assessmentData = {
            moduleScores: {},
            skillLevels: {},
            completedTasks: new Set(),
            achievements: [],
        };
    }

    async evaluatePerformance(moduleId, performanceData) {
        const { completionTime, accuracy, interactions, challengesCompleted, biometricData } =
            performanceData;

        // Calculate comprehensive score
        const score = this.calculateScore({
            completionTime,
            accuracy,
            interactions,
            challengesCompleted,
            biometricData,
        });

        // Update module scores
        this.assessmentData.moduleScores[moduleId] = score;

        // Get AI guidance based on performance & biometric feedback
        const guidance = await this.aiGuidance.provideGuidance({
            focusTime: completionTime,
            interactionRate: interactions / completionTime,
            quizResults: [accuracy * 100],
            completionTime,
            practiceResults: [score * 100],
            biometricData,
        });

        // Check for achievements
        const newAchievements = this.checkAchievements(moduleId, score, biometricData);

        return {
            score,
            guidance,
            achievements: newAchievements,
            nextSteps: guidance.nextSteps,
        };
    }

    calculateScore(data) {
        const weights = {
            completionTime: 0.2,
            accuracy: 0.4,
            interactions: 0.2,
            challengesCompleted: 0.1,
            biometricEfficiency: 0.1,
        };

        // Normalize completion time (faster is better, up to a point)
        const normalizedTime = Math.min(1, 600 / Math.max(data.completionTime, 300));

        // Biometric efficiency score
        const biometricScore = data.biometricData
            ? this.calculateBiometricScore(data.biometricData)
            : 1;

        // Calculate weighted score
        const score =
            normalizedTime * weights.completionTime +
            data.accuracy * weights.accuracy +
            Math.min(1, data.interactions / 10) * weights.interactions +
            Math.min(1, data.challengesCompleted / 5) * weights.challengesCompleted +
            biometricScore * weights.biometricEfficiency;

        return Math.round(score * 100) / 100;
    }

    calculateBiometricScore(biometricData) {
        const { heartRate, oxygenLevel, stressLevel } = biometricData;
        let score = 1;

        if (heartRate > 150) score -= 0.2;
        if (oxygenLevel < 95) score -= 0.3;
        if (stressLevel > 7) score -= 0.3;

        return Math.max(0.5, score); // Ensure minimum threshold
    }

    checkAchievements(moduleId, score, biometricData) {
        const newAchievements = [];

        // Check for high-performance achievements
        if (score >= 0.9) {
            newAchievements.push({
                type: 'excellence',
                title: 'Excellence in Space Training',
                description: 'Achieved 90% or higher in a training module',
            });
        }

        if (this.getCompletedModulesCount() >= 5) {
            newAchievements.push({
                type: 'dedication',
                title: 'Dedicated Space Cadet',
                description: 'Completed 5 training modules',
            });
        }

        // Check for biometric efficiency achievements
        if (biometricData && biometricData.heartRate < 120 && biometricData.stressLevel < 5) {
            newAchievements.push({
                type: 'calm_under_pressure',
                title: 'Calm Under Pressure',
                description: 'Maintained low stress and heart rate under training conditions',
            });
        }

        this.assessmentData.achievements.push(...newAchievements);
        return newAchievements;
    }

    getCompletedModulesCount() {
        return Object.keys(this.assessmentData.moduleScores).length;
    }

    generateProgressReport() {
        const totalModules = Object.keys(this.assessmentData.moduleScores).length;
        const averageScore =
            Object.values(this.assessmentData.moduleScores).reduce((acc, curr) => acc + curr, 0) /
            totalModules;

        return {
            totalModulesCompleted: totalModules,
            averageScore: Math.round(averageScore * 100) / 100,
            achievements: this.assessmentData.achievements,
            skillLevels: this.calculateSkillLevels(),
            recommendedFocus: this.getRecommendedFocus(),
        };
    }

    calculateSkillLevels() {
        return {
            physical: this.calculateSkillLevel('physical'),
            technical: this.calculateSkillLevel('technical'),
            simulation: this.calculateSkillLevel('simulation'),
        };
    }

    calculateSkillLevel(skillType) {
        const relevantModules = Object.entries(this.assessmentData.moduleScores).filter(
            ([moduleId]) => moduleId.startsWith(skillType)
        );

        if (relevantModules.length === 0) return 0;

        const averageScore =
            relevantModules.reduce((acc, [, score]) => acc + score, 0) / relevantModules.length;

        return Math.round(averageScore * 100) / 100;
    }

    getRecommendedFocus() {
        const skillLevels = this.calculateSkillLevels();
        const lowestSkill = Object.entries(skillLevels).reduce(
            (acc, [skill, level]) => (level < acc.level ? { skill, level } : acc),
            { skill: '', level: Infinity }
        );

        return {
            skill: lowestSkill.skill,
            currentLevel: lowestSkill.level,
            recommendedModules: this.getRecommendedModules(lowestSkill.skill),
        };
    }
}

export default ProgressAssessment;
