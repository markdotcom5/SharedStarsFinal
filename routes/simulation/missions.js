const express = require('express');
const router = express.Router();
const {
    getMissions,
    getMissionById,
    createMission,
    updateMissionProgress,
} = require('../../controllers/missionsController'); // ✅ Ensure correct path

// ✅ Get all missions
router.get('/', getMissions);

// ✅ Get a specific mission by ID
router.get('/:missionId', getMissionById);

// ✅ Create a new mission
router.post('/create', createMission);

// ✅ Update mission progress
router.put('/:missionId/progress', updateMissionProgress);

module.exports = router;
