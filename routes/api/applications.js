/**
 * routes/api/applications.js
 * API endpoints for handling academy applications
 */

const express = require('express');
const router = express.Router();
const Application = require('../../models/Application');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');
const authMiddleware = require('../../middleware/authenticate');
// At the top of routes/api/applications.js, add:
const emailService = require('../../services/emailService');
// Initialize OpenAI
let openai;
try {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "MISSING_KEY"
  });
  
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "MISSING_KEY") {
    console.error("❌ ERROR: Missing OpenAI API Key in Application Routes");
  } else {
    console.log("✅ OpenAI client initialized successfully in Application Routes");
  }
} catch (error) {
  console.error('❌ OpenAI Initialization Error in Application Routes:', error);
}

// Create rate limiter to prevent spam
const applicationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 applications per hour
  message: { success: false, error: 'Too many applications from this IP, please try again later.' }
});

/**
 * @route   POST /api/applications/submit
 * @desc    Submit a new application
 * @access  Public
 */

// Submit a new application
router.post('/submit', applicationLimiter, multer().single('resume'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      highestEducation,
      experience,
      skills,
      lifeMissionAlignment,
      spaceMissionChoice,
      vrAiExperience,
      linkedInUrl
    } = req.body;

    if (!fullName || !email || !lifeMissionAlignment || !spaceMissionChoice) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields.'
      });
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || 'direct'
    };

    // Prepare prompt for OpenAI review (enhanced content)
    let aiReview = { score: 0.5, notes: 'Average', recommendedPathway: 'General' };

    if (openai) {
      const aiPrompt = `
        Review application for SharedStars Academy:
        Name: ${fullName}
        Education: ${highestEducation}
        Experience: ${experience}
        Skills: ${skills}
        Life Mission Alignment: ${lifeMissionAlignment}
        Chosen Space Mission: ${spaceMissionChoice}
        VR/AI Experience: ${vrAiExperience || 'None'}
      `;

      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: aiPrompt }],
          max_tokens: 500,
          temperature: 0.6
        });

        aiReview = {
          score: 0.8, // Assume good until OpenAI scores
          notes: response.choices[0].message.content,
          recommendedPathway: "To be determined by AI"
        };
      } catch (aiError) {
        console.error('OpenAI Error:', aiError);
        aiReview.notes = 'AI review encountered an error, manual check recommended.';
      }
    }

    const newApplication = new Application({
      fullName,
      email,
      highestEducation,
      experience,
      skills: JSON.parse(skills),
      lifeMissionAlignment,
      spaceMissionChoice,
      vrAiExperience,
      linkedInUrl,
      aiReview,
      metadata
    });

    await newApplication.save();

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted! STELLA will review shortly.',
      applicationId: newApplication._id,
      reviewScore: aiReview.score
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing your application'
    });
  }
});

/**
 * @route   POST /api/applications/submit-test
 * @desc    Submit a new application (test version)
 * @access  Public
 */
router.post('/submit-test', applicationLimiter, async (req, res) => {
  try {
    const { name, email, background, motivation } = req.body;
    
    // Basic validation
    if (!name || !email || !background || !motivation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // Modify the email for development/testing to avoid duplicates
    let modifiedEmail = email;
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      modifiedEmail = `${email.split('@')[0]}+${Date.now()}@${email.split('@')[1]}`;
      console.log(`Modified email for testing: ${modifiedEmail}`);
    }
    
    // Check for existing email - with try/catch to handle potential errors
    let emailExists = false;
    try {
      emailExists = await Application.emailExists(modifiedEmail);
    } catch (emailCheckError) {
      console.error('Error checking email existence:', emailCheckError);
      // Continue with emailExists = false if there's an error
    }
    
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'An application with this email already exists'
      });
    }
    
    // Capture metadata
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || 'direct'
    };
    
    // Use simplified AI review for test endpoint
    const aiReview = { 
      score: 0.75, 
      notes: "Test application - automatically approved", 
      recommendedPathway: "Technical Training" 
    };
    
    // Create and save new application
    const newApplication = new Application({
      name,
      email: modifiedEmail, // Use the modified email
      background,
      motivation,
      aiReview,
      metadata,
      status: 'pending' // or 'approved' for test purposes
    });
    
    // Save with detailed error handling
    try {
      await newApplication.save();
      console.log(`Application saved successfully for ${modifiedEmail}`);
    } catch (saveError) {
      console.error('Error saving application:', saveError);
      return res.status(500).json({
        success: false,
        error: 'Database error saving application',
        details: saveError.message
      });
    }
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplication._id,
      reviewScore: aiReview.score
    });
    
  } catch (error) {
    console.error('Error submitting test application:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing your application',
      details: error.message
    });
  }
});
// In your applications.js route file, update the submit route:

router.post('/submit', applicationLimiter, async (req, res) => {
  try {
    // Your existing application processing code...
    
    // After saving the application
    await newApplication.save();
    
    // Send admin notification
    const emailService = require('../services/emailService');
    emailService.sendApplicationSubmissionToAdmin(newApplication)
      .catch(err => logger.error('Admin application email error:', err));
    
    // Response to client remains the same
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplication._id,
      reviewScore: aiReview.score
    });
  } catch (error) {
    // Your existing error handling...
  }
});

// And add/update the approve route:

router.post('/approve/:id', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {  try {
    const applicationId = req.params.id;
    
    // Find and update the application status
    const application = await Application.findByIdAndUpdate(
      applicationId,
      { status: 'approved', updatedAt: Date.now() },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }
    
    // Send approval notification to applicant
    const emailService = require('../services/emailService');
    const emailSent = await emailService.sendApplicationAcceptance(application);
    
    res.status(200).json({
      success: true,
      message: 'Application approved and notification sent',
      emailSent: true,
      application
    });
  } catch (error) {
    logger.error('Error approving application:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing approval'
    });
  }
});
/**
 * @route   GET /api/applications/status/:email
 * @desc    Check application status by email
 * @access  Public
 */
router.get('/status/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }
    
    const application = await Application.findOne({ email: email.toLowerCase() });
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No application found with this email'
      });
    }
    
    res.json({
      success: true,
      status: application.status,
      submittedAt: application.createdAt,
      updatedAt: application.updatedAt
    });
    
  } catch (error) {
    console.error('Error checking application status:', error);
    res.status(500).json({
      success: false,
      error: 'Server error checking application status'
    });
  }
});

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics
 * @access  Private (Admin Only)
 */
router.get('/stats', /* adminMiddleware, */ async (req, res) => {
  try {
    const stats = await Application.getStats();
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    console.error('Error getting application stats:', error);
    res.status(500).json({
      success: false,
      error: 'Server error retrieving application statistics'
    });
  }
});

module.exports = router;