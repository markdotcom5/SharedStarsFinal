// services/CommunityHub.js
const EventEmitter = require('events');
const { StudyGroup, TrainingSession, Challenge, Discussion, PeerMatch } = require('../models/CommunityModels');
const ServiceIntegrator = require('./ServiceIntegrator');
const aiGuidance = require('./aiGuidance');

class CommunityHub extends EventEmitter {
    constructor() {
        super();
        this.serviceIntegrator = ServiceIntegrator;
        this.aiGuidance = aiGuidance;
    }

    // Study Groups Management
    async createStudyGroup(userId, groupData) {
        try {
            // Get AI recommendations for group formation
            const aiRecommendations = await this.aiGuidance.processRealTimeAction(userId, {
                type: 'study_group_creation',
                data: groupData
            });

            const group = new StudyGroup({
                ...groupData,
                leader: userId,
                members: [{ user: userId, role: 'leader' }],
                aiGuidance: {
                    recommendedModules: aiRecommendations.modules,
                    groupStrengths: aiRecommendations.strengths,
                    improvementAreas: aiRecommendations.improvements,
                    lastAnalysis: new Date()
                }
            });

            await group.save();

            // Emit event for real-time updates
            this.emit('groupCreated', { groupId: group._id, group });

            return group;
        } catch (error) {
            console.error('Study Group Creation Error:', error);
            throw error;
        }
    }

    // Training Sessions
    async startTrainingSession(groupId, sessionData) {
        try {
            const group = await StudyGroup.findById(groupId);
            if (!group) throw new Error('Study group not found');

            // Get AI guidance for session
            const aiSessionGuidance = await this.aiGuidance.processRealTimeAction(group.leader, {
                type: 'training_session_start',
                groupId,
                sessionData
            });

            const session = new TrainingSession({
                group: groupId,
                ...sessionData,
                aiGuidance: aiSessionGuidance,
                startTime: new Date()
            });

            await session.save();

            // Emit event for real-time updates
            this.emit('sessionStarted', { sessionId: session._id, session });

            return session;
        } catch (error) {
            console.error('Training Session Start Error:', error);
            throw error;
        }
    }

    // Challenges Management
    async createChallenge(userId, challengeData) {
        try {
            // Get AI recommendations for challenge
            const aiRecommendations = await this.serviceIntegrator.processUserAction(userId, {
                type: 'challenge_creation',
                data: challengeData
            });

            const challenge = new Challenge({
                ...challengeData,
                creator: userId,
                aiGuidance: aiRecommendations,
                startDate: new Date(challengeData.startDate),
                endDate: new Date(challengeData.endDate)
            });

            await challenge.save();

            // Emit event for real-time updates
            this.emit('challengeCreated', { challengeId: challenge._id, challenge });

            return challenge;
        } catch (error) {
            console.error('Challenge Creation Error:', error);
            throw error;
        }
    }

    // Peer Matching
    async findPeerMatches(userId) {
        try {
            const user = await PeerMatch.findOne({ user: userId });
            if (!user) {
                throw new Error('User preferences not found');
            }

            // Get AI-powered peer recommendations
            const matches = await this.aiGuidance.processRealTimeAction(userId, {
                type: 'peer_matching',
                preferences: user.preferences
            });

            // Update peer matches
            user.matches = matches.map(match => ({
                peer: match.userId,
                compatibilityScore: match.score,
                matchReason: match.reasons,
                status: 'pending'
            }));

            await user.save();

            return user.matches;
        } catch (error) {
            console.error('Peer Matching Error:', error);
            throw error;
        }
    }

    // Discussion Forums
    async createDiscussion(userId, discussionData) {
        try {
            // Get AI moderation and analysis
            const aiAnalysis = await this.aiGuidance.processRealTimeAction(userId, {
                type: 'discussion_creation',
                data: discussionData
            });

            const discussion = new Discussion({
                ...discussionData,
                author: userId,
                aiModeration: {
                    topicAnalysis: aiAnalysis.topicAnalysis,
                    suggestedExperts: aiAnalysis.experts,
                    relatedResources: aiAnalysis.resources
                }
            });

            await discussion.save();

            // Emit event for real-time updates
            this.emit('discussionCreated', { discussionId: discussion._id, discussion });

            return discussion;
        } catch (error) {
            console.error('Discussion Creation Error:', error);
            throw error;
        }
    }

    // Progress Tracking
    async updateGroupProgress(groupId, progressData) {
        try {
            const group = await StudyGroup.findById(groupId);
            if (!group) throw new Error('Study group not found');

            // Get AI analysis of progress
            const aiAnalysis = await this.serviceIntegrator.processUserAction(group.leader, {
                type: 'group_progress_update',
                groupId,
                progress: progressData
            });

            group.metrics = {
                ...group.metrics,
                ...progressData,
                lastUpdated: new Date()
            };

            group.aiGuidance = {
                ...group.aiGuidance,
                ...aiAnalysis
            };

            await group.save();

            // Emit event for real-time updates
            this.emit('groupProgressUpdated', { groupId, progress: group.metrics });

            return group;
        } catch (error) {
            console.error('Progress Update Error:', error);
            throw error;
        }
    }
}

module.exports = new CommunityHub();