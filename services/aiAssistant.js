// services/aiAssistant.js
const OpenAI = require('openai');
const User = require('../models/User');

class AIAssistant {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.defaultModel = 'gpt-4-turbo-preview';
        this.systemInstructions = {
            certification: this.getCertificationPrompt(),
            achievement: this.getAchievementPrompt()
        };
    }

    // System prompts - keeping original implementation
    getCertificationPrompt() {
        return `As a space training certification analyst, evaluate:
            - Current certification status and progress
            - Key performance metrics and milestones
            - Estimated completion timeline
            - Critical skill gaps and recommendations
            - Required actions for improvement
            - Safety and compliance status`;
    }

    getAchievementPrompt() {
        return `Analyze astronaut training achievements focusing on:
            - Completion rates and success metrics
            - Skill development trajectory
            - Performance benchmarks
            - Training efficiency metrics
            - Peer group comparisons
            - Safety protocol adherence`;
    }

    // Base helper methods - keeping original implementation
    extractMetrics(data) {
        try {
            return {
                completionRate: this.calculateCompletionRate(data),
                skillLevels: this.assessSkillLevels(data),
                safetyCompliance: this.checkSafetyCompliance(data)
            };
        } catch (error) {
            console.error('Metrics Extraction Error:', error);
            return null;
        }
    }

    calculateCompletionRate(data) {
        const completed = data.filter(item => item.status === 'completed').length;
        return (completed / data.length) * 100;
    }

    assessSkillLevels(data) {
        return data.reduce((acc, item) => {
            acc[item.skill] = item.level;
            return acc;
        }, {});
    }

    checkSafetyCompliance(data) {
        return data.every(item => item.safetyProtocols === 'passed');
    }

    // Main analysis methods - keeping original implementation
    async analyzeCertificationProgress(certifications) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    {
                        role: "system",
                        content: this.systemInstructions.certification
                    },
                    {
                        role: "user",
                        content: `Analyze certification data: ${JSON.stringify(certifications)}`
                    }
                ]
            });

            const analysis = completion.choices[0].message.content;
            
            return {
                analysis,
                metrics: this.extractMetrics(certifications),
                recommendations: this.generateRecommendations(analysis),
                safetyStatus: this.checkSafetyCompliance(certifications),
                timestamp: new Date(),
                version: '2.0'
            };
        } catch (error) {
            console.error('Certification Analysis Error:', error);
            throw new Error('Failed to analyze certification progress');
        }
    }

    async analyzeAchievementProgress(achievements) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [
                    {
                        role: "system",
                        content: this.systemInstructions.achievement
                    },
                    {
                        role: "user",
                        content: `Analyze achievement data: ${JSON.stringify(achievements)}`
                    }
                ]
            });

            return {
                analysis: completion.choices[0].message.content,
                metrics: this.extractMetrics(achievements),
                trends: this.analyzePerformanceTrends(achievements),
                nextMilestones: this.identifyNextMilestones(achievements),
                safetyCompliance: this.checkSafetyCompliance(achievements),
                timestamp: new Date(),
                version: '2.0'
            };
        } catch (error) {
            console.error('Achievement Analysis Error:', error);
            throw new Error('Failed to analyze achievement progress');
        }
    }

    // Adding the Leaderboard Analysis method
    async generateLeaderboardStrategy(user, leaderboardData) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: this.defaultModel,
                messages: [{
                    role: "system",
                    content: `Generate comprehensive leaderboard strategy including:
                             - Current ranking analysis
                             - Point gap analysis to next ranks
                             - Performance comparison with top performers
                             - Specific improvement opportunities
                             - Timeline predictions for rank improvements`
                }, {
                    role: "user",
                    content: `Generate detailed strategy for:
                             User: ${JSON.stringify(user)}
                             Leaderboard: ${JSON.stringify(leaderboardData)}`
                }]
            });

            return {
                strategy: completion.choices[0].message.content,
                rankAnalysis: this.analyzeRankPosition(user, leaderboardData),
                improvementPaths: this.identifyImprovementPaths(leaderboardData),
                timeline: this.generateProgressionTimeline(user, leaderboardData),
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Leaderboard Strategy Error:', error);
            throw error;
        }
    }

    // Helper Methods
    generateRecommendations(analysis) {
        const recommendations = analysis
            .split('\n')
            .filter(line => line.includes('recommend') || line.includes('should'))
            .map(line => line.trim());
        
        return recommendations.length > 0 ? recommendations : ['No specific recommendations found'];
    }

    getMilestoneSequence() {
        return [
            { id: 'basic_training', name: 'Basic Training' },
            { id: 'advanced_theory', name: 'Advanced Theory' },
            { id: 'practical_skills', name: 'Practical Skills' },
            { id: 'simulation_training', name: 'Simulation Training' },
            { id: 'final_certification', name: 'Final Certification' }
        ];
    }

    // Additional Helper Methods
    extractCertificationMetrics(analysis) {
        try {
            return {
                completionPercentages: {},
                timeInvestment: {},
                skillLevels: {}
            };
        } catch (error) {
            console.error('Metric Extraction Error:', error);
            return {};
        }
    }

    extractCompletionPredictions(analysis) {
        try {
            return {
                estimatedCompletionDates: {},
                confidenceScores: {}
            };
        } catch (error) {
            console.error('Prediction Extraction Error:', error);
            return {};
        }
    }

    extractSkillGaps(analysis) {
        try {
            return {
                criticalGaps: [],
                recommendedFocus: [],
                priorityOrder: []
            };
        } catch (error) {
            console.error('Gap Analysis Error:', error);
            return {};
        }
    }

    calculateCompletionRates(achievements) {
        try {
            return {
                overall: 0,
                byCategory: {},
                byDifficulty: {}
            };
        } catch (error) {
            console.error('Completion Rate Calculation Error:', error);
            return {};
        }
    }

    analyzeRankPosition(user, leaderboardData) {
        try {
            return {
                currentRank: 0,
                pointsToNextRank: 0,
                competitorAnalysis: []
            };
        } catch (error) {
            console.error('Rank Analysis Error:', error);
            return {};
        }
    }

    identifyImprovementPaths(leaderboardData) {
        try {
            return {
                quickWins: [],
                mediumTermGoals: [],
                longTermStrategies: []
            };
        } catch (error) {
            console.error('Improvement Path Error:', error);
            return {};
        }
    }

    generateProgressionTimeline(user, leaderboardData) {
        try {
            return {
                milestones: [],
                predictedDates: {},
                requiredActions: []
            };
        } catch (error) {
            console.error('Timeline Generation Error:', error);
            return {};
        }
    }
}

// Export a singleton instance
module.exports = AIAssistant;
