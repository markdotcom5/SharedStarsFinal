// routes/admin/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../../models/Application');
const emailService = require('../../services/emailService');
const authMiddleware = require('../../middleware/authenticate');

// Application routes
router.get('/', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {
  try {
    // Your route implementation
    const applications = await Application.find().sort({createdAt: -1}).limit(20);
    res.json({ success: true, applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});

// Rest of your routes with the same middleware pattern
router.get('/:id', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {
  // Implementation
});

router.put('/:id/status', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {
  // Implementation
});

module.exports = router;