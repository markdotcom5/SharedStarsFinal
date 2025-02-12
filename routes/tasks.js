// Example: Update a specific task’s progress
const express = require('express');
const router = express.Router();
const Task = require('../models/Task'); // Adjust the path as needed
const { authenticate } = require('../middleware/authenticate');
const validateRequest = require('../middleware/validateRequest');
const { ObjectId } = require('mongoose').Types; // Ensure you are using mongoose's ObjectId

// PATCH route to update a specific task's progress
router.patch('/task/:taskId/progress', authenticate, validateRequest, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { progress, status } = req.body;

    // Find the task by ID and update its progress and status
    const updatedTask = await Task.findOneAndUpdate(
      { _id: ObjectId(taskId) },
      { $set: { progress, status } },
      { new: true }
    );

    // If no task is found, return a 404 response
    if (!updatedTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Return the updated task details in the response
    res.json({ success: true, updatedTask });
  } catch (err) {
    console.error('Error updating task progress:', err);
    // Return a 500 response for any internal server errors
    res.status(500).json({ message: 'Failed to update task progress' });
  }
});

module.exports = router;
