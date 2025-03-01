// training.routes.js - Comprehensive Routes for SharedStars Training Platform

const express = require('express');
const router = express.Router();

// Import core services
const physicalTrainingService = require('../services/physicalTrainingService');
const stellaAI = require('../services/STELLA_AI');
const trainingLearningSystem = require('./TrainingLearningSystem');
const bayesianTracker = new trainingLearningSystem.BayesianTracker();
const certificationService = require('../services/certificationService');
const leaderboardService = require('../services/LeaderboardService');
const SpaceTimelineManager = require('../services/SpaceTimelineManager');

// Authentication middleware
const { requireAuth, requireRole } = require('../middleware/auth');

/**
 * MISSION MANAGEMENT ROUTES
 */

// Get all physical training missions
router.get('/api/training/physical/missions', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    const missions = await physicalTrainingService.getAllMissions(userId);
    res.json({ success: true, missions });
  } catch (error) {
    console.error('Error fetching missions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch missions'
    });
  }
});

// Get mission details
router.get('/api/training/physical/mission/:missionId', async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    // Get raw mission data
    const missionData = await physicalTrainingService.getMissionDetails(missionId);
    
    // Get personalized difficulty adjustments from STELLA
    const difficultyAdjustments = await physicalTrainingService.calculateAIDifficulty(userId, missionId);
    
    // Merge data for a personalized mission experience
    const personalizedMission = {
      ...missionData,
      adjustments: difficultyAdjustments
    };
    
    res.json({
      success: true,
      mission: personalizedMission
    });
  } catch (error) {
    console.error('Error fetching mission details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch mission details'
    });
  }
});

/**
 * SESSION MANAGEMENT ROUTES
 */

// Start training session
router.post('/api/training/physical/session/start', async (req, res) => {
  try {
    const { missionId } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Start session in tracking system
    const session = await physicalTrainingService.startTrainingSession(userId, missionId);
    
    // Initialize STELLA AI for this session
    await stellaAI.initializeSession(userId, missionId, session.sessionId);
    
    // Start Bayesian tracking for adaptive learning
    bayesianTracker.startTrackingSession(userId, session.sessionId, {
      missionType: missionId,
      startTime: new Date()
    });
    
    // Get space mission readiness context
    const spaceContext = await SpaceTimelineManager.getTrainingContext(userId);
    
    res.json({
      success: true,
      sessionId: session.sessionId,
      spaceContext,
      stellaIntegration: true
    });
  } catch (error) {
    console.error('Error starting training session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start training session'
    });
  }
});

// End training session
router.post('/api/training/physical/session/end', async (req, res) => {
  try {
    const { sessionId, missionId, metrics } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // End session in tracking system
    const sessionSummary = await physicalTrainingService.endTrainingSession(userId, sessionId, metrics);
    
    // Get STELLA analysis of the session
    const analysisResults = await stellaAI.analyzeSession(sessionId, metrics);
    
    // Update user progress based on session
    const progressUpdate = await physicalTrainingService.updateOverallProgress(userId, missionId, sessionSummary);
    
    // Check for certification milestones
    const certifications = await certificationService.checkCertificationProgress(userId, missionId, sessionSummary);
    
    // Update space mission readiness
    const readinessUpdate = await SpaceTimelineManager.updateReadiness(userId, {
      missionId,
      sessionSummary,
      analysisResults
    });
    
    res.json({
      success: true,
      summary: sessionSummary,
      analysis: analysisResults,
      progress: progressUpdate,
      certifications,
      readiness: readinessUpdate
    });
  } catch (error) {
    console.error('Error ending training session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to end training session'
    });
  }
});

/**
 * EXERCISE TRACKING ROUTES
 */

// Start exercise
router.post('/api/training/physical/exercise/start', async (req, res) => {
  try {
    const { sessionId, missionId, exerciseId, startTime } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Record exercise start
    await physicalTrainingService.startExercise(userId, sessionId, exerciseId, startTime);
    
    // Get STELLA guidance for this exercise
    const guidance = await stellaAI.getExerciseGuidance(userId, exerciseId, {
      sessionId,
      missionId,
      exerciseType: req.body.exerciseType
    });
    
    res.json({
      success: true,
      guidance,
      adaptiveParams: guidance.adaptiveParameters || {}
    });
  } catch (error) {
    console.error('Error starting exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start exercise'
    });
  }
});

// Update exercise metrics
router.post('/api/training/physical/exercise/metrics', async (req, res) => {
  try {
    const { sessionId, exerciseId, metrics } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Record metrics
    await physicalTrainingService.recordExerciseMetrics(userId, sessionId, exerciseId, metrics);
    
    // Get real-time feedback from STELLA
    const feedback = await stellaAI.getRealTimeFeedback(userId, sessionId, exerciseId, metrics);
    
    // Feed metrics to Bayesian tracker for learning
    bayesianTracker.updateMetrics(sessionId, {
      exerciseId,
      metrics,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error updating exercise metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update metrics'
    });
  }
});

// Complete exercise
router.post('/api/training/physical/exercise/complete', async (req, res) => {
  try {
    const { sessionId, exerciseId, metrics, duration } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Record exercise completion
    const exerciseSummary = await physicalTrainingService.completeExercise(
      userId, sessionId, exerciseId, metrics, duration
    );
    
    // Calculate earned credits
    const credits = await physicalTrainingService.calculateCredits(
      userId, sessionId, exerciseId, exerciseSummary
    );
    
    // Get STELLA analysis
    const analysis = await stellaAI.analyzeExerciseCompletion(
      userId, sessionId, exerciseId, exerciseSummary
    );
    
    // Update progress on current mission
    const missionProgress = await physicalTrainingService.updateMissionProgress(
      userId, sessionId, exerciseId
    );
    
    // Get next recommended exercise
    const nextRecommendation = await stellaAI.getNextExerciseRecommendation(
      userId, sessionId, exerciseSummary
    );
    
    res.json({
      success: true,
      summary: exerciseSummary,
      credits,
      analysis,
      missionProgress,
      nextRecommendation
    });
  } catch (error) {
    console.error('Error completing exercise:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete exercise'
    });
  }
});

/**
 * PROGRESS & METRICS ROUTES
 */

// Update training progress
router.post('/api/training/physical/progress/update', async (req, res) => {
  try {
    const { sessionId, missionId, exerciseId, metrics } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Update progress metrics
    await physicalTrainingService.updateTrainingProgress(
      userId, missionId, sessionId, { exerciseId, metrics }
    );
    
    // Get STELLA recommendations
    const recommendations = await physicalTrainingService.getSTELLARecommendations(
      userId, missionId
    );
    
    // Check if user has unlocked new training content
    const newContent = await physicalTrainingService.checkForUnlockedContent(userId, missionId, metrics);
    
    res.json({
      success: true,
      recommendations,
      newContent
    });
  } catch (error) {
    console.error('Error updating training progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update training progress'
    });
  }
});

// Get comprehensive progress report
router.get('/api/training/physical/progress/report', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    
    // Get overall physical training progress
    const progress = await physicalTrainingService.getPhysicalTrainingProgress(userId);
    
    // Get STELLA insights on progress
    const insights = await stellaAI.getProgressInsights(userId, progress);
    
    // Get space mission readiness assessment
    const readiness = await SpaceTimelineManager.getReadinessAssessment(userId);
    
    // Get certification status
    const certifications = await certificationService.getUserCertifications(userId);
    
    res.json({
      success: true,
      progress,
      insights,
      readiness,
      certifications
    });
  } catch (error) {
    console.error('Error generating progress report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate progress report'
    });
  }
});

/**
 * CREDITS & REWARDS ROUTES
 */

// Calculate and award credits
router.post('/api/training/physical/credits/calculate', async (req, res) => {
  try {
    const { sessionId, missionId, exerciseId, performanceData } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Calculate credits based on performance
    const creditData = await physicalTrainingService.calculateCredits(
      userId, missionId, performanceData
    );
    
    // Award credits to user account
    await physicalTrainingService.awardCredits(userId, creditData.totalEarned, {
      source: 'exercise_completion',
      exerciseId,
      sessionId
    });
    
    // Get updated credit balance
    const updatedBalance = await physicalTrainingService.getUserCreditBalance(userId);
    
    // Check for reward unlocks based on new balance
    const rewards = await physicalTrainingService.checkRewardUnlocks(userId, updatedBalance);
    
    res.json({
      success: true,
      ...creditData,
      newBalance: updatedBalance,
      rewards
    });
  } catch (error) {
    console.error('Error calculating credits:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate credits'
    });
  }
});

/**
 * COMMUNITY & SOCIAL ROUTES
 */

