const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate } = require('../middleware/authenticate');

// ✅ Route to fetch all users
router.get('/', authenticate, async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Fetch all users, excluding passwords
        res.status(200).json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// ✅ Export the router
module.exports = router;
