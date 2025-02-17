// middleware/vr.js
const VRSession = require('../models/vr/VRSession');

const vrMiddleware = {
    // Validate VR session
    validateSession: async (req, res, next) => {
        try {
            const sessionId = req.headers['vr-session-id'];
            if (!sessionId) {
                return res.status(400).json({ success: false, error: 'VR session ID required' });
            }

            const session = await VRSession.findById(sessionId);
            if (!session) {
                return res.status(404).json({ success: false, error: 'VR session not found' });
            }

            if (session.endTime) {
                return res.status(400).json({ success: false, error: 'VR session already ended' });
            }

            req.vrSession = session;
            next();
        } catch (error) {
            console.error('Error validating VR session:', error);
            res.status(500).json({ success: false, error: 'Failed to validate VR session' });
        }
    },

    // Track VR performance
    trackPerformance: async (req, res, next) => {
        const start = Date.now();
        res.on('finish', async () => {
            try {
                const duration = Date.now() - start;
                if (req.vrSession) {
                    req.vrSession.metrics.technical.latency = duration;
                    await req.vrSession.save();
                }
            } catch (error) {
                console.error('Error tracking VR performance:', error);
            }
        });
        next();
    },

    // Handle VR errors
    errorHandler: (err, req, res, next) => {
        console.error('VR Error:', err);
        res.status(500).json({
            success: false,
            error: 'VR system error',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};

module.exports = (req, res, next) => {
    console.log("✅ VR Middleware triggered");
    next();  // ✅ Ensures Express continues processing
};