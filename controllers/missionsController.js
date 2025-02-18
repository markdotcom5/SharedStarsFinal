const Mission = require('../models/simulation/missions');

// ✅ Get all missions
async function getMissions(req, res) {
    try {
        const missions = await Mission.find().populate('scenario');
        res.status(200).json(missions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve missions', details: error.message });
    }
}

// ✅ Get a mission by ID
async function getMissionById(req, res) {
    try {
        const mission = await Mission.findById(req.params.missionId).populate('scenario');
        if (!mission) return res.status(404).json({ error: 'Mission not found' });
        res.status(200).json(mission);
    } catch (error) {
        res.status(500).json({ error: 'Failed to retrieve mission', details: error.message });
    }
}

// ✅ Create a new mission
async function createMission(req, res) {
    try {
        const newMission = new Mission(req.body);
        const savedMission = await newMission.save();
        res.status(201).json(savedMission);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create mission', details: error.message });
    }
}

// ✅ Update mission progress
async function updateMissionProgress(req, res) {
    try {
        const { stepsCompleted } = req.body;
        const updatedMission = await Mission.findByIdAndUpdate(
            req.params.missionId,
            {
                $set: { 'progressTracking.stepsCompleted': stepsCompleted },
            },
            { new: true }
        );

        res.status(200).json(updatedMission);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to update mission progress',
            details: error.message,
        });
    }
}

module.exports = { getMissions, getMissionById, createMission, updateMissionProgress };
