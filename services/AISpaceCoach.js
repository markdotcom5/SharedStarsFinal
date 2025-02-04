const OpenAI = require('openai');
const EventEmitter = require('events');
const Achievement = require('../models/Achievement');
const UserProgress = require('../models/UserProgress');

class AISpaceCoach extends EventEmitter {
    constructor() {
        super();
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        this.defaultModel = 'gpt-4-turbo';
        this.defaultTemperature = 0.7;
        this.defaultMaxTokens = 500;

        this.AI_MODES = { MANUAL: 'manual', ASSIST: 'assist', FULL_GUIDANCE: 'full_guidance' };

        this.performanceMetrics = {
            trainingModulesCompleted: 0,
            skillProgressTracking: {},
            userEngagementScore: 0,
            achievements: new Map(),
            progressHistory: new Map(),
            realTimeMetrics: new Map()
        };

        this.achievementTriggers = {
            SKILL_MASTERY: this.checkSkillMastery,
            PERFORMANCE_STREAK: this.checkPerformanceStreak,
            TIME_MILESTONE: this.checkTimeMilestone,
            DIFFICULTY_BREAKTHROUGH: this.checkDifficultyBreakthrough
        };
        this.responseCache = new Map();
        this.pendingRequests = new Map();

        this.initializeAchievementSystem();
    }

    initializeAchievementSystem() {
        this.achievementTypes = {
            ASSESSMENT_MASTER: { id: 'assessment_master', threshold: 90, description: 'Score 90%+ on assessments', icon: '🎯' },
            QUICK_LEARNER: { id: 'quick_learner', threshold: 5, description: 'Complete 5 modules fast', icon: '⚡' },
            CONSISTENCY_KING: { id: 'consistency_king', threshold: 7, description: '7-day training streak', icon: '👑' }
        };
    }

    async createCompletion(messages, options = {}) {
        if (!process.env.OPENAI_API_KEY) throw new Error('OpenAI API Key is missing');
        const cacheKey = JSON.stringify(messages);

        if (this.responseCache.has(cacheKey)) return this.responseCache.get(cacheKey);
        if (this.pendingRequests.has(cacheKey)) return await this.pendingRequests.get(cacheKey);

        console.log(`🚀 Making new AI request for: ${cacheKey}`);

        const aiRequest = this.openai.chat.completions.create({
            model: options.model || this.defaultModel,
            messages,
            temperature: options.temperature || this.defaultTemperature,
            max_tokens: options.maxTokens || this.defaultMaxTokens,
        });

        this.pendingRequests.set(cacheKey, aiRequest);
        const response = await aiRequest;
        this.pendingRequests.delete(cacheKey);

        const result = response.choices?.[0]?.message?.content?.trim();
        if (!result) throw new Error('OpenAI API returned no content');

        this.responseCache.set(cacheKey, result);
        return result;
    }

    async generateTrainingPlan(responses, userProfile) {
        const messages = [
            { role: 'system', content: 'You are an expert space training coach who generates adaptive training plans.' },
            { role: 'user', content: `Generate a dynamic training plan based on: ${JSON.stringify(responses)}, user profile: ${JSON.stringify(userProfile)}` }
        ];
        return this.createCompletion(messages, { maxTokens: 800, temperature: 0.7 });
    }

    async provideProblemSolvingScenario(module, userSkillLevel) {
        if (!module) throw new Error('Module is required.');

        const messages = [
            { role: 'system', content: 'Create a space training problem-solving scenario.' },
            { role: 'user', content: `Generate a problem-solving scenario for ${module}, skill level: ${userSkillLevel}` }
        ];

        return this.createCompletion(messages, { maxTokens: 600, temperature: 0.7 });
    }

    async trackProgress(userId, data) {
        if (!this.performanceMetrics.realTimeMetrics.has(userId)) {
            this.performanceMetrics.realTimeMetrics.set(userId, {
                moduleProgress: {},
                skillLevels: {},
                achievements: [],
                lastUpdate: new Date(),
            });
        }
        
        const userMetrics = this.performanceMetrics.realTimeMetrics.get(userId);
        userMetrics.lastUpdate = new Date();
        userMetrics.currentProgress = data;
        
        const unlockedAchievements = await this.checkAchievements(userId);
        if (unlockedAchievements.length > 0) {
            this.emit('achievements-unlocked', { userId, achievements: unlockedAchievements });
        }
        
        this.emit('progress-update', { userId, progress: data, timestamp: new Date() });
        return userMetrics;
    }

    async checkAchievements(userId) {
        const userProgress = await UserProgress.findOne({ userId }).populate('achievements.achievementId');
        if (!userProgress) return [];

        let unlockedAchievements = [];
        for (const checker of Object.values(this.achievementTriggers)) {
            const newAchievements = await checker(userProgress);
            if (newAchievements.length > 0) unlockedAchievements.push(...newAchievements);
        }
        return unlockedAchievements;
    }

    async unlockAchievement(userId, achievementType) {
        const achievement = this.achievementTypes[achievementType];
        if (!achievement) return null;

        if (!this.performanceMetrics.achievements.has(userId)) {
            this.performanceMetrics.achievements.set(userId, new Set());
        }
        
        const userAchievements = this.performanceMetrics.achievements.get(userId);
        if (!userAchievements.has(achievementType)) {
            userAchievements.add(achievementType);
            return { ...achievement, unlockedAt: new Date(), userId };
        }
        return null;
    }

    async checkSkillMastery(userProgress) {
        return userProgress?.trainingScore >= 95 ? [await Achievement.findOne({ type: 'SKILL_MASTERY' })] : [];
    }

    async checkPerformanceStreak(userProgress) {
        return userProgress?.trainingDays >= 10 ? [await Achievement.findOne({ type: 'PERFORMANCE_STREAK' })] : [];
    }

    async checkTimeMilestone(userProgress) {
        return userProgress?.totalTrainingTime >= 100 ? [await Achievement.findOne({ type: 'TIME_MILESTONE' })] : [];
    }

    async checkDifficultyBreakthrough(userProgress) {
        return userProgress?.completedHardModules >= 3 ? [await Achievement.findOne({ type: 'DIFFICULTY_BREAKTHROUGH' })] : [];
    }
}

module.exports = AISpaceCoach;
