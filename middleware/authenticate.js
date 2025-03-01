// Load environment variables
const dotenv = require("dotenv");
dotenv.config();
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
                success: false,
                error: "Authentication required",
                message: "Please provide a valid Bearer token.",
            });
        }

        const token = authHeader.replace("Bearer ", "").trim();
        const decoded = jwt.verify(token, SECRET_KEY);

        console.log("🔓 Token Decoded:", decoded);

        // Ensure ObjectId is properly required
        const { ObjectId } = require("mongodb");

        // Attach user details to the request object
        req.user = {
            _id: new ObjectId(decoded.userId),
            role: decoded.role,
            email: decoded.email || null, // Ensure email is optional but present
        };

        next();
    } catch (error) {
        console.error("❌ Authentication Error:", error);

        let errorMessage = "Authentication failed";
        if (error.name === "TokenExpiredError") {
            errorMessage = "Token expired. Please log in again.";
        } else if (error.name === "JsonWebTokenError") {
            errorMessage = "Invalid token provided.";
        }

        return res.status(401).json({
            success: false,
            error: errorMessage,
        });
    }
};

// WebSocket Authentication Function
function authenticateWebSocket(req) {
    try {
        const params = new URLSearchParams(req.url.split("?")[1]);
        const token = params.get("token");

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

// ✅ WebSocket Server Setup
const setupWebSocketServer = (server) => {
    const wss = new WebSocket.Server({ server });
    const clients = new Map();

    wss.on("connection", (ws, req) => {
        const authData = authenticateWebSocket(req);
        if (!authData) {
            console.warn("⚠️ WebSocket authentication failed: Closing connection.");
            ws.close();
            return;
        }

        const { userId, role } = authData;
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

    return { wss, broadcastMessage: (userIds, message) => {
        userIds.forEach((userId) => {
            const client = clients.get(userId);
            if (client && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(message));
            }
        });
    }};
};

// ✅ Require Role Middleware
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({
                success: false,
                message: `Access denied: You must be a ${role} to perform this action.`,
            });
        }
        next();
    };
};

// ✅ Training Module Schema
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

// ✅ Schema Methods
moduleSchema.methods.getSummary = function () {
    if (!this.name || !this.category || !this.description) {
        return "Incomplete module details.";
    }
    return `${this.name} (${this.category}) - ${this.description}`;
};

moduleSchema.methods.generateAIContent = async function (prompt) {
    try {
        const openai = require("openai");
        const openaiClient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        const response = await openaiClient.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "system", content: `Generate a detailed explanation for the module: ${prompt}` }],
        });

        return response.choices[0]?.message?.content?.trim() || "No response from AI.";
    } catch (error) {
        console.error("❌ Error generating AI content:", error);
        throw new Error("AI content generation failed.");
    }
};

// ✅ Final Export
module.exports = { 
    authenticate, 
    requireRole, 
    authenticateWebSocket, 
    setupWebSocketServer 
};
