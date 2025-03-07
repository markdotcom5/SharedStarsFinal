const express = require('express');
const router = express.Router();
const { TrainingSession } = require('../../../models/TrainingSession');
const UserProgress = require('../../../models/UserProgress');
const STELLA_AI = require('../../../services/STELLA_AI'); // Updated to use STELLA_AI consistently

// Start Mission - single route handler
router.post('/start', async (req, res) => {
  try {
    // Get userId from body if req.user is undefined
    const userId = (req.user ? req.user.id : null) || req.body.userId;
    
    // Validate userId exists
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    
    const session = await TrainingSession.create({
      userId: userId,
      moduleType: "physical",
      moduleId: "balance",
      status: "in-progress",
      startTime: new Date(),
      adaptiveAI: { enabled: true }
    });
    
    // Log training start for analytics
    console.log(`User ${userId} started physical balance training session: ${session._id}`);
    
    res.json({ 
      success: true, 
      sessionId: session._id,
      message: "Core & Balance training session initialized" 
    });
  } catch (err) {
    console.error('Error starting training session:', err);
    res.status(500).json({ success: false, message: "Error starting session." });
  }
});

// Save Exercise Metrics - updated to use Map instead of array push
router.post('/metrics', async (req, res) => {
  const { sessionId, metrics } = req.body;
  const userId = req.body.userId || (req.user ? req.user.id : null);
  
  try {
    const session = await TrainingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }
    
    // Store metrics in database using Map
    if (!session.metrics) session.metrics = new Map();
    const metricKey = Date.now().toString(); // Use timestamp as key
    session.metrics.set(metricKey, metrics);
    await session.save();
    
    // Use STELLA to analyze the metrics!
    let feedback;
    try {
      feedback = await STELLA_AI.analyzeTraining(userId || session.userId, {
        moduleId: session.moduleId,
        metrics: metrics
      });
    } catch (aiError) {
      console.error('Error getting AI feedback:', aiError);
      // Fallback to simple feedback
      feedback = { 
        message: "Keep up the good work!",
        suggestions: ["Focus on proper form"]
      };
    }
    
    res.json({ success: true, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error saving metrics." });
  }
});

// Complete Mission - added null checks
router.post('/complete', async (req, res) => {
  const { sessionId, performanceData } = req.body;
  const userId = req.body.userId || (req.user ? req.user.id : null);
  
  try {
    const session = await TrainingSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }
    
    // Update session status
    session.status = 'completed';
    session.completedAt = new Date();
    
    // Store final performance data
    if (!session.metrics) session.metrics = new Map();
    session.metrics.set('finalPerformance', performanceData);
    
    // Calculate credits using STELLA's analysis
    let missionAnalysis;
    try {
      // Use the mission-specific analysis method from STELLA
      switch(session.moduleId) {
        case 'balance':
          missionAnalysis = await STELLA_AI.analyzeTraining(userId || session.userId, {
            moduleId: session.moduleId,
            metrics: performanceData
          });
          break;
        case 'endurance':
          missionAnalysis = await STELLA_AI.analyzeEnduranceTraining(userId || session.userId, {
            moduleId: session.moduleId,
            metrics: performanceData
          });
          break;
        default:
          missionAnalysis = await STELLA_AI.analyzeTraining(userId || session.userId, {
            moduleId: session.moduleId,
            metrics: performanceData
          });
      }
      
      // Save analysis results
      session.aiAnalysis = missionAnalysis;
      
      // Calculate credits based on AI analysis
      session.creditsEarned = Math.round(missionAnalysis.performanceScore);
      
    } catch (aiError) {
      console.error('Error getting AI analysis:', aiError);
      // Fallback to simple calculation
      session.creditsEarned = calculateCredits(performanceData);
    }
    
    await session.save();
    
    // Update user stats
    try {
      await updateUserStats(userId || session.userId, session.creditsEarned);
    } catch (statsError) {
      console.error('Error updating user stats:', statsError);
      // Continue execution even if stats update fails
    }
    
    // Get STELLA's next module recommendations
    let recommendations = [];
    try {
      recommendations = await STELLA_AI.recommendNextModules({
        userId: userId || session.userId,
        completedModules: [{ moduleId: session.moduleId, score: session.creditsEarned }]
      });
    } catch (recError) {
      console.error('Error getting recommendations:', recError);
    }
    
    res.json({ 
      success: true, 
      credits: { totalEarned: session.creditsEarned },
      analysis: session.aiAnalysis || {},
      recommendations: recommendations || []
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error completing session." });
  }
});

// Daily Briefing - updated to use STELLA_AI consistently
router.get('/daily-briefing/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Generate a personalized daily briefing
    const briefing = await STELLA_AI.generateDailyBriefing({ 
      userId, 
      includeTrainingDirective: true 
    });
    
    res.json({ success: true, briefing });
  } catch (error) {
    console.error('Error generating daily briefing:', error);
    res.status(500).json({ success: false, message: "Error generating briefing." });
  }
});

// Helper Functions

/**
 * Calculate credits earned based on performance metrics
 */
function calculateCredits(performanceData) {
  const { coreEngagement, balance, stability, posture, duration } = performanceData;
  
  // Base credits from performance metrics
  const performanceScore = (coreEngagement + balance + stability + posture) / 4;
  
  // Bonus for session duration (1 point per minute)
  const durationBonus = duration / 60;
  
  // Calculate total (rounded to nearest integer)
  return Math.round(performanceScore + durationBonus);
}

/**
 * Update user statistics after completing a mission
 */
async function updateUserStats(userId, creditsEarned) {
  try {
    const User = require('../../../models/User'); // Added explicit User model import
    
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $inc: { 
          credits: creditsEarned, 
          'trainingStats.balanceSessionsCompleted': 1,
          'trainingStats.totalSessionsCompleted': 1
        },
        $set: { 'trainingStats.lastBalanceSession': new Date() }
      }
    );
    
    if (updateResult.nModified === 0) {
      console.warn(`User stats not updated for userId: ${userId}`);
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    // Don't throw - we don't want to fail the whole request if just the stats update fails
  }
}

/**
 * Generate AI feedback based on training metrics
 */
async function generateAIFeedback(metrics) {
  // In production, this would call STELLA AI
  // For MVP, generate simulated feedback
  
  const { coreEngagement, balance, stability, posture, exerciseType } = metrics;
  
  let message, corrections = [], recommendations = [];
  
  // Default feedback
  message = "Good work! Keep focusing on proper form.";
  
  // Generate specific feedback based on metrics
  if (coreEngagement < 70) {
    corrections.push("Engage your core more throughout the exercise");
    recommendations.push("Try adding 5-minute planks to your daily routine");
  }
  
  if (balance < 70) {
    corrections.push("Focus on distributing your weight more evenly");
    recommendations.push("Practice single-leg balance exercises regularly");
  }
  
  if (stability < 70) {
    corrections.push("Reduce movement/wobbling during the exercise");
    recommendations.push("Try using stability ball for added challenge");
  }
  
  if (posture < 70) {
    corrections.push("Maintain neutral spine alignment");
    recommendations.push("Practice proper postural alignment while sitting and standing");
  }
  
  // Exercise-specific feedback
  if (exerciseType === 'planks') {
    if (coreEngagement > 85) {
      message = "Excellent core engagement during planks!";
    }
  } else if (exerciseType === 'stability-ball') {
    if (stability > 85) {
      message = "Great stability control with the ball!";
    }
  } else if (exerciseType === 'single-leg') {
    if (balance > 85) {
      message = "Impressive balance on the single-leg exercises!";
    }
  }
  
  return {
    message,
    corrections,
    recommendations
  };
}

/**
 * Generate mission completion summary
 */
async function generateCompletionSummary(session) {
  // This would connect to STELLA AI in production
  
  // Create a simple summary for MVP
  const finalPerformance = session.metrics.get('finalPerformance');
  const overallScore = Math.round((finalPerformance.coreEngagement + 
                                   finalPerformance.balance + 
                                   finalPerformance.stability + 
                                   finalPerformance.posture) / 4);
  
  let strengthArea = "core engagement";
  let improvementArea = "balance";
  
  // Determine actual strength based on metrics
  if (finalPerformance.coreEngagement >= finalPerformance.balance && 
      finalPerformance.coreEngagement >= finalPerformance.stability && 
      finalPerformance.coreEngagement >= finalPerformance.posture) {
    strengthArea = "core engagement";
  } else if (finalPerformance.balance >= finalPerformance.stability && 
             finalPerformance.balance >= finalPerformance.posture) {
    strengthArea = "balance";
  } else if (finalPerformance.stability >= finalPerformance.posture) {
    strengthArea = "stability";
  } else {
    strengthArea = "posture";
  }
  
  // Determine improvement area
  if (finalPerformance.coreEngagement <= finalPerformance.balance && 
      finalPerformance.coreEngagement <= finalPerformance.stability && 
      finalPerformance.coreEngagement <= finalPerformance.posture) {
    improvementArea = "core engagement";
  } else if (finalPerformance.balance <= finalPerformance.stability && 
             finalPerformance.balance <= finalPerformance.posture) {
    improvementArea = "balance";
  } else if (finalPerformance.stability <= finalPerformance.posture) {
    improvementArea = "stability";
  } else {
    improvementArea = "posture";
  }
  
  return {
    overallScore,
    summary: `Mission completed with an overall score of ${overallScore}%. Your strongest area was ${strengthArea}, and you could focus more on improving ${improvementArea} in future sessions.`,
    nextSteps: [
      "Continue to Mission 2: Endurance Boost",
      "Practice the exercises from this mission 2-3 times per week",
      "Focus specifically on improving your " + improvementArea
    ]
  };
}

module.exports = router;