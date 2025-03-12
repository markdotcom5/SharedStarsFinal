// routes/admin/applications.js
const express = require('express');
const router = express.Router();
const Application = require('../../models/Application');
const emailService = require('../../services/emailService');
const authMiddleware = require('../../middleware/authenticate');

// TEMPORARY: For development/testing only
// Comment out authentication temporarily
const adminAuth = []; // Empty array for testing
// const adminAuth = [authMiddleware.authenticate, authMiddleware.requireRole('admin')]; // Uncomment for production

// Get all applications
router.get('/', ...adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Filter options
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { motivation: searchRegex }
      ];
    }
    
    // Get applications with pagination
    const applications = await Application.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    // Get total count for pagination
    const totalCount = await Application.countDocuments(filter);
    
    // Get application stats
    const stats = await Application.getStats();
    
    res.json({
      success: true,
      applications,
      pagination: {
        page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasMore: skip + applications.length < totalCount
      },
      stats
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch applications' });
  }
});

// Get a single application
router.get('/:id', ...adminAuth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id).lean();
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch application' });
  }
});

// Update application status
router.put('/:id/status', ...adminAuth, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!status || !['pending', 'approved', 'rejected', 'waitlisted'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Valid status is required'
      });
    }
    
    // Update the application
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        adminNotes: adminNotes || '',
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // If application is approved, send acceptance email
    if (status === 'approved') {
      try {
        await emailService.sendApplicationAcceptance(application);
      } catch (emailError) {
        console.error('Error sending acceptance email:', emailError);
        // Continue with the response even if email fails
      }
    }
    
    res.json({
      success: true,
      message: `Application status updated to ${status}`,
      application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ success: false, error: 'Failed to update application status' });
  }
});

module.exports = router;