const express = require('express');
const router = express.Router();
const Assessment = require('../models/Assessment');
const User = require('../models/User'); // User model for status tracking

// Physical Assessment Submission Route
router.post('/physical', async (req, res) => {
  const { userId, responses } = req.body;

  try {
    const newAssessment = new Assessment({
      userId: userId,
      responses: {
        generalCondition: {
          overallCondition: responses.overallCondition,
          continuousActivityDuration: responses.continuousActivityDuration
        },
        strengthEndurance: {
          pushUpsCount: responses.pushUpsCount,
          plankDuration: responses.plankDuration,
          strengthActivityFrequency: responses.strengthActivityFrequency
        },
        flexibilityMobility: {
          flexibilityRating: responses.flexibilityRating,
          balanceCoordinationIssues: responses.balanceCoordinationIssues
        },
        preferencesAndLimits: {
          activityPreferences: responses.activityPreferences,
          medicalConditions: responses.medicalConditions
        }
      },
      completionDate: new Date(),
      aiRecommendations: {} // filled in later by STELLA AI
    });

    await newAssessment.save();

    // Update user's completed assessments status
    await User.findByIdAndUpdate(userId, { 
        $set: { 'assessmentsCompleted.physical': true }
    });

    res.json({ success: true, message: 'Physical Assessment completed!' });
  } catch (error) {
    res.status(500).json({ error: 'Error saving assessment', details: error.message });
  }
});
// Add to routes/assessment.js
router.post('/submit', async (req, res) => {
  try {
    const { type, responses, timestamp } = req.body;
    const userId = req.user?._id; // Assuming you have authentication middleware
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'Unauthorized' 
      });
    }
    
    // Create a new assessment
    const assessment = new Assessment({
      userId,
      moduleType: type,
      responses,
      completionDate: new Date(timestamp)
    });
    
    await assessment.save();
    
    // Update user's assessment status
    await User.findByIdAndUpdate(userId, {
      $set: { [`assessmentsCompleted.${type}`]: true }
    });
    
    // Get AI recommendations
    let stellaRecommendations = {};
    try {
      // Call STELLA API for recommendations
      const stellaResponse = await fetch('/api/stella/guidance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          question: `Based on the assessment results, what training path do you recommend?`,
          metrics: { assessmentType: type, responses }
        })
      });
      
      const stellaData = await stellaResponse.json();
      if (stellaData.success) {
        stellaRecommendations = {
          message: stellaData.guidance.message,
          actionItems: stellaData.guidance.actionItems
        };
      }
    } catch (stellaError) {
      console.error('Error getting STELLA recommendations:', stellaError);
      // Continue without recommendations
    }
    
    // Return assessment ID and recommendations
    res.json({
      success: true,
      assessmentId: assessment._id,
      summary: `Assessment completed successfully! You've completed the ${type} assessment.`,
      scores: calculateScores(type, responses),
      stellaRecommendations
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate scores
function calculateScores(type, responses) {
  const scores = {};
  
  // Example scoring logic - customize based on your assessment types
  switch (type) {
    case 'initial':
      scores.physical = calculatePhysicalScore(responses);
      scores.mental = calculateMentalScore(responses);
      scores.technical = calculateTechnicalScore(responses);
      scores.overall = (scores.physical + scores.mental + scores.technical) / 3;
      break;
    case 'physical':
      scores.strength = calculateStrengthScore(responses);
      scores.endurance = calculateEnduranceScore(responses);
      scores.flexibility = calculateFlexibilityScore(responses);
      scores.overall = (scores.strength + scores.endurance + scores.flexibility) / 3;
      break;
    // Add cases for other assessment types
  }
  
  // Convert scores to percentages
  Object.keys(scores).forEach(key => {
    scores[key] = Math.round(scores[key] * 100);
  });
  
  return scores;
}

// Example scoring functions - implement according to your assessment structure
function calculatePhysicalScore(responses) {
  // Sample logic
  return 0.75; // 75%
}

function calculateMentalScore(responses) {
  return 0.80; // 80%
}

function calculateTechnicalScore(responses) {
  return 0.65; // 65%
}

function calculateStrengthScore(responses) {
  return 0.70; // 70%
}

function calculateEnduranceScore(responses) {
  return 0.80; // 80%
}

function calculateFlexibilityScore(responses) {
  return 0.60; // 60%
}
// POST: Initial user self-assessment
router.post('/initial', async (req, res) => {
    const { userId, responses } = req.body;
  
    try {
      // Save initial responses first
      const assessment = new Assessment({
        userId,
        moduleType: 'initial',
        responses
      });
  
      // Integrate STELLA AI (mocked for demonstration)
      assessment.stellaRecommendations = generateStellaRecommendations(responses);
      
      await assessment.save();
  
      // Update user profile with initial assessment completion
      await User.findByIdAndUpdate(userId, {
        $set: { 'assessmentsCompleted.initial': true }
      });
  
      res.json({
        success: true,
        recommendations: assessment.stellaRecommendations
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  });
  
  // Mock function for STELLA AI Recommendations
  function generateStellaRecommendations(responses) {
    // Example logic—your real logic will use AI APIs
    const topSkills = [];
  
    if (responses.aptitudeSkills.taskPreference === 'Technical problem-solving (machinery, software, hardware)')
      topSkills.push('Technical Problem Solving');
    
    if (responses.technicalCognitive.logicalReasoning === 'Excellent')
      topSkills.push('Logical Reasoning');
    
    if (responses.personalityTraits.environmentPreference === 'Structured environments')
      topSkills.push('Structured Task Management');
  
    return {
      topSkills,
      personalizedPath: [
        'Technical Module',
        'Cognitive Challenges Module',
        'Structured Task Management Module'
      ]
    };
  }
  // Add to routes/assessment.js
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's assessment status
    const user = await User.findById(userId).select('assessmentsCompleted').lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      assessments: user.assessmentsCompleted || {
        initial: false,
        physical: false,
        mental: false,
        technical: false,
        eva: false,
        'mission-core-balance': false
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add to routes/assessment.js
router.get('/results/:userId/:type', async (req, res) => {
  try {
    const { userId, type } = req.params;
    
    // Get the most recent assessment of this type
    const assessment = await Assessment.findOne({ 
      userId, 
      moduleType: type 
    }).sort({ completionDate: -1 }).lean();
    
    if (!assessment) {
      return res.status(404).json({ 
        success: false, 
        message: `No ${type} assessment found` 
      });
    }
    
    res.json({
      success: true,
      assessment
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
  router.get('/recommendations/:userId', async (req, res) => {
    const { userId } = req.params;
    
    // Fetch the user's latest assessment clearly
    const assessment = await Assessment.findOne({ userId, moduleType: 'physical' }).sort({ completionDate: -1 });
  
    // Clearly send assessment data to STELLA AI API (OpenAI or similar) clearly for recommendations
    const aiRecommendations = await getRecommendationsFromSTELLA(assessment.responses);
  
    res.json({ recommendations: aiRecommendations });
  });

  
module.exports = router;
