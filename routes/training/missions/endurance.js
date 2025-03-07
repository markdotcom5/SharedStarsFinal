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
      moduleId: "endurance",
      status: "in-progress",
      startTime: new Date(),
      adaptiveAI: { enabled: true }
    });
    
    // Log training start for analytics
    console.log(`User ${userId} started physical endurance training session: ${session._id}`);
    
    res.json({ 
      success: true, 
      sessionId: session._id,
      message: "Endurance training session initialized" 
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
        message: "Keep pushing through! Your endurance is improving with each session.",
        suggestions: ["Focus on maintaining a steady heart rate", "Remember to breathe rhythmically"]
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
        case 'endurance':
          missionAnalysis = await STELLA_AI.analyzeTraining(userId || session.userId, {
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

// Progress tracking endpoint
router.get('/progress/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's endurance training progress
    const progress = await UserProgress.findOne({ 
      userId, 
      moduleType: 'physical',
      moduleId: 'endurance'
    });
    
    if (!progress) {
      return res.json({
        success: true,
        progress: {
          completed: false,
          percentComplete: 0,
          lastActivity: null,
          metrics: {}
        }
      });
    }
    
    res.json({
      success: true,
      progress: {
        completed: progress.completed || false,
        percentComplete: progress.percentComplete || 0,
        lastActivity: progress.updatedAt,
        metrics: progress.metrics || {}
      }
    });
    
  } catch (error) {
    console.error('Error fetching endurance progress:', error);
    res.status(500).json({ success: false, message: "Error retrieving progress data." });
  }
});

// Endurance history endpoint
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find all completed endurance sessions for this user
    const sessions = await TrainingSession.find({
      userId,
      moduleId: 'endurance',
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(10);
    
    const history = sessions.map(session => {
      const finalPerformance = session.metrics.get('finalPerformance') || {};
      
      return {
        sessionId: session._id,
        date: session.completedAt,
        duration: finalPerformance.duration || 0,
        heartRate: finalPerformance.averageHeartRate || finalPerformance.heartRate || 0,
        distance: finalPerformance.distance || 0,
        creditsEarned: session.creditsEarned || 0,
        performanceScore: session.aiAnalysis ? session.aiAnalysis.performanceScore : 0
      };
    });
    
    res.json({
      success: true,
      history
    });
    
  } catch (error) {
    console.error('Error fetching endurance history:', error);
    res.status(500).json({ success: false, message: "Error retrieving training history." });
  }
});

// Helper Functions

/**
 * Calculate credits earned based on endurance performance metrics
 */
function calculateCredits(performanceData) {
  const { 
    heartRate, averageHeartRate, duration, distance, pace, 
    intensity, recoveryTime, caloriesBurned, vo2Max 
  } = performanceData;

  // Use average heart rate if available, otherwise use peak heartRate
  const effectiveHeartRate = averageHeartRate || heartRate || 150;
  
  // Base credits from endurance metrics
  // Heart rate scoring: optimal range is ~130-160 for moderate training
  let heartRateScore = 80;
  if (effectiveHeartRate) {
    if (effectiveHeartRate < 120) {
      // Too low intensity
      heartRateScore = 60;
    } else if (effectiveHeartRate > 180) {
      // Too high intensity (may be inefficient for endurance)
      heartRateScore = 70;
    } else if (effectiveHeartRate >= 130 && effectiveHeartRate <= 160) {
      // Optimal aerobic endurance range
      heartRateScore = 95;
    }
  }
  
  // Duration score (1 point per minute, max 100)
  const durationScore = Math.min(100, (duration || 0) / 60);
  
  // Distance score (normalized to expected distance)
  const distanceScore = Math.min(100, ((distance || 0) / 5) * 100); // Assuming 5km is full score
  
  // Intensity score (directly from input or calculate from other metrics)
  const intensityScore = intensity || Math.min(100, (caloriesBurned || 0) / 5);
  
  // Recovery time score (faster recovery is better)
  const recoveryScore = recoveryTime 
    ? Math.max(0, 100 - (recoveryTime / 60) * 20) // 5 min recovery = 0 points
    : 80; // Default if not provided
  
  // VO2 Max bonus (if available)
  const vo2MaxBonus = vo2Max ? Math.min(20, vo2Max / 3) : 0;
  
  // Calculate weighted average (emphasize duration and distance for endurance)
  const totalScore = (
    (heartRateScore * 0.15) + 
    (durationScore * 0.3) + 
    (distanceScore * 0.3) + 
    (intensityScore * 0.1) + 
    (recoveryScore * 0.15) + 
    vo2MaxBonus
  );
  
  return Math.round(totalScore);
}

/**
 * Update user statistics after completing an endurance mission
 */
async function updateUserStats(userId, creditsEarned) {
  try {
    const User = require('../../../models/User'); // Added explicit User model import
    
    const updateResult = await User.updateOne(
      { _id: userId },
      {
        $inc: { 
          credits: creditsEarned, 
          'trainingStats.enduranceSessionsCompleted': 1,
          'trainingStats.totalSessionsCompleted': 1,
          'physicalStats.totalDistance': performanceData.distance || 0,
          'physicalStats.totalCaloriesBurned': performanceData.caloriesBurned || 0
        },
        $set: { 
          'trainingStats.lastEnduranceSession': new Date(),
          'physicalStats.lastHeartRate': performanceData.heartRate || performanceData.averageHeartRate
        }
      }
    );
    
    // Update user progress record
    await UserProgress.findOneAndUpdate(
      {
        userId,
        moduleType: 'physical',
        moduleId: 'endurance'
      },
      {
        $set: {
          completed: true,
          percentComplete: 100,
          lastActivity: new Date(),
          'metrics.totalSessions': { $inc: 1 },
          'metrics.bestPerformance': { $max: creditsEarned }
        }
      },
      { upsert: true, new: true }
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
 * Generate AI feedback based on endurance training metrics
 */
async function generateAIFeedback(metrics) {
  // In production, this would call STELLA AI
  // For MVP, generate simulated feedback
  
  const { 
    heartRate, averageHeartRate, duration, distance, 
    pace, intensity, recoveryTime, exerciseType 
  } = metrics;
  
  let message, corrections = [], recommendations = [];
  
  // Default feedback
  message = "Good work on your endurance training! Keep building your stamina.";
  
  // Generate specific feedback based on metrics
  if ((averageHeartRate || heartRate) > 170) {
    corrections.push("Your heart rate was higher than optimal for endurance building");
    recommendations.push("Try to maintain a heart rate between 130-160 for aerobic training");
  }
  
  if (duration < 20) {
    corrections.push("For endurance training, aim to maintain activity for longer periods");
    recommendations.push("Gradually increase your session duration to 30+ minutes");
  }
  
  if (pace && pace > 7) { // assuming pace in min/km
    corrections.push("Consider a more sustainable pace for your endurance training");
    recommendations.push("Try interval training to improve your overall pace");
  }
  
  if (recoveryTime && recoveryTime > 10) {
    corrections.push("Your recovery time could be improved");
    recommendations.push("Incorporate active recovery techniques between sessions");
  }
  
  // Exercise-specific feedback
  if (exerciseType === 'running') {
    if (distance && distance > 5) {
      message = "Excellent distance covered in your run!";
    }
  } else if (exerciseType === 'cycling') {
    if (duration && duration > 45) {
      message = "Great cycling endurance session! Your stamina is building well.";
    }
  } else if (exerciseType === 'swimming') {
    if (distance && distance > 1) {
      message = "Impressive swimming distance! Water training is excellent for endurance.";
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
  
  // Create a summary for endurance mission
  const finalPerformance = session.metrics.get('finalPerformance');
  
  // Calculate overall score differently for endurance
  let overallScore = calculateCredits(finalPerformance);
  
  // Determine strength area based on metrics
  let strengthArea = "sustained activity";
  let improvementArea = "recovery time";
  
  if (finalPerformance.distance > 3 && finalPerformance.duration > 30) {
    strengthArea = "distance endurance";
  } else if ((finalPerformance.heartRate || finalPerformance.averageHeartRate) < 150 && finalPerformance.duration > 30) {
    strengthArea = "cardiovascular efficiency";
  } else if (finalPerformance.intensity > 80) {
    strengthArea = "high-intensity output";
  }
  
  // Determine improvement area
  if (finalPerformance.recoveryTime > 10) {
    improvementArea = "recovery time";
  } else if ((finalPerformance.heartRate || finalPerformance.averageHeartRate) > 170) {
    improvementArea = "heart rate control";
  } else if (finalPerformance.duration < 30) {
    improvementArea = "sustained activity duration";
  } else if (finalPerformance.distance < 2) {
    improvementArea = "distance capacity";
  }
  
  return {
    overallScore,
    summary: `Endurance mission completed with an overall score of ${overallScore}%. Your strongest area was ${strengthArea}, and you could focus more on improving ${improvementArea} in future sessions.`,
    nextSteps: [
      "Continue to Mission 3: Strength Building",
      "Maintain consistent endurance training 2-3 times per week",
      "Focus specifically on improving your " + improvementArea,
      "Consider cross-training to enhance overall endurance capacity"
    ]
  };
}

/**
 * Get recommended training parameters based on user history
 */
router.get('/recommendations/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user's previous endurance sessions
    const sessions = await TrainingSession.find({
      userId,
      moduleId: 'endurance',
      status: 'completed'
    }).sort({ completedAt: -1 }).limit(5);
    
    let recommendations = {
      targetHeartRate: "130-150 BPM",
      suggestedDuration: "30 minutes",
      suggestedDistance: "3 kilometers",
      focusArea: "Building base endurance",
      exerciseTypes: ["Running", "Cycling", "Swimming", "Rowing"]
    };
    
    // If we have previous sessions, personalize recommendations
    if (sessions.length > 0) {
      // Extract metrics from previous sessions
      const metrics = sessions.map(session => {
        const finalPerformance = session.metrics.get('finalPerformance') || {};
        return {
          heartRate: finalPerformance.averageHeartRate || finalPerformance.heartRate,
          duration: finalPerformance.duration,
          distance: finalPerformance.distance
        };
      });
      
      // Calculate averages
      const avgHeartRate = metrics.reduce((sum, m) => sum + (m.heartRate || 140), 0) / metrics.length;
      const avgDuration = metrics.reduce((sum, m) => sum + (m.duration || 20), 0) / metrics.length;
      const avgDistance = metrics.reduce((sum, m) => sum + (m.distance || 2), 0) / metrics.length;
      
      // Personalize recommendations based on history
      recommendations = {
        targetHeartRate: `${Math.max(120, Math.round(avgHeartRate - 5))}-${Math.min(170, Math.round(avgHeartRate + 5))} BPM`,
        suggestedDuration: `${Math.round(avgDuration * 1.1)} minutes`,
        suggestedDistance: `${(avgDistance * 1.1).toFixed(1)} kilometers`,
        focusArea: avgDuration < 30 ? "Increasing duration" : 
                  avgHeartRate > 160 ? "Improving cardiovascular efficiency" : 
                  "Building advanced endurance capacity",
        exerciseTypes: ["Running", "Cycling", "Swimming", "Rowing"]
      };
      
      // Use STELLA for AI-enhanced recommendations if available
      try {
        const stellaRecommendations = await STELLA_AI.getEnduranceRecommendations({
          userId,
          trainingHistory: sessions
        });
        
        if (stellaRecommendations) {
          recommendations = {
            ...recommendations,
            ...stellaRecommendations
          };
        }
      } catch (error) {
        console.error('Error getting STELLA recommendations:', error);
      }
    }
    
    res.json({
      success: true,
      recommendations
    });
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ success: false, message: "Error generating recommendations." });
  }
});

module.exports = router;