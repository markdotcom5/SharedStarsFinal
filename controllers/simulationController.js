const Simulation = require('../models/simulation/simulation'); // Ensure correct path

// Start a new simulation
async function startSimulation(req, res) {
    try {
        const { simulationId, userId } = req.body;

        const newSession = new Simulation({
            simulationId,
            userId,
            sessionId: `session-${Date.now()}`,
            status: 'in-progress',
            progress: 0,
            feedback: [],
            creditsEarned: 0,
        });

        await newSession.save();
        res.status(201).json({ message: 'Simulation started successfully', session: newSession });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to start simulation' });
    }
}

// Get simulation status
async function getSimulationStatus(req, res) {
    try {
        const { sessionId } = req.params;
        const session = await Simulation.findOne({ sessionId });

        if (!session) return res.status(404).json({ error: 'Simulation session not found' });

        res.status(200).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve simulation status' });
    }
}

// Update simulation progress
async function updateSimulationProgress(req, res) {
    try {
        const { sessionId } = req.params;
        const { progress, feedback, credits } = req.body;
        const session = await Simulation.findOne({ sessionId });

        if (!session) return res.status(404).json({ error: 'Simulation session not found' });

        session.progress = progress || session.progress;
        if (feedback) session.feedback.push(feedback);
        if (credits) session.creditsEarned += credits;

        await session.save();
        res.status(200).json({ message: 'Simulation progress updated', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update simulation progress' });
    }
}

// Complete simulation
async function completeSimulation(req, res) {
    try {
        const { sessionId } = req.params;
        const { completionData } = req.body;
        const session = await Simulation.findOne({ sessionId });

        if (!session) return res.status(404).json({ error: 'Simulation session not found' });

        session.status = 'completed';
        session.results = completionData;
        session.completionTime = Date.now();

        await session.save();
        res.status(200).json({ message: 'Simulation completed successfully', session });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to complete simulation' });
    }
}

// Get leaderboard
async function getLeaderboard(req, res) {
    try {
        const leaderboard = await Simulation.find({ status: 'completed' })
            .sort({ creditsEarned: -1 })
            .limit(10);

        res.status(200).json(leaderboard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve leaderboard' });
    }
}

// Get user mission control
async function getUserMissionControl(req, res) {
    try {
        const { userId } = req.params;
        const userMissions = await Simulation.find({ userId }).sort({ completionTime: -1 });

        res.status(200).json(userMissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to retrieve mission control data' });
    }
}

module.exports = {
    startSimulation,
    getSimulationStatus,
    updateSimulationProgress,
    completeSimulation,
    getLeaderboard,
    getUserMissionControl,
};
