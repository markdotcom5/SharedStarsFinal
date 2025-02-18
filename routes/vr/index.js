// routes/vr/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/authenticate');
const VRSession = require('../../models/vr/VRSession');
const PhysicalPropsIntegration = require('../../modules/vr/props/PhysicalPropsIntegration');
const ImmersiveScenarios = require('../../modules/vr/scenarios/ImmersiveScenarios');

// Initialize VR session
router.post('/session/start', authenticate, async (req, res) => {
    try {
        const { deviceType, scenario } = req.body;
        const session = new VRSession({
            userId: req.user._id,
            deviceType,
            scenario,
        });
        await session.save();
        res.json({ success: true, sessionId: session._id });
    } catch (error) {
        console.error('Error starting VR session:', error);
        res.status(500).json({ success: false, error: 'Failed to start VR session' });
    }
});

// Get available scenarios
router.get('/scenarios', authenticate, async (req, res) => {
    try {
        const scenarios = await ImmersiveScenarios.getAvailableScenarios(req.user._id);
        res.json({ success: true, scenarios });
    } catch (error) {
        console.error('Error fetching scenarios:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch scenarios' });
    }
});

// Initialize physical props
router.post('/props/initialize', authenticate, async (req, res) => {
    try {
        const { propType, propName } = req.body;
        const prop = await PhysicalPropsIntegration.initializeProp(propType, propName);
        res.json({ success: true, prop });
    } catch (error) {
        console.error('Error initializing prop:', error);
        res.status(500).json({ success: false, error: 'Failed to initialize prop' });
    }
});

// Update session metrics
router.put('/session/:sessionId/metrics', authenticate, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { metrics } = req.body;
        const session = await VRSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        session.metrics = { ...session.metrics, ...metrics };
        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error updating metrics:', error);
        res.status(500).json({ success: false, error: 'Failed to update metrics' });
    }
});

// End VR session
router.post('/session/:sessionId/end', authenticate, async (req, res) => {
    try {
        const { sessionId } = req.params;
        const session = await VRSession.findById(sessionId);
        if (!session) {
            return res.status(404).json({ success: false, error: 'Session not found' });
        }
        session.endTime = new Date();
        await session.save();
        res.json({ success: true, session });
    } catch (error) {
        console.error('Error ending session:', error);
        res.status(500).json({ success: false, error: 'Failed to end session' });
    }
});

module.exports = router;
