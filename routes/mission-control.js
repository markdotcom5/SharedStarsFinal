// routes/mission-control.js
const express = require('express');
const { authenticate } = require('../middleware/authenticate');
const mongoose = require('mongoose');
const TrainingSession = require('../models/TrainingSession');

const createMissionControlRouter = (wss) => {
    const router = express.Router();
    
    // Initialize change streams if WebSocket server exists
    if (wss) {
        // Set up WebSocket connection handling
        wss.on("connection", async (ws, req) => {
            console.log("✅ WebSocket Client Connected to Mission Control");
            
            // Get user ID from authenticated request
            const userId = ws.authData?.userId;
            if (!userId) {
                console.warn("❌ Unauthorized WebSocket connection attempt");
                ws.close(4001, "Unauthorized");
                return;
            }

            // Initialize user's mission stats
            try {
                const initialStats = await getMissionStats(userId);
                ws.send(JSON.stringify({ 
                    type: "mission_stats_init", 
                    stats: initialStats 
                }));
            } catch (error) {
                console.error("❌ Error sending initial mission stats:", error);
            }

            // Set up change stream for this user's training sessions
            const changeStream = TrainingSession.watch([
                {
                    $match: {
                        'fullDocument.userId': new mongoose.Types.ObjectId(userId),
                        $or: [
                            { operationType: 'insert' },
                            { operationType: 'update' },
                            { operationType: 'delete' }
                        ]
                    }
                }
            ], { fullDocument: 'updateLookup' });

            changeStream.on("change", async (change) => {
                try {
                    switch (change.operationType) {
                        case "insert":
                            // New mission created
                            ws.send(JSON.stringify({
                                type: "new_mission",
                                mission: change.fullDocument
                            }));
                            break;

                        case "update":
                            // Mission updated
                            ws.send(JSON.stringify({
                                type: "mission_updated",
                                mission: change.fullDocument
                            }));
                            break;

                        case "delete":
                            // Mission deleted
                            ws.send(JSON.stringify({
                                type: "mission_deleted",
                                missionId: change.documentKey._id
                            }));
                            break;
                    }

                    // Send updated stats after any change
                    const updatedStats = await getMissionStats(userId);
                    ws.send(JSON.stringify({
                        type: "mission_stats",
                        stats: updatedStats
                    }));

                    // Send updated chart data
                    const chartData = await getMissionChartData(userId);
                    ws.send(JSON.stringify({
                        type: "chart_data_update",
                        data: chartData
                    }));

                } catch (error) {
                    console.error("❌ WebSocket change stream error:", error);
                    ws.send(JSON.stringify({
                        type: "error",
                        message: "Error processing database change"
                    }));
                }
            });

            // Handle incoming WebSocket messages
            ws.on("message", async (message) => {
                try {
                    const data = JSON.parse(message);
                    console.log("📩 Received WebSocket Message:", data);

                    switch (data.type) {
                        case "request_stats":
                            const stats = await getMissionStats(userId);
                            ws.send(JSON.stringify({
                                type: "mission_stats",
                                stats
                            }));
                            break;

                        case "request_chart_data":
                            const chartData = await getMissionChartData(userId);
                            ws.send(JSON.stringify({
                                type: "chart_data_update",
                                data: chartData
                            }));
                            break;

                        default:
                            console.log("📩 Unhandled message type:", data.type);
                    }
                } catch (error) {
                    console.error("❌ Error processing WebSocket message:", error);
                }
            });

            // Clean up on connection close
            ws.on("close", () => {
                console.log("❌ WebSocket Client Disconnected from Mission Control");
                changeStream.close();
            });
        });
    } else {
        console.warn("⚠️ WebSocket Server (wss) is not initialized.");
    }

    // Helper function for getting chart data
    async function getMissionChartData(userId) {
        const missionData = await TrainingSession.find({
            userId: mongoose.Types.ObjectId(userId),
            status: { $in: ["in-progress", "completed"] }
        })
            .sort("-dateTime")
            .limit(10)
            .select("progress metrics sessionType completedTasks dateTime credits");

        return {
            missions: {
                labels: missionData.map(m => new Date(m.dateTime).toLocaleDateString()),
                data: missionData.map(m => m.progress)
            },
            performance: {
                labels: missionData.map(m => m.sessionType),
                data: missionData.map(m => m.metrics.overallScore)
            },
            credits: {
                labels: missionData.map(m => new Date(m.dateTime).toLocaleDateString()),
                data: missionData.map(m => m.credits)
            }
        };
    }

    // [Previous route handlers remain the same...]

    return router;
};

module.exports = createMissionControlRouter;