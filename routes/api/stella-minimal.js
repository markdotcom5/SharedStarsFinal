// routes/api/stella.js - Minimal version
const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'STELLA API is working' });
});

// Simple status route
router.get('/status', (req, res) => {
  res.json({
    success: true,
    status: "online",
    version: "1.0"
  });
});

module.exports = router;