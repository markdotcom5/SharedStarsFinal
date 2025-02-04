// services/websocketService.js
const WebSocket = require('ws');
const TrainingSession = require('../models/TrainingSession');

class WebSocketService {
    constructor(server) {
        this.wss = new WebSocket.Server({ server });
        this.clients = new Map();
        this.setupHandlers();
    }

    setupHandlers() {
        this.wss.on('connection', (ws, req) => {
            const userId = this.getUserIdFromRequest(req);
            this.clients.set(userId, ws);

            ws.on('message', async (message) => {
                const data = JSON.parse(message);
                if (data.type === 'dashboard_request') {
                    await this.updateDashboardStats(userId);
                }
            });

            ws.on('close', () => this.clients.delete(userId));
        });
    }

    async updateDashboardStats(userId) {
        const stats = await TrainingSession.aggregate([
            { $match: { userId } },
            { $group: {
                _id: null,
                credits: { $sum: "$credits" },
                rank: { $last: "$rank" },
                successRate: { $avg: "$successRate" },
                activeMissions: { 
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                }
            }}
        ]);
        
        this.broadcast('stats_update', stats[0], userId);
    }
}

module.exports = WebSocketService;