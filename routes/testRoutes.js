const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate'); // Import your authenticate middleware

// Define a test protected route
router.get('/protected', authenticate, (req, res) => {
    res.json({
        message: 'You are authenticated!',
        user: req.user, // Should be set by the authenticate middleware
    });
});

module.exports = router;
