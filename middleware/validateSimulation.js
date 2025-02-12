const express = require('express');
const router = express.Router();
const Simulation = require('../../models/simulation/simulations'); // Ensure correct import path

// Middleware to validate simulation input
const validateSimulation = (req, res, next) => {
    const { name, description, duration, difficulty } = req.body;
  
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing name' });
    }
  
    if (!description || typeof description !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing description' });
    }
  
    if (!duration || typeof duration !== 'number' || duration <= 0) {
        return res.status(400).json({ error: 'Invalid or missing duration' });
    }
  
    const allowedDifficulties = ['easy', 'intermediate', 'advanced'];
    if (!allowedDifficulties.includes(difficulty)) {
        return res.status(400).json({ error: `Invalid difficulty. Must be one of: ${allowedDifficulties.join(', ')}` });
    }
  
    next(); // Proceed to the next middleware or route handler
};

// Route to add a new simulation
router.post('/simulations', validateSimulation, async (req, res) => {
    try {
        const { name, description, duration, difficulty } = req.body;

        // Create a new simulation entry in the database
        const newSimulation = new Simulation({ name, description, duration, difficulty });
        await newSimulation.save();

        res.status(201).json({ message: 'Simulation added successfully', simulation: newSimulation });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error while adding simulation' });
    }
});

module.exports = router;
