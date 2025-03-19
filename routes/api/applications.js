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
const emailService = require('../../services/emailService');
const multer = require('multer'); // Add this to import multer
const logger = console; // For compatibility with logger references

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

// Update your route handler to include this debugging
router.post('/submit', applicationLimiter, multer().single('resume'), async (req, res) => {
  try {
    console.log('Form submission received');
    console.log('Body:', req.body);
    
    // Create new application
    const newApplication = new Application({
      // Personal Information
      firstName: req.body.firstName || '',
      middleInitial: req.body.middleInitial || '',
      lastName: req.body.lastName || '',
      email: req.body.email || '',
      
      // Map the motivation field to lifeMissionAlignment
      lifeMissionAlignment: req.body.lifeMissionAlignment || req.body.motivation || '',
      spaceMissionChoice: req.body.spaceMissionChoice || '',
      
      // Other fields
      highestEducation: req.body.highestEducation || '',
      experience: req.body.experience || '',
      skills: Array.isArray(req.body.skills) ? req.body.skills : [req.body.skills].filter(Boolean),
      
      // Add any other required fields
      metadata: {
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers.referer || ''
      }
    });
    
    // Log the application before validation
    console.log('Application to save:', {
      firstName: newApplication.firstName,
      lastName: newApplication.lastName,
      email: newApplication.email,
      lifeMissionAlignment: newApplication.lifeMissionAlignment,
      spaceMissionChoice: newApplication.spaceMissionChoice
    });
    
    // Save application - this will trigger validation
    try {
      const savedApplication = await newApplication.save();
      
      // Success response
      return res.status(201).json({
        success: true,
        message: 'Application submitted successfully!',
        applicationId: savedApplication._id
      });
    } catch (validationError) {
      console.error('Validation error:', validationError);
      // Send back the specific validation errors
      if (validationError.name === 'ValidationError') {
        const errorMessages = Object.values(validationError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Validation failed: ' + errorMessages.join(', ')
        });
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your application.'
    });
  }
});
/**
 * @route   POST /api/applications/submit
 * @desc    Submit a new application
 * @access  Public
 */
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

    // Handle backward compatibility with older form format
    const name = fullName || req.body.name;
    const background = req.body.background;
    const motivation = req.body.motivation || lifeMissionAlignment;

    // Check required fields with backward compatibility
    if ((!name || !email) && (!fullName || !email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide at least name and email fields.'
      });
    }

    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || 'direct'
    };

    // Prepare prompt for OpenAI review
    let aiReview = { score: 0.5, notes: 'Average', recommendedPathway: 'General' };

    if (openai) {
      const aiPrompt = `
        Review application for SharedStars Academy:
        Name: ${name || fullName}
        Education: ${highestEducation || 'Not provided'}
        Experience: ${experience || 'Not provided'}
        Skills: ${skills || 'Not provided'}
        Background: ${background || 'Not provided'}
        Life Mission Alignment/Motivation: ${motivation || lifeMissionAlignment || 'Not provided'}
        Chosen Space Mission: ${spaceMissionChoice || 'Not provided'}
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

    // Create application with support for both old and new form formats
    const applicationData = {
      name: name || fullName,
      email,
      background: background || '',
      motivation: motivation || lifeMissionAlignment || '',
      highestEducation: highestEducation || '',
      experience: experience || '',
      skills: skills ? (typeof skills === 'string' ? JSON.parse(skills) : skills) : [],
      spaceMissionChoice: spaceMissionChoice || '',
      vrAiExperience: vrAiExperience || '',
      linkedInUrl: linkedInUrl || '',
      aiReview,
      metadata
    };

    const newApplication = new Application(applicationData);
    await newApplication.save();

    // Send admin notification
    try {
      await emailService.sendApplicationSubmissionToAdmin(newApplication);
    } catch (emailError) {
      console.error('Admin email notification error:', emailError);
    }

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
// Add this function to your routes/api/applications.js file if needed

// Handle application form submissions
router.post('/submit', async (req, res) => {
  try {
    console.log('Form submission received:', req.body);
    
    // Process skills (may come as string or array)
    let skills = req.body.skills;
    if (!skills) {
      skills = [];
    } else if (!Array.isArray(skills)) {
      // Convert single skill to array
      skills = [skills];
    }
    
    // Create new application
    const newApplication = new Application({
      // Personal Information
      firstName: req.body.firstName,
      middleInitial: req.body.middleInitial,
      lastName: req.body.lastName,
      email: req.body.email,
      linkedInUrl: req.body.linkedInUrl || '',
      highestEducation: req.body.highestEducation || '',
      
      // Background/Experience
      experience: req.body.experience || '',
      skills: skills,
      
      // Motivation fields
      lifeMissionAlignment: req.body.motivation || '',  // Mapping motivation field to lifeMissionAlignment
      spaceMissionChoice: req.body.spaceMissionChoice || '',
      vrAiExperience: req.body.background || '',  // Storing background info in vrAiExperience field
      
      // Metadata
      metadata: {
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
        referrer: req.headers.referer || ''
      }
    });
    
    // Check if email already exists
    const emailExists = await Application.findOne({ email: req.body.email });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'This email address has already been used to submit an application.'
      });
    }
    
    // Save application
    const savedApplication = await newApplication.save();
    
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      applicationId: savedApplication._id
    });
    
  } catch (error) {
    console.error('Application submission error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: Object.values(error.errors).map(err => err.message).join(', ')
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'An error occurred while processing your application.'
    });
  }
});
/**
 * @route   POST /api/applications/submit-test
 * @desc    Submit a new application (test version)
 * @access  Public
 */
router.post('/submit-test', async (req, res) => {
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

/**
 * @route   POST /api/applications/approve/:id
 * @desc    Approve an application
 * @access  Private (Admin only)
 */
router.post('/approve/:id', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {  
  try {
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
    let emailSent = false;
    try {
      emailSent = await emailService.sendApplicationAcceptance(application);
    } catch (emailError) {
      console.error('Error sending acceptance email:', emailError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Application approved and notification sent',
      emailSent: emailSent,
      application
    });
  } catch (error) {
    console.error('Error approving application:', error);
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