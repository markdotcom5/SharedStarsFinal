/**
 * routes/api/applications.js
 * API endpoints for handling academy applications
 */

const express = require('express');
const router = express.Router();
const Application = require('../../models/Application');
const { OpenAI } = require('openai');
const rateLimit = require('express-rate-limit');

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
router.post('/submit', applicationLimiter, async (req, res) => {
  try {
    const { name, email, background, motivation } = req.body;
    
    // Basic validation
    if (!name || !email || !background || !motivation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }
    
    // Check for existing email
    const emailExists = await Application.emailExists(email);
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
    
    // Call STELLA AI for application review if OpenAI is configured
    let aiReview = { score: 0.5, notes: "Automated review not available" };
    
    if (openai && process.env.OPENAI_API_KEY !== "MISSING_KEY") {
      try {
        // Prepare prompt for AI review
        const prompt = `
        Please review this application for SharedStars Academy space training program.
        
        Applicant Name: ${name}
        Background: ${background}
        Motivation: "${motivation}"
        
        Evaluate the applicant's potential as a space trainee based on their motivation statement and background.
        Assign a score from 0.0 to 1.0 where 1.0 is the highest potential.
        Recommend a suitable training pathway based on their background.
        Provide brief notes about strengths and areas for improvement.
        
        Format your response as JSON:
        {
          "score": [number between 0 and 1],
          "notes": [brief evaluation],
          "recommendedPathway": [one of: "Physical Training", "Technical Training", "Leadership", "EVA Training", "Scientific Research"]
        }
        `;
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: prompt }],
          max_tokens: 500,
          temperature: 0.7
        });
        
        // Parse AI response
        const aiResponseText = response.choices[0].message.content;
        try {
          // Extract JSON from the response
          const jsonMatch = aiResponseText.match(/({[\s\S]*})/);
          if (jsonMatch) {
            const jsonText = jsonMatch[1];
            aiReview = JSON.parse(jsonText);
          }
        } catch (jsonError) {
          console.error('Error parsing AI review JSON:', jsonError);
          // Fall back to default AI review
        }
      } catch (aiError) {
        console.error('Error getting AI review:', aiError);
        // Continue with default AI review
      }
    }
    
    // Create and save new application
    const newApplication = new Application({
      name,
      email,
      background,
      motivation,
      aiReview,
      metadata
    });
    
    await newApplication.save();
    
    // Send notification to admin (could be implemented here)
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: newApplication._id,
      reviewScore: aiReview.score
    });
    
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing your application'
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