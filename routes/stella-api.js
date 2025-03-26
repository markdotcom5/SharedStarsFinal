const express = require('express');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Temporary STELLA API is working' });
});

router.post('/initialize', (req, res) => {
  res.json({
    success: true,
    message: "STELLA initialized successfully",
    version: "1.0"
  });
});

router.post('/connect', (req, res) => {
  res.json({
    success: true,
    sessionId: `stella_${Date.now()}`,
    message: "Connected to STELLA"
  });
});

// 🚫 Removed simplified guidance route to prevent conflicts
// router.post('/guidance', async (req, res) => { ... });

module.exports = router;

module.exports = router;
