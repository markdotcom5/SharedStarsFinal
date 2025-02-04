const express = require('express');
const router = express.Router();
const AIWebController = require('../services/AIWebController');

// Route to trigger AIWebController's `takeControl` method
router.post('/take-control', async (req, res) => {
    const { userId } = req.body;

    // Validate request body
    if (!userId) {
        return res.status(400).json({
            success: false,
            error: 'User ID is required for AI to take control.',
        });
    }

    try {
        // Attempt to take control via AIWebController
        const result = await AIWebController.takeControl(userId);

        // Respond with success
        res.status(200).json({
            success: true,
            message: 'AI has taken control successfully.',
            data: result, // Include any useful data returned by AIWebController
        });
    } catch (error) {
        console.error('Error in AIWebController take-control route:', error);

        // Handle specific error types
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                error: 'Validation Error',
                details: error.message,
            });
        }

        // General error handling
        res.status(500).json({
            success: false,
            error: 'Internal Server Error',
            message: error.message,
        });
    }
});

module.exports = router;
