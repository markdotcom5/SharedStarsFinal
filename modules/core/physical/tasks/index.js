const express = require('express');
const router = express.Router();
const { authenticate } = require('../../../../middleware/authenticate');
const TrainingSession = require('../../../../models/TrainingSession');
const data = require('./data'); // Import task data

// ✅ Define getTasks() to retrieve all tasks
function getTasks() {
    return data.physicalTasks; // ✅ Now properly returns training tasks
}

// ✅ API Endpoint: Get All Tasks
router.get('/', authenticate, (req, res) => {
    res.json({
        success: true,
        tasks: getTasks()
    });
});

// ✅ API Endpoint: Get a Specific Task by ID
router.get('/:taskId', authenticate, (req, res) => {
    const task = Object.values(getTasks()).find(t => t.id === req.params.taskId);
    
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
        success: true,
        task
    });
});

// ✅ API Endpoint: Start a Training Task
router.post('/:taskId/start', authenticate, async (req, res) => {
    try {
        const task = Object.values(getTasks()).find(t => t.id === req.params.taskId);
        
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        const session = new TrainingSession({
            userId: req.user._id,
            moduleType: 'physical',
            moduleId: 'physical-001',
            taskId: req.params.taskId,
            status: 'in-progress',
            dateTime: new Date(),
            metrics: {
                completionRate: 0,
                effectivenessScore: 0
            }
        });

        await session.save();

        res.json({
            success: true,
            message: `Task ${task.name} started`,
            session: {
                id: session._id,
                task: {
                    id: task.id,
                    name: task.name,
                    exercises: task.exercises.map(e => ({
                        name: e.name,
                        duration: e.duration
                    }))
                }
            }
        });
    } catch (error) {
        console.error('Error starting task:', error);
        res.status(500).json({ error: 'Failed to start task' });
    }
});

// ✅ API Endpoint: Update Task Progress
router.post('/:taskId/:sessionId/progress', authenticate, async (req, res) => {
    try {
        const { completionRate, exerciseData } = req.body;

        const session = await TrainingSession.findOneAndUpdate(
            {
                _id: req.params.sessionId,
                userId: req.user._id,
                taskId: req.params.taskId
            },
            {
                $set: {
                    'metrics.completionRate': completionRate,
                    exerciseData
                }
            },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

        res.json({
            success: true,
            message: 'Progress updated',
            progress: {
                completionRate,
                exerciseData
            }
        });
    } catch (error) {
        console.error('Error updating task progress:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});

// ✅ Exporting API Routes and `getTasks`
module.exports = {
    router,
    getTasks
};


