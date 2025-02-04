const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
    res.json({ success: true, message: 'Test route is working!' });
});

module.exports = router; // Must export a valid router
