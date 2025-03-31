// middleware/authenticate.js
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

// Authenticate middleware
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const token = authHeader.replace("Bearer ", "").trim();
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      _id: new ObjectId(decoded.userId),
      role: decoded.role,
      email: decoded.email || null
    };
    next();
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
};

// RequireRole middleware
const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: "Forbidden: incorrect role." });
  }
  next();
};

// Temporarily dummy WebSocket functions to avoid errors
const authenticateWebSocket = () => {};
const setupWebSocketServer = () => {};

// Explicitly export ALL middleware functions correctly
module.exports = {
  authenticate,
  requireRole,
  authenticateWebSocket,
  setupWebSocketServer
};

