const express = require('express');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const router = express.Router();
const User = require('../models/User');
const { authenticate, requireRole } = require('../middleware/authenticate');

// Validation Schema
const userSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
});

// GET /api/users (Fetch all users - Admin-only route)
router.get('/stats', authenticate, async (req, res) => {
    try {
        const { spaceReadinessScore, stelTrekCredits, rank, missionsCompleted } = req.user;

        res.status(200).json({
            progress: spaceReadinessScore,
            score: stelTrekCredits,
            rank,
            missionsCompleted,
        });
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Failed to fetch user stats' });
    }
});


// POST /api/users (Create a new user)
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = await userSchema.validateAsync(req.body);
        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error.message);
        res.status(400).json({ error: error.details ? error.details[0].message : error.message });
    }
});

// GET /api/users/:id (Fetch a user by ID - Authenticated)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ user });
    } catch (error) {
        console.error('Error fetching user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// PUT /api/users/:id (Update a user)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const updates = req.body;
        if (updates.password) {
            updates.password = await bcrypt.hash(updates.password, 12);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Error updating user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// DELETE /api/users/:id (Delete a user - Admin-only route)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('Error deleting user:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
