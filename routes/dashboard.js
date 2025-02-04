// routes/dashboard.js
const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authenticate");
const mongoose = require("mongoose");
const TrainingSession = require("../models/TrainingSession");

// ✅ Ensure WebSocket is properly passed from app.js
let wss;
module.exports = (webSocketServer) => {
    wss = webSocketServer;
};

// ✅ Render Dashboard Page
router.get("/", authenticate, (req, res) => {
    res.render("dashboard");
});

// ✅ WebSocket Connection
if (wss) {
    wss.on("connection", (ws) => {
        console.log("✅ WebSocket Client Connected to Dashboard");

        ws.on("message", (message) => {
            console.log("📩 Received WebSocket Message:", message);
        });

        ws.on("close", () => {
            console.log("❌ WebSocket Client Disconnected");
        });

        // ✅ Listen for Database Changes
        const changeStream = TrainingSession.watch();
        changeStream.on("change", async (change) => {
            try {
                if (change.operationType === "update" || change.operationType === "insert") {
                    const stats = await getStats(change.fullDocument.userId);
                    ws.send(JSON.stringify({ type: "stats", stats }));
                }
            } catch (error) {
                console.error("❌ WebSocket change stream error:", error);
            }
        });
    });
} else {
    console.warn("⚠️ WebSocket Server (wss) is not initialized.");
}

// ✅ Function to Get User Stats
async function getStats(userId) {
    const stats = await TrainingSession.aggregate([
        {
            $match: { userId: new mongoose.Types.ObjectId(userId) }
        },
        {
            $group: {
                _id: null,
                totalPoints: { $sum: "$points" },
                avgScore: { $avg: "$metrics.overallScore" },
                activeSessions: {
                    $sum: { $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0] }
                }
            }
        }
    ]);

    return {
        points: stats[0]?.totalPoints || 0,
        successRate: stats[0]?.avgScore || 0,
        activeMissions: stats[0]?.activeSessions || 0
    };
}

// ✅ Route to Fetch User Stats
router.get("/stats", authenticate, async (req, res) => {
    try {
        const stats = await getStats(req.user._id);
        res.json(stats);
    } catch (error) {
        console.error("❌ Dashboard stats error:", error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});

// ✅ Route to Get Active Mission
router.get("/mission", authenticate, async (req, res) => {
    try {
        const mission = await TrainingSession.findOne({
            userId: req.user._id,
            status: "in-progress"
        }).sort("-dateTime");

        if (!mission) {
            return res.status(404).json({ message: "No active mission found" });
        }

        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Route to Fetch Progress Data for Charts
router.get("/charts", authenticate, async (req, res) => {
    try {
        const progressData = await TrainingSession.find({
            userId: req.user._id,
            status: { $in: ["in-progress", "completed"] }
        })
            .sort("-dateTime")
            .limit(10)
            .select("progress metrics sessionType completedTasks dateTime");

        const chartData = {
            progress: {
                labels: progressData.map((p) => new Date(p.dateTime).toLocaleDateString()),
                data: progressData.map((p) => p.progress)
            },
            achievements: {
                labels: progressData.map((p) => p.sessionType),
                data: progressData.map((p) => p.metrics.overallScore)
            }
        };

        res.json(chartData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Route to Create a New Mission
router.post("/mission", authenticate, async (req, res) => {
    try {
        const mission = new TrainingSession({
            userId: req.user._id,
            sessionType: req.body.type,
            moduleId: `MISSION-${Date.now()}`,
            status: req.body.status,
            points: 0,
            metrics: { overallScore: 0 }
        });

        await mission.save();
        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ Route to Update Mission Progress
router.patch("/mission/:id", authenticate, async (req, res) => {
    try {
        const mission = await TrainingSession.findByIdAndUpdate(
            req.params.id,
            {
                $set: {
                    progress: req.body.progress,
                    "metrics.overallScore": req.body.metrics.overallScore,
                    lastUpdated: new Date()
                }
            },
            { new: true }
        );

        if (!mission) {
            return res.status(404).json({ error: "Mission not found" });
        }

        res.json(mission);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
