const express = require('express');
const router = express.Router();
const Video = require('../models/Video');

// Get video metadata
router.get('/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });
        res.json(video);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching video' });
    }
});

// Add a bookmark to a video
router.post('/:id/bookmarks', async (req, res) => {
    try {
        const { userId, time, note } = req.body;
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'Video not found' });

        video.bookmarks.push({ userId, time, note });
        await video.save();
        res.json(video);
    } catch (error) {
        res.status(500).json({ error: 'Error saving bookmark' });
    }
});

// Export the router
module.exports = router;
