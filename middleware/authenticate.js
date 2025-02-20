// Load environment variables
require("dotenv").config();
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const mongoose = require("mongoose");
const SECRET_KEY = process.env.JWT_SECRET; // Ensure this is set in .env

// Middleware: Authenticate HTTP Requests
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ 
                error: "Authentication required",
                message: "Please provide a valid Bearer token" 
            });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log("Token decoded:", decoded);

        // Add ObjectId requirement at the top of the file
        const { ObjectId } = require('mongodb');

        // Set user info on request
        req.user = {
            _id: new ObjectId(decoded.userId),
            role: decoded.role,
            email: decoded.email // Add email if it exists in token
        };

        next();
    } catch (error) {
        console.error("Auth Error:", error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: "Token expired",
                message: "Your session has expired. Please log in again."
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: "Invalid token",
                message: "Authentication failed. Invalid token provided."
            });
        }

        res.status(401).json({
            success: false,
            message: 'Authentication failed',
            error: error.message
        });
    }
};

module.exports = authenticate;
// WebSocket Authentication Function
function authenticateWebSocket(req) {
    try {
        const params = new URLSearchParams(req.url.split('?')[1]);
        const token = params.get('token');

        if (!token) {
            console.warn("❌ No token provided for WebSocket connection.");
            return null;
        }

        // Verify JWT Token
        const decoded = jwt.verify(token, SECRET_KEY);
        console.log("✅ WebSocket Token Verified:", decoded);
        
        return decoded; // Return user info
    } catch (error) {
        console.error("❌ Invalid WebSocket token:", error.message);
        return null;
    }
}

// ✅ WebSocket Server Setup (UPDATED)
const setupWebSocketServer = (server) => {
    const { wss } = require("../app");  // ✅ Use the WebSocket instance from `app.js`
    const clients = new Map(); // Store userId to WebSocket instance

    wss.on("connection", (ws, req) => {
        const { userId, role } = req.authData;
        clients.set(userId, ws);

        ws.isAlive = true;
        ws.on("pong", () => (ws.isAlive = true));

        ws.on("message", (message) => {
            console.log(`📩 Message from ${userId}: ${message}`);
        });

        ws.on("close", () => {
            clients.delete(userId);
            console.log(`❌ Connection closed for user ${userId}`);
        });

        ws.on("error", (error) => {
            console.error(`❌ WebSocket error for user ${userId}:`, error);
        });
    });

    // ✅ Keep WebSocket Connections Alive
    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                console.warn("⚠️ Terminating dead WebSocket connection.");
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, 30000);

    // ✅ Handle WebSocket Authentication During Connection Upgrade
    server.on("upgrade", (request, socket, head) => {
        const authData = authenticateWebSocket(request);
        if (!authData) {
            console.warn("⚠️ WebSocket authentication failed: Closing connection.");
            socket.destroy();
            return;
        }

        request.authData = authData;

        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit("connection", ws, request);
        });
    });

    // ✅ Broadcast Messages to Specific Users
    const broadcastMessage = (userIds, message) => {
        userIds.forEach((userId) => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    };

    return { wss, broadcastMessage };
};

// ✅ Training Module Schema (Kept Your Original Schema)
const moduleSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            enum: [
                "Physical",
                "Mental",
                "Psychological",
                "Spiritual",
                "Technical",
                "Social",
                "Exploration",
                "Creative",
            ],
        },
        type: { type: String, enum: ["Training", "Simulation", "Assessment"], required: true },
        difficulty: { type: String, enum: ["Beginner", "Intermediate", "Advanced", "Expert"], required: true },
        prerequisites: { type: [String], default: [] },
        description: { type: String, required: true, trim: true },
        structuredContent: { type: String, default: "" },
        aiGuidance: { type: String, default: "" },
        metrics: { type: Object, default: {} },
        groupFeatures: { type: Object, default: {} },
        progress: { type: Number, default: 0, min: 0, max: 100 },
        points: { type: Number, default: 0 },
        videoLinks: { type: [String], default: [] },
        userLinks: { type: [String], default: [] },
    },
    { timestamps: true }
);

// ✅ Schema Methods (Kept Your Original Logic)
moduleSchema.methods.getSummary = function () {
    return `${this.name} (${this.category}) - ${this.description}`;
};

moduleSchema.methods.generateAIContent = async function (prompt) {
    try {
        const response = await openai.chat.completions.create({
            model: "text-davinci-003",
            messages: [{ role: "user", content: `Generate a detailed explanation for the module: ${prompt}` }],
        });
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("Error generating AI content:", error);
        throw new Error("Failed to generate AI content");
    }
};
// ✅ Require Role Middleware (Add This at the Top)
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: "Access denied: Insufficient permissions" });
        }
        next();
    };
};

// ✅ Export Middleware and Functions (Keep This at the Bottom)
module.exports = {
    authenticate,             // Ensure this function exists
    requireRole,              // Now properly defined
    authenticateWebSocket,    // Ensure this function exists
    setupWebSocketServer,     // Ensure this function exists
};
