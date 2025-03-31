const express = require('express');
const router = express.Router();
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const Application = require('../../models/Application');
const emailService = require('../../services/emailService');
const { openai } = require('../../services/openaiService');

// Rate limiting middleware to prevent abuse
const applicationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit to 5 applications per window
  message: { success: false, error: "Too many applications submitted. Please try again later." }
});

/**
 * @route   POST /api/applications/submit
 * @desc    Submit application with STELLA cognitive profiling
 * @access  Public
 */
router.post('/submit', applicationLimiter, multer().single('resume'), async (req, res) => {
  try {
    // Consolidate form fields from different versions
    const {
      fullName,
      firstName, lastName, middleInitial,
      email,
      highestEducation,
      experience,
      skills,
      lifeMissionAlignment,
      spaceMissionChoice,
      vrAiExperience,
      linkedInUrl,
      background,
      motivation
    } = req.body;

    // Handle naming fields across different form versions
    const name = fullName || `${firstName || ''} ${lastName || ''}`.trim();
    const motivationText = motivation || lifeMissionAlignment || '';
    const backgroundText = background || vrAiExperience || '';

    // Check required fields
    if ((!name || !email) && (!firstName || !lastName || !email)) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Check if email already exists
    const emailExists = await Application.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        error: 'This email address has already been used to submit an application.'
      });
    }

    // Metadata
    const metadata = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      referrer: req.headers.referer || 'direct'
    };

    // STELLA Cognitive Profile Generation
    let cognitiveProfile = null;
    let aiReview = { score: 0.5, notes: 'Average', recommendedPathway: 'General' };

    if (typeof openai !== 'undefined' && openai) {
      try {
        // Generate AI review
        const aiPrompt = `
          Review application for SharedStars Academy:
          Name: ${name}
          Education: ${highestEducation || 'Not provided'}
          Experience: ${experience || 'Not provided'}
          Skills: ${skills || 'Not provided'}
          Background: ${backgroundText || 'Not provided'}
          Life Mission Alignment/Motivation: ${motivationText || 'Not provided'}
          Chosen Space Mission: ${spaceMissionChoice || 'Not provided'}
          VR/AI Experience: ${vrAiExperience || 'None'}
          
          Provide a comprehensive review including:
          1. Overall score (0-1)
          2. Strengths and areas for improvement
          3. Recommended training pathway
          4. Initial cognitive profile assessment based on application responses
        `;
    
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [{ role: 'system', content: aiPrompt }],
          max_tokens: 800,
          temperature: 0.6
        });
    
        // Extract AI review data
        const aiOutput = response.choices[0].message.content;
        
        // Generate initial cognitive profile using Space Cognitive Load Balancer™
        cognitiveProfile = generateInitialCognitiveProfile(req.body, aiOutput);
        
        // Set AI review data
        aiReview = {
          score: extractScoreFromAIOutput(aiOutput) || 0.8,
          notes: aiOutput,
          recommendedPathway: extractPathwayFromAIOutput(aiOutput) || "General Training"
        };
      } catch (aiError) {
        console.error('OpenAI Error:', aiError);
        
        // Initialize aiReview if it doesn't exist yet
        if (!aiReview || typeof aiReview !== 'object') {
          aiReview = {
            score: 0.5,
            notes: 'AI review encountered an error, manual check recommended.',
            recommendedPathway: 'General Training'
          };
        } else {
          aiReview.notes = 'AI review encountered an error, manual check recommended.';
        }
        
        // Generate fallback cognitive profile
        cognitiveProfile = generateFallbackCognitiveProfile(req.body);
      }
    } else {
      console.log('OpenAI service not available, using fallback profile generation');
      // Generate fallback cognitive profile if OpenAI is not available
      cognitiveProfile = generateFallbackCognitiveProfile(req.body);
      
      // Ensure aiReview is set with defaults
      aiReview = {
        score: 0.5,
        notes: 'AI review not available (service offline). Application requires manual review.',
        recommendedPathway: 'General Training'
      };
    }

    // Create unified application object
    const applicationData = {
      // Personal info
      name,
      firstName: firstName || '',
      middleInitial: middleInitial || '',
      lastName: lastName || '',
      email: email.toLowerCase(),
      linkedInUrl: linkedInUrl || '',
      
      // Background
      highestEducation: highestEducation || '',
      experience: experience || '',
      skills: processSkills(skills),
      background: backgroundText,
      motivation: motivationText,
      spaceMissionChoice: spaceMissionChoice || '',
      
      // STELLA integration fields
      aiReview,
      cognitiveProfile,
      
      // Metadata
      metadata,
      status: 'pending'
    };

    // Create and save the application
    const newApplication = new Application(applicationData);
    await newApplication.save();

    // Send admin notification
    try {
      await emailService.sendApplicationSubmissionToAdmin(newApplication);
    } catch (emailError) {
      console.error('Admin email notification error:', emailError);
    }

    // Success response
    res.status(201).json({
      success: true,
      message: 'Your application has been submitted! STELLA will review shortly.',
      applicationId: newApplication._id,
      reviewScore: aiReview.score,
      stellaInsight: generateSTELLAApplicationResponse(cognitiveProfile, aiReview)
    });

  } catch (error) {
    console.error('Application submission error:', error);
    res.status(500).json({
      success: false,
      error: 'Server error processing your application'
    });
  }
});

// Helper functions for cognitive profile generation

/**
 * Generate initial cognitive profile using Space Cognitive Load Balancer™
 */
function generateInitialCognitiveProfile(formData, aiOutput) {
  // Extract cognitive indicators from application
  const textAnalysis = analyzeTextContent(formData.motivation, formData.experience, formData.background);
  
  // Basic cognitive fingerprint derived from application responses
  return {
    baselineCapacity: calculateInitialBaseline(formData, textAnalysis),
    optimalLearningPeriods: [
      { startHour: 8, endHour: 11, capacity: 0.85 },
      { startHour: 16, endHour: 18, capacity: 0.75 }
    ],
    fatigueThreshold: 0.65,
    recoveryRate: 0.08,
    cognitiveFingerprint: {
      visualProcessing: estimateVisualProcessing(formData, textAnalysis),
      auditoryProcessing: estimateAuditoryProcessing(formData, textAnalysis),
      proceduralLearning: estimateProceduralLearning(formData, textAnalysis),
      multiTaskingCapacity: estimateMultiTasking(formData, textAnalysis),
      stressResponseFactor: estimateStressResponse(formData, textAnalysis)
    },
    initialAssessmentNeeded: true,
    lastUpdated: new Date(),
    source: 'application'
  };
}

/**
 * Generate a personalized STELLA response for application submission
 */
function generateSTELLAApplicationResponse(cognitiveProfile, aiReview) {
  const strengths = identifyStrengthsFromProfile(cognitiveProfile);
  
  return {
    greeting: "Thank you for your application to SharedStars Academy!",
    initialAssessment: `Based on your application, I've identified strong potential in ${strengths.join(', ')}. This is just the beginning of our journey together!`,
    nextSteps: "Your application will be reviewed by our team. Once approved, we'll begin with an initial assessment to refine your cognitive profile and create your personalized training path.",
    personalizedNote: aiReview.notes.split('\n')[0] // First line of AI review as a personalized note
  };
}

// Analysis helper functions
function analyzeTextContent(motivation, experience, background) {
  // Simplified analysis - would be more sophisticated in production
  const allText = `${motivation || ''} ${experience || ''} ${background || ''}`.toLowerCase();
  
  return {
    detailOrientation: (allText.includes('detail') || allText.includes('thorough') || allText.includes('meticulous')) ? 0.8 : 0.6,
    technicalAptitude: (allText.includes('engineer') || allText.includes('technical') || allText.includes('program')) ? 0.9 : 0.5,
    adaptability: (allText.includes('adapt') || allText.includes('flexible') || allText.includes('change')) ? 0.85 : 0.6,
    teamOrientation: (allText.includes('team') || allText.includes('collaborate') || allText.includes('group')) ? 0.8 : 0.5,
    stressHandling: (allText.includes('pressure') || allText.includes('stress') || allText.includes('challenge')) ? 0.75 : 0.6
  };
}

function calculateInitialBaseline(formData, textAnalysis) {
  // Default baseline with adjustment based on education and experience
  let baseline = 0.65;
  
  // Education level adjustment
  if (formData.highestEducation?.includes('PhD') || formData.highestEducation?.includes('Doctorate')) {
    baseline += 0.1;
  } else if (formData.highestEducation?.includes('Master')) {
    baseline += 0.07;
  } else if (formData.highestEducation?.includes('Bachelor')) {
    baseline += 0.05;
  }
  
  // Experience adjustment
  const experienceYears = estimateExperienceYears(formData.experience);
  baseline += Math.min(0.15, experienceYears * 0.015);
  
  // Text analysis adjustment
  baseline += (textAnalysis.detailOrientation - 0.6) * 0.1;
  
  return Math.min(0.9, Math.max(0.5, baseline));
}

// Simplified estimators
function estimateVisualProcessing(formData, textAnalysis) {
  return 0.7 + (Math.random() * 0.2);
}

function estimateAuditoryProcessing(formData, textAnalysis) {
  return 0.65 + (Math.random() * 0.2);
}

function estimateProceduralLearning(formData, textAnalysis) {
  return 0.6 + (textAnalysis.technicalAptitude * 0.3);
}

function estimateMultiTasking(formData, textAnalysis) {
  return 0.6 + (textAnalysis.adaptability * 0.2);
}

function estimateStressResponse(formData, textAnalysis) {
  return textAnalysis.stressHandling;
}

function identifyStrengthsFromProfile(profile) {
  const strengths = [];
  const fingerprint = profile.cognitiveFingerprint;
  
  if (fingerprint.visualProcessing > 0.75) strengths.push("visual learning");
  if (fingerprint.proceduralLearning > 0.75) strengths.push("procedural skill acquisition");
  if (fingerprint.multiTaskingCapacity > 0.75) strengths.push("multi-tasking capabilities");
  if (fingerprint.stressResponseFactor > 0.75) strengths.push("stress management");
  
  // Add a default if no clear strengths
  if (strengths.length === 0) strengths.push("adaptability");
  
  return strengths;
}

// Utility functions
function processSkills(skills) {
  if (!skills) return [];
  if (typeof skills === 'string') {
    try {
      return JSON.parse(skills);
    } catch (e) {
      return [skills];
    }
  }
  return Array.isArray(skills) ? skills : [skills];
}

function estimateExperienceYears(experienceText) {
  if (!experienceText) return 0;
  
  // Simple regex to extract years of experience
  const yearMatches = experienceText.match(/(\d+)\s*years?/i);
  if (yearMatches && yearMatches[1]) {
    return parseInt(yearMatches[1], 10);
  }
  
  // Default estimate based on length of description
  return Math.min(5, Math.floor(experienceText.length / 200));
}

function generateFallbackCognitiveProfile(formData) {
  return {
    baselineCapacity: 0.7,
    optimalLearningPeriods: [
      { startHour: 9, endHour: 12, capacity: 0.8 },
      { startHour: 15, endHour: 18, capacity: 0.75 }
    ],
    fatigueThreshold: 0.6,
    recoveryRate: 0.1,
    cognitiveFingerprint: {
      visualProcessing: 0.7,
      auditoryProcessing: 0.7,
      proceduralLearning: 0.7,
      multiTaskingCapacity: 0.6,
      stressResponseFactor: 0.6
    },
    initialAssessmentNeeded: true,
    lastUpdated: new Date(),
    source: 'fallback'
  };
}

function extractScoreFromAIOutput(aiOutput) {
  const scoreMatch = aiOutput.match(/score:?\s*(0\.\d+|[01])/i);
  return scoreMatch ? parseFloat(scoreMatch[1]) : 0.7;
}

function extractPathwayFromAIOutput(aiOutput) {
  const pathways = [
    "Technical Training",
    "Physical Preparation",
    "Command Training",
    "Science Specialization",
    "EVA Training"
  ];
  
  for (const pathway of pathways) {
    if (aiOutput.includes(pathway)) {
      return pathway;
    }
  }
  
  return "General Training";
}