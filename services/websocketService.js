const WebSocket = require('ws');
const TrainingSession = require('../models/TrainingSession');
const EVASession = require('../models/eva/EVASession');
const EVAAIService = require('./EVAAIService');
const AISpaceCoach = require('./AISpaceCoach');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({
            server,
            noServer: true,
        });
        this.clients = new Map();
        this.activeEVASessions = new Map();
        this.setupHandlers();
        this.setupAIHandlers();
    }

    setupHandlers() {
        this.wss.on('connection', (ws, req) => {
            const userId = this.getUserIdFromRequest(req);
            this.clients.set(userId, ws);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    await this.handleMessage(userId, ws, data);
                } catch (error) {
                    console.error('Error processing message:', error);
                    ws.send(
                        JSON.stringify({
                            type: 'error',
                            error: 'Failed to process message',
                        })
                    );
                }
            });

            ws.on('close', () => {
                this.clients.delete(userId);
                this.activeEVASessions.delete(userId);
            });
        });
    }

    setupAIHandlers() {
        // Listen for EVA AI Service events
        EVAAIService.on('performance-analyzed', (data) => {
            this.broadcastToUser(data.userId, 'eva_performance_update', data);
        });

        EVAAIService.on('guidance-provided', (data) => {
            this.broadcastToUser(data.userId, 'eva_guidance', data);
        });

        // Listen for AI Space Coach events
        AISpaceCoach.on('progress-update', (data) => {
            this.broadcastToUser(data.userId, 'progress_update', data);
        });
    }

    async handleMessage(userId, ws, data) {
        switch (data.type) {
            case 'dashboard_request':
                await this.updateDashboardStats(userId);
                break;

            case 'eva_session_start':
                await this.handleEVASessionStart(userId, data);
                break;

            case 'eva_telemetry_update':
                await this.handleEVATelemetry(userId, data);
                break;

            case 'eva_procedure_complete':
                await this.handleEVAProcedureComplete(userId, data);
                break;

            case 'request_ai_guidance':
                await this.handleAIGuidanceRequest(userId, data);
                break;

            case 'team_challenge_request':
                await this.handleTeamChallengeRequest(userId, data);
                break;

            default:
                console.warn(`Unknown message type: ${data.type}`);
        }
    }

    async handleEVASessionStart(userId, data) {
        try {
            // Start new EVA session
            const session = await EVASession.create({
                userId,
                startTime: new Date(),
                status: 'in-progress',
            });

            this.activeEVASessions.set(userId, session._id);

            // Initialize AI monitoring
            const aiGuidance = await EVAAIService.generateAdaptiveScenario(userId);

            this.broadcastToUser(userId, 'eva_session_started', {
                sessionId: session._id,
                guidance: aiGuidance,
            });
        } catch (error) {
            console.error('Error starting EVA session:', error);
            this.broadcastToUser(userId, 'error', {
                context: 'eva_session_start',
                message: 'Failed to start EVA session',
            });
        }
    }

    async handleEVATelemetry(userId, data) {
        try {
            const sessionId = this.activeEVASessions.get(userId);
            if (!sessionId) {
                throw new Error('No active EVA session');
            }

            // Process telemetry with AI
            const guidance = await EVAAIService.provideLiveGuidance(userId, data.telemetry);

            // Update session with telemetry
            await EVASession.findByIdAndUpdate(sessionId, {
                $push: { telemetry: data.telemetry },
            });

            this.broadcastToUser(userId, 'eva_guidance_update', guidance);
        } catch (error) {
            console.error('Error processing EVA telemetry:', error);
            this.broadcastToUser(userId, 'error', {
                context: 'eva_telemetry',
                message: 'Failed to process telemetry data',
            });
        }
    }

    async handleEVAProcedureComplete(userId, data) {
        try {
            const sessionId = this.activeEVASessions.get(userId);
            if (!sessionId) {
                throw new Error('No active EVA session');
            }

            // Analyze procedure performance
            const analysis = await EVAAIService.analyzeUserPerformance(userId, data);

            // Update session and progress
            const session = await EVASession.findById(sessionId);
            session.completedProcedures.push({
                name: data.procedure,
                completionTime: new Date(),
                performance: analysis.score,
            });
            await session.save();

            // Get next adaptive scenario if available
            const nextScenario = await EVAAIService.generateAdaptiveScenario(userId);

            this.broadcastToUser(userId, 'eva_procedure_completion', {
                analysis,
                nextScenario,
            });
        } catch (error) {
            console.error('Error completing EVA procedure:', error);
            this.broadcastToUser(userId, 'error', {
                context: 'eva_procedure',
                message: 'Failed to process procedure completion',
            });
        }
    }

    async handleAIGuidanceRequest(userId, data) {
        try {
            const guidance = await EVAAIService.provideLiveGuidance(userId, data);
            this.broadcastToUser(userId, 'ai_guidance', guidance);
        } catch (error) {
            console.error('Error getting AI guidance:', error);
            this.broadcastToUser(userId, 'error', {
                context: 'ai_guidance',
                message: 'Failed to get AI guidance',
            });
        }
    }

    async handleTeamChallengeRequest(userId, data) {
        try {
            const challenge = await EVAAIService.generateTeamChallenge(data.teamIds);
            data.teamIds.forEach((teamMemberId) => {
                this.broadcastToUser(teamMemberId, 'team_challenge', challenge);
            });
        } catch (error) {
            console.error('Error creating team challenge:', error);
            this.broadcastToUser(userId, 'error', {
                context: 'team_challenge',
                message: 'Failed to create team challenge',
            });
        }
    }

    async updateDashboardStats(userId) {
        try {
            const [trainingStats, evaStats] = await Promise.all([
                TrainingSession.aggregate([
                    { $match: { userId } },
                    {
                        $group: {
                            _id: null,
                            credits: { $sum: '$credits' },
                            rank: { $last: '$rank' },
                            successRate: { $avg: '$successRate' },
                            activeMissions: {
                                $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
                            },
                        },
                    },
                ]),
                EVASession.aggregate([
                    { $match: { userId } },
                    {
                        $group: {
                            _id: null,
                            totalEVAs: { $sum: 1 },
                            avgPerformance: { $avg: '$performanceMetrics.safetyScore' },
                            completedProcedures: { $sum: { $size: '$completedProcedures' } },
                        },
                    },
                ]),
            ]);

            this.broadcastToUser(userId, 'stats_update', {
                training: trainingStats[0],
                eva: evaStats[0],
            });
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }

    getUserIdFromRequest(req) {
        return req.headers['user-id'] || 'anonymous';
    }

    broadcastToUser(userId, type, data) {
        const client = this.clients.get(userId);
        if (client && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type, data }));
        }
    }

    broadcast(type, data, targetUserId = null) {
        this.wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                if (!targetUserId || this.clients.get(targetUserId) === client) {
                    client.send(JSON.stringify({ type, data }));
                }
            }
        });
    }
}

module.exports = WebSocketService;