// Get leaderboard data
router.get('/api/training/physical/leaderboard/:missionId', async (req, res) => {
  try {
    const { missionId } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    // Get global leaderboard
    const globalLeaderboard = await leaderboardService.getMissionLeaderboard(missionId);
    
    // Get user's position
    const userRank = await leaderboardService.getUserRank(userId, missionId);
    
    // Get friends' rankings
    const friendsLeaderboard = await leaderboardService.getFriendsLeaderboard(userId, missionId);
    
    res.json({
      success: true,
      global: globalLeaderboard,
      user: userRank,
      friends: friendsLeaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

// Get crew training data (team training)
router.get('/api/training/physical/crew/:crewId', async (req, res) => {
  try {
    const { crewId } = req.params;
    const userId = req.user?.id || 'demo-user';
    
    // Get crew data
    const crewData = await physicalTrainingService.getCrewData(crewId);
    
    // Get crew readiness metrics
    const crewReadiness = await SpaceTimelineManager.getCrewReadiness(crewId);
    
    // Get user's contribution to crew
    const userContribution = await physicalTrainingService.getUserContributionToCrew(userId, crewId);
    
    res.json({
      success: true,
      crew: crewData,
      readiness: crewReadiness,
      userContribution
    });
  } catch (error) {
    console.error('Error fetching crew data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch crew data'
    });
  }
});

/**
 * STELLA AI INTEGRATION ROUTES
 */

// STELLA AI connect and initialize
router.post('/api/stella/connect', async (req, res) => {
  try {
    const { trainingType, metrics, adaptiveLearning } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Initialize STELLA for this user and training type
    const stellaSession = await stellaAI.initializeForUser(userId, {
      trainingType,
      metrics,
      adaptiveLearning
    });
    
    // Get personalized user model
    const userModel = await bayesianTracker.getUserModel(userId);
    
    res.json({
      success: true,
      sessionId: stellaSession.sessionId,
      personalizedModel: userModel.modelReady
    });
  } catch (error) {
    console.error('Error connecting to STELLA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to connect to STELLA'
    });
  }
});

// Get STELLA guidance
router.post('/api/stella/guidance', async (req, res) => {
  try {
    const { sessionId, exerciseId, metrics } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Get personalized guidance from STELLA
    const guidance = await stellaAI.getGuidance(userId, {
      sessionId,
      exerciseId,
      metrics
    });
    
    // Log guidance request for learning
    bayesianTracker.logUserInteraction(userId, 'guidance_request', {
      exerciseId,
      metrics,
      guidanceProvided: guidance
    });
    
    res.json({
      success: true,
      guidance
    });
  } catch (error) {
    console.error('Error getting STELLA guidance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get STELLA guidance'
    });
  }
});

// Record exercise completed in STELLA
router.post('/api/stella/exercise-complete', async (req, res) => {
  try {
    const { sessionId, exerciseId, missionId, performance } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Record completion in STELLA
    const feedback = await stellaAI.recordExerciseCompletion(userId, {
      sessionId,
      exerciseId,
      missionId,
      performance
    });
    
    // Update Bayesian model with completion data
    await bayesianTracker.updateModelWithCompletion(userId, {
      exerciseId,
      performance,
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      feedback,
      modelUpdated: true
    });
  } catch (error) {
    console.error('Error recording exercise completion:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record exercise completion'
    });
  }
});

// Get STELLA recommendations
router.get('/api/stella/recommendations', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    
    // Get personalized recommendations
    const recommendations = await stellaAI.getPersonalizedRecommendations(userId);
    
    // Get training schedule recommendations
    const schedule = await stellaAI.getRecommendedTrainingSchedule(userId);
    
    // Get focus areas based on user performance
    const focusAreas = await bayesianTracker.getUserFocusAreas(userId);
    
    res.json({
      success: true,
      recommendations,
      schedule,
      focusAreas
    });
  } catch (error) {
    console.error('Error getting STELLA recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recommendations'
    });
  }
});

/**
 * ADVANCED FEATURES & SIMULATION ROUTES
 */

// Get space mission simulation parameters
router.get('/api/training/simulation/parameters', async (req, res) => {
  try {
    const userId = req.user?.id || 'demo-user';
    
    // Get simulation parameters based on user's training progress
    const simulationParams = await SpaceTimelineManager.getSimulationParameters(userId);
    
    // Get physical parameters for VR/AR integration
    const physicalParams = await physicalTrainingService.getPhysicalParameters(userId);
    
    res.json({
      success: true,
      simulation: simulationParams,
      physical: physicalParams
    });
  } catch (error) {
    console.error('Error getting simulation parameters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get simulation parameters'
    });
  }
});

// Record wearable device data
router.post('/api/training/wearable/metrics', async (req, res) => {
  try {
    const { sessionId, deviceType, metrics } = req.body;
    const userId = req.user?.id || 'demo-user';
    
    // Record wearable metrics
    await physicalTrainingService.recordWearableMetrics(userId, sessionId, deviceType, metrics);
    
    // Get STELLA analysis of wearable data
    const analysis = await stellaAI.analyzeWearableData(userId, metrics);
    
    res.json({
      success: true,
      analysis,
      received: true
    });
  } catch (error) {
    console.error('Error recording wearable metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to record wearable metrics'
    });
  }
});

// Get VR/AR training overlay data
router.get('/api/training/vr/overlay', async (req, res) => {
  try {
    const { exerciseId } = req.query;
    const userId = req.user?.id || 'demo-user';
    
    // Get VR/AR overlay data for exercise
    const overlayData = await physicalTrainingService.getVROverlayData(userId, exerciseId);
    
    // Get personalized guidance for VR
    const vrGuidance = await stellaAI.getVRGuidance(userId, exerciseId);
    
    res.json({
      success: true,
      overlay: overlayData,
      guidance: vrGuidance
    });
  } catch (error) {
    console.error('Error getting VR overlay data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get VR overlay data'
    });
  }
});

module.exports = router;