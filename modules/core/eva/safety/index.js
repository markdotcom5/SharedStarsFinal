// modules/core/eva/safety/index.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');
const { evaSafety } = require('./data');

// Get all safety protocols
router.get('/', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            safety: evaSafety,
        });
    } catch (error) {
        console.error('❌ Error fetching EVA safety protocols:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA safety protocols',
        });
    }
});

// Get specific safety category
router.get('/:category', authenticate, async (req, res) => {
    try {
        const { category } = req.params;

        if (!evaSafety[category]) {
            return res.status(404).json({
                success: false,
                error: 'Safety category not found',
            });
        }

        res.json({
            success: true,
            [category]: evaSafety[category],
        });
    } catch (error) {
        console.error('❌ Error fetching EVA safety category:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch EVA safety category',
        });
    }
});

module.exports = {
    router,
    getSafetyProtocols: () => evaSafety,
};
