const express = require('express');
const router = express.Router();
const data = require('./data'); // Import technical tasks

// ✅ API Endpoint: Get All Technical Tasks
router.get('/', (req, res) => {
    res.json({
        success: true,
        tasks: data.getTasks()
    });
});

// ✅ Export Router & Tasks
module.exports = {
    router,
    getTasks: data.getTasks
};
