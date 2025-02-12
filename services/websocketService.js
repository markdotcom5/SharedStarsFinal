// services/websocketService.js
const WebSocket = require('ws');
const TrainingSession = require('../models/TrainingSession');

class WebSocketService {
    constructor(server) {
        // Use the existing server instead of creating new one
        this.wss = new WebSocket.Server({ 
            server,
            // Remove port to avoid conflicts
            noServer: true 
        });
        this.clients = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        this.wss.on('connection', (ws, req) => {
            const userId = this.getUserIdFromRequest(req);
            this.clients.set(userId, ws);

            ws.on('message', async (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'dashboard_request') {
                        await this.updateDashboardStats(userId);
                    }
                } catch (error) {
                    console.error('Error processing message:', error);
                }
            });

            ws.on('close', () => this.clients.delete(userId));
        });
    }

    getUserIdFromRequest(req) {
        // Add your user ID extraction logic here
        // This is a placeholder - implement based on your auth strategy
        return req.headers['user-id'] || 'anonymous';
    }

    broadcast(type, data, targetUserId = null) {
        this.wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                if (!targetUserId || this.clients.get(targetUserId) === client) {
                    client.send(JSON.stringify({ type, data }));
                }
            }
        });
    }

    async updateDashboardStats(userId) {
        try {
            const stats = await TrainingSession.aggregate([
                { $match: { userId } },
                {
                    $group: {
                        _id: null,
                        credits: { $sum: "$credits" },
                        rank: { $last: "$rank" },
                        successRate: { $avg: "$successRate" },
                        activeMissions: {
                            $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                        }
                    }
                }
            ]);
            this.broadcast('stats_update', stats[0], userId);
        } catch (error) {
            console.error('Error updating dashboard stats:', error);
        }
    }
}

module.exports = WebSocketService;