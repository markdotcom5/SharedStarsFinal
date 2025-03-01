// public/js/modules/training/progressAssessment.js

class ProgressAssessment {
    constructor(fsdTraining, aiGuidance) {
        this.fsd = fsdTraining;
        this.aiGuidance = aiGuidance;
        this.assessmentData = {
            moduleScores: {},
            skillLevels: {},
            completedTasks: new Set(),
            achievements: []
        };
    }
  
    async evaluatePerformance(moduleId, performanceData) {
        const {
            completionTime,
            accuracy,
            interactions,
            challengesCompleted
        } = performanceData;

        // Calculate comprehensive score
        const score = this.calculateScore({
            completionTime,
            accuracy,
            interactions,
            challengesCompleted
        });

        // Update module scores
        this.assessmentData.moduleScores[moduleId] = score;

        // Get AI guidance based on performance
        const guidance = await this.aiGuidance.provideGuidance({
            focusTime: completionTime,
            interactionRate: interactions / completionTime,
            quizResults: [accuracy * 100],
            completionTime,
            practiceResults: [score * 100]
        });

        // Check for achievements
        const newAchievements = this.checkAchievements(moduleId, score);

        return {
            score,
            guidance,
            achievements: newAchievements,
            nextSteps: guidance.nextSteps
        };
    }

    calculateScore(data) {
        const weights = {
            completionTime: 0.2,
            accuracy: 0.4,
            interactions: 0.2,
            challengesCompleted: 0.2
        };

        // Normalize completion time (faster is better, up to a point)
        const normalizedTime = Math.min(1, 600 / Math.max(data.completionTime, 300));
        
        // Calculate weighted score
        const score = 
            (normalizedTime * weights.completionTime) +
            (data.accuracy * weights.accuracy) +
            (Math.min(1, data.interactions / 10) * weights.interactions) +
            (Math.min(1, data.challengesCompleted / 5) * weights.challengesCompleted);

        return Math.round(score * 100) / 100;
    }

    checkAchievements(moduleId, score) {
        const newAchievements = [];

        // Check for various achievements
        if (score >= 0.9) {
            newAchievements.push({
                type: 'excellence',
                title: 'Excellence in Space Training',
                description: 'Achieved 90% or higher in a training module'
            });
        }

        if (this.getCompletedModulesCount() >= 5) {
            newAchievements.push({
                type: 'dedication',
                title: 'Dedicated Space Cadet',
                description: 'Completed 5 training modules'
            });
        }

        // Add achievements to history
        this.assessmentData.achievements.push(...newAchievements);

        return newAchievements;
    }

    getCompletedModulesCount() {
        return Object.keys(this.assessmentData.moduleScores).length;
    }

    generateProgressReport() {
        const totalModules = Object.keys(this.assessmentData.moduleScores).length;
        const averageScore = Object.values(this.assessmentData.moduleScores)
            .reduce((acc, curr) => acc + curr, 0) / totalModules;

        return {
            totalModulesCompleted: totalModules,
            averageScore: Math.round(averageScore * 100) / 100,
            achievements: this.assessmentData.achievements,
            skillLevels: this.calculateSkillLevels(),
            recommendedFocus: this.getRecommendedFocus()
        };
    }

    calculateSkillLevels() {
        const skills = {
            physical: this.calculateSkillLevel('physical'),
            technical: this.calculateSkillLevel('technical'),
            simulation: this.calculateSkillLevel('simulation')
        };

        return skills;
    }

    calculateSkillLevel(skillType) {
        const relevantModules = Object.entries(this.assessmentData.moduleScores)
            .filter(([moduleId]) => moduleId.startsWith(skillType));
        
        if (relevantModules.length === 0) return 0;

        const averageScore = relevantModules
            .reduce((acc, [, score]) => acc + score, 0) / relevantModules.length;

        return Math.round(averageScore * 100) / 100;
    }

    getRecommendedFocus() {
        const skillLevels = this.calculateSkillLevels();
        const lowestSkill = Object.entries(skillLevels)
            .reduce((acc, [skill, level]) => 
                level < acc.level ? { skill, level } : acc,
                { skill: '', level: Infinity }
            );

        return {
            skill: lowestSkill.skill,
            currentLevel: lowestSkill.level,
            recommendedModules: this.getRecommendedModules(lowestSkill.skill)
        };
    }

    getRecommendedModules(skillType) {
        // Module recommendations based on skill type
        const recommendations = {
            physical: [
                "Zero-G Movement Mastery",
                "Advanced Cardiovascular Training",
                "Spatial Orientation Challenge"
            ],
            technical: [
                "Systems Integration Advanced",
                "Emergency Protocol Mastery",
                "Navigation Systems Expert"
            ],
            simulation: [
                "Complex Mission Scenarios",
                "Advanced Docking Procedures",
                "Crisis Management Simulation"
            ]
        };

        return recommendations[skillType] || [];
    }
}

export default ProgressAssessment;