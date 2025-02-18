// creditSystem.js
const mongoose = require('mongoose');
const User = require('../models/User');
const UserProgress = require('../models/UserProgress');
const Subscription = require('../models/Subscription');
const Achievement = require('../models/achievement');
const TrainingSession = require('../models/TrainingSession');

class SpaceTimelineManager {
    constructor(userId, webSocketService) {
        this.userId = userId;
        this.webSocketService = webSocketService;
        this.userCredits = 0;
        this.subscriptionType = null;
        this.achievements = [];
        this.baselineYears = 15;
        this.initialized = false;
    }

    async initialize() {
        try {
            // Load user's current state from MongoDB
            const [user, progress, subscription] = await Promise.all([
                User.findById(this.userId),
                UserProgress.findOne({ userId: this.userId }),
                Subscription.findOne({ userId: this.userId, status: 'active' }),
            ]);

            if (!user) throw new Error('User not found');

            this.userCredits = progress?.credits || 0;
            this.subscriptionType = subscription?.type || 'free';
            this.achievements = progress?.achievements || [];

            // Calculate total credits from all sources
            await this.recalculateCredits();

            this.initialized = true;

            // Notify client of initialization
            this.webSocketService.sendToUser(this.userId, 'timeline_initialized', {
                credits: this.userCredits,
                subscriptionType: this.subscriptionType,
                achievements: this.achievements,
            });

            return true;
        } catch (error) {
            console.error('Timeline initialization error:', error);
            return false;
        }
    }

    async recalculateCredits() {
        try {
            // Get base subscription credits
            const subscriptionCredits = await this.getSubscriptionCredits();

            // Get achievement credits
            const achievementCredits = await this.getAchievementCredits();

            // Get training session credits
            const trainingCredits = await this.getTrainingCredits();

            // Calculate total
            this.userCredits = subscriptionCredits + achievementCredits + trainingCredits;

            // Update UserProgress in DB
            await UserProgress.findOneAndUpdate(
                { userId: this.userId },
                {
                    $set: {
                        credits: this.userCredits,
                        lastUpdated: new Date(),
                    },
                },
                { upsert: true }
            );

            // Notify client of credit update
            this.webSocketService.sendToUser(this.userId, 'credits_updated', {
                total: this.userCredits,
                breakdown: {
                    subscription: subscriptionCredits,
                    achievements: achievementCredits,
                    training: trainingCredits,
                },
            });

            return this.userCredits;
        } catch (error) {
            console.error('Credit recalculation error:', error);
            return this.userCredits;
        }
    }

    async getSubscriptionCredits() {
        const subscription = await Subscription.findOne({
            userId: this.userId,
            status: 'active',
        });

        const creditMap = {
            individual: 100,
            family: 250,
            elite: 1000,
            custom: (amount) => Math.floor(amount * 2),
        };

        return subscription
            ? typeof creditMap[subscription.type] === 'function'
                ? creditMap[subscription.type](subscription.amount)
                : creditMap[subscription.type] || 0
            : 0;
    }

    async getAchievementCredits() {
        const progress = await UserProgress.findOne({ userId: this.userId }).populate(
            'achievements.achievementId'
        );

        return (
            progress?.achievements.reduce((total, achievement) => {
                return total + (achievement.achievementId?.creditValue || 0);
            }, 0) || 0
        );
    }

    async getTrainingCredits() {
        const sessions = await TrainingSession.find({
            userId: this.userId,
            status: 'completed',
        });

        return sessions.reduce((total, session) => {
            return total + (session.earnedCredits || 0);
        }, 0);
    }

    async calculateTimeToLaunch() {
        const credits = await this.recalculateCredits();
        const baselineYears = 15;
        const maxReduction = 14; // Minimum 1 year
        const creditsPerYear = 1000;

        const reduction = Math.min(maxReduction, credits / creditsPerYear);
        return baselineYears - reduction;
    }

    async updatePersonalTimeline() {
        if (!this.initialized) await this.initialize();

        const yearsToLaunch = await this.calculateTimeToLaunch();
        const timelineData = {
            credits: this.userCredits,
            yearsToLaunch,
            priceCurve: this.calculatePriceCurve(yearsToLaunch),
            timelineDetails: await this.generateTimelineDetails(yearsToLaunch),
        };

        // Notify client of timeline update
        this.webSocketService.sendToUser(this.userId, 'timeline_updated', timelineData);

        return timelineData;
    }

    calculatePriceCurve(years) {
        const basePrice = 450000;
        const targetPrice = 5000;
        const steps = Math.floor(years * 12); // Monthly data points
        const priceReduction = (basePrice - targetPrice) / steps;

        return Array.from({ length: steps }, (_, i) => ({
            month: i,
            price: Math.max(targetPrice, basePrice - priceReduction * i),
        }));
    }

    async generateTimelineDetails(years) {
        const now = new Date();
        const target = new Date();
        target.setFullYear(target.getFullYear() + years);

        return {
            startDate: now,
            targetDate: target,
            milestones: await this.generateMilestones(years),
        };
    }

    async generateMilestones(years) {
        // Get uncompleted achievements that could affect timeline
        const potentialAchievements = await Achievement.find({
            _id: { $nin: this.achievements.map((a) => a.achievementId) },
        });

        return potentialAchievements.map((achievement) => ({
            type: 'achievement',
            name: achievement.name,
            credits: achievement.creditValue,
            potentialTimeReduction: achievement.creditValue / 1000, // years
        }));
    }

    // New methods for real-time updates
    async awardAchievement(achievementId) {
        try {
            const achievement = await Achievement.findById(achievementId);
            if (!achievement) return false;

            // Add achievement to user's progress
            await UserProgress.findOneAndUpdate(
                { userId: this.userId },
                {
                    $push: {
                        achievements: {
                            achievementId,
                            earnedDate: new Date(),
                        },
                    },
                },
                { upsert: true }
            );

            // Update credits and notify client
            await this.recalculateCredits();
            this.webSocketService.sendToUser(this.userId, 'achievement_unlocked', {
                achievement: achievement.name,
                credits: achievement.creditValue,
            });

            return true;
        } catch (error) {
            console.error('Error awarding achievement:', error);
            return false;
        }
    }

    // Handle real-time training updates
    async updateTrainingProgress(sessionId, progress) {
        try {
            const session = await TrainingSession.findByIdAndUpdate(
                sessionId,
                {
                    $set: {
                        progress,
                        lastUpdated: new Date(),
                    },
                },
                { new: true }
            );

            if (session.progress >= 100) {
                session.status = 'completed';
                await session.save();

                // Recalculate credits and update timeline
                await this.recalculateCredits();
                await this.updatePersonalTimeline();
            }

            this.webSocketService.sendToUser(this.userId, 'training_progress_updated', {
                sessionId,
                progress,
                status: session.status,
            });

            return true;
        } catch (error) {
            console.error('Error updating training progress:', error);
            return false;
        }
    }
}

module.exports = SpaceTimelineManager;
