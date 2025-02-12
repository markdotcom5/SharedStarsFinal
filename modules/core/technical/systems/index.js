const express = require('express');
const router = express.Router();

// ✅ Spacecraft Systems Training
const systems = {
    propulsion: {
        id: 'S100',
        name: 'Propulsion Systems Training',
        description: 'Understand rocket propulsion and spacecraft maneuvering techniques'
    },
    lifeSupport: {
        id: 'S200',
        name: 'Life Support Systems',
        description: 'Learn about oxygen generation, CO2 scrubbing, and water recovery'
    },
    navigation: {
        id: 'S300',
        name: 'Spacecraft Navigation & Control',
        description: 'Master orbital mechanics and spacecraft navigation strategies'
    }
};

// ✅ Function to Retrieve Systems
function getSystems() {
    return systems;
}

// ✅ API Endpoint: Get All Systems
router.get('/', (req, res) => {
    res.json({
        success: true,
        systems: getSystems()
    });
});

// ✅ Export Router & Function
module.exports = {
    router,
    getSystems
};
