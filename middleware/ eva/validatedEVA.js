const jwt = require('jsonwebtoken');
const { authenticate } = require('../authenticate');
const EVASession = require('../../models/eva/EVASession');

// Base authentication using your existing middleware
const authenticateEVA = [
    authenticate, // Your base authentication
    async (req, res, next) => {
        try {
            // Check for required EVA certifications
            const { user } = req;

            // Verify user has completed prerequisites
            const hasPrerequisites = await verifyPrerequisites(user._id);
            if (!hasPrerequisites) {
                return res.status(403).json({
                    error: 'Prerequisites required',
                    message:
                        'Complete required Physical and Technical training before starting EVA operations',
                });
            }

            // Check for active EVA sessions
            const activeSession = await EVASession.findOne({
                userId: user._id,
                status: { $in: ['pending', 'in-progress'] },
            });

            if (activeSession) {
                req.activeEVASession = activeSession;
            }

            next();
        } catch (error) {
            console.error('❌ EVA Authentication Error:', error);
            res.status(500).json({
                error: 'EVA authentication failed',
                message: 'Error verifying EVA training requirements',
            });
        }
    },
];

// Verify user has completed required training
async function verifyPrerequisites(userId) {
    try {
        const UserProgress = require('../../models/UserProgress');
        const progress = await UserProgress.findOne({ userId });

        if (!progress) return false;

        // Check for required certifications
        const requiredModules = ['core-phys-001', 'core-tech-001'];
        return requiredModules.every((moduleId) => progress.completedModules?.includes(moduleId));
    } catch (error) {
        console.error('❌ Prerequisite Check Error:', error);
        return false;
    }
}

// Validate EVA session status
const validateEVASession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await EVASession.findOne({
            sessionId,
            userId: req.user._id,
        });

        if (!session) {
            return res.status(404).json({
                error: 'Session not found',
                message: 'EVA session not found or access denied',
            });
        }

        if (session.status === 'completed') {
            return res.status(400).json({
                error: 'Session completed',
                message: 'This EVA session is already completed',
            });
        }

        req.evaSession = session;
        next();
    } catch (error) {
        console.error('❌ Session Validation Error:', error);
        res.status(500).json({
            error: 'Session validation failed',
            message: 'Error validating EVA session',
        });
    }
};

// Validate safety requirements
const validateSafetyRequirements = async (req, res, next) => {
    try {
        const { safetyChecks } = req.body;
        const minimumRequirements = {
            oxygenLevel: 85,
            suitPressure: 4.3,
            communicationCheck: true,
            batteryLevel: 20,
        };

        const failures = Object.entries(minimumRequirements).filter(([key, minValue]) => {
            const value = safetyChecks?.[key];
            return typeof value === 'undefined' || value < minValue;
        });

        if (failures.length > 0) {
            return res.status(400).json({
                error: 'Safety check failed',
                failures: failures.map(([key]) => key),
                message: 'Safety requirements not met',
            });
        }

        next();
    } catch (error) {
        console.error('❌ Safety Validation Error:', error);
        res.status(500).json({
            error: 'Safety validation failed',
            message: 'Error validating safety requirements',
        });
    }
};

// WebSocket authentication for real-time EVA monitoring
const authenticateEVAWebSocket = (request) => {
    try {
        const params = new URLSearchParams(request.url.split('?')[1]);
        const token = params.get('token');
        const sessionId = params.get('sessionId');

        if (!token || !sessionId) {
            console.warn('❌ Missing token or sessionId for EVA WebSocket connection');
            return null;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return {
            userId: decoded.userId,
            sessionId,
            role: decoded.role,
        };
    } catch (error) {
        console.error('❌ Invalid EVA WebSocket token:', error);
        return null;
    }
};

module.exports = {
    authenticateEVA,
    validateEVASession,
    validateSafetyRequirements,
    authenticateEVAWebSocket,
};
