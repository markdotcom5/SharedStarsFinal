// modules/core/eva/equipment/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');
const { evaEquipment } = require('./data');

// Get all equipment
router.get('/', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            equipment: evaEquipment
        });
    } catch (error) {
        console.error('❌ Error fetching EVA equipment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA equipment'
        });
    }
});

// Get specific equipment
router.get('/:category/:equipmentId', authenticate, async (req, res) => {
    try {
        const { category, equipmentId } = req.params;
        
        if (!evaEquipment[category]) {
            return res.status(404).json({
                success: false,
                error: 'Equipment category not found'
            });
        }

        const equipment = evaEquipment[category].find(e => e.id === equipmentId);

        if (!equipment) {
            return res.status(404).json({
                success: false,
                error: 'Equipment not found'
            });
        }

        res.json({
            success: true,
            equipment
        });
    } catch (error) {
        console.error('❌ Error fetching EVA equipment:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA equipment'
        });
    }
});

module.exports = {
    router,
    getEquipment: () => evaEquipment
};