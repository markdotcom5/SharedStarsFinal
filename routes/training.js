const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authenticate');
const rateLimit = require('express-rate-limit'); // Rate limiter
const TrainingSession = require('../models/TrainingSession'); // Mongoose model
const AISpaceCoach = require('../services/AISpaceCoach'); // AI Assistant service
const Joi = require('joi');
const AIController = require('../controllers/aiController'); // or a dedicated TrainingController
const Module = require("../models/Module"); // ✅ Use the correct model name
const mongoose = require("mongoose");
const progressTracker = require('../services/ProgressTracker'); // Centralized tracker

// Pagination Schema
const paginationSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
});

// Rate Limiter Middleware
const sessionLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
});

// Validate Input Middleware
const validateSessionInput = (req, res, next) => {
    const { sessionType, dateTime } = req.body;

    if (!sessionType || typeof sessionType !== 'string') {
        return res.status(400).json({ error: 'Invalid or missing session type.' });
    }

    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate) || parsedDate < new Date()) {
        return res.status(400).json({ error: 'Invalid or past date.' });
    }

    next();
};
// Get Available Training Modules (Existing endpoint)
router.get('/modules', authenticate, async (req, res) => {
    try {
        const modules = [
            { id: 'physical-001', name: 'Physical Training', description: 'Improve your physical readiness.' },
            { id: 'technical-001', name: 'Technical Training', description: 'Boost your technical skills.' },
            { id: 'simulation-001', name: 'Space Simulation', description: 'Experience simulated space missions.' },
            { id: 'team-001', name: 'Team Dynamics', description: 'Enhance teamwork and leadership skills.' },
        ];

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error.message);
        res.status(500).json({ error: 'Failed to fetch training modules.' });
    }
});

// ✅ Get Physical Training Modules
router.get("/modules/physical", authenticate, async (req, res) => {
    try {
        const physicalModules = await Module.find({ category: "physical" });
        if (!physicalModules || physicalModules.length === 0) {
            return res.status(404).json({ error: "No physical modules found" });
        }
        res.json(physicalModules);
    } catch (error) {
        console.error("Error fetching physical modules:", error.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

  

// Dedicated endpoint for Technical Training
router.get('/modules/technical', authenticate, async (req, res) => {
  try {
    const technicalData = {
      id: 'technical-001',
      title: 'Technical Training Module',
      description: 'Develop essential technical skills for space operations.',
      objectives: ['System operations', 'Emergency procedures', 'Navigation']
    };
    res.json({ success: true, data: technicalData });
  } catch (err) {
    console.error('Error fetching technical training data:', err);
    res.status(500).json({ error: 'Failed to fetch technical training data.' });
  }
});

// Dedicated endpoint for AI-Guided Training
router.get('/modules/ai-guided', authenticate, async (req, res) => {
  try {
    // Use your aiGuidance service to get dynamic content.
    // Ensure that your aiGuidance.getGuidanceData() method exists and returns data.
    const aiData = await require('../services/aiGuidance').getGuidanceData();
    res.json({ success: true, data: aiData });
  } catch (err) {
    console.error('Error fetching AI-guided training data:', err);
    res.status(500).json({ error: 'Failed to fetch AI-guided training data.' });
  }
});

// Route: Fetch Training Modules
router.get('/modules', authenticate, async (req, res) => {
    try {
        const modules = [
            { id: 1, name: 'Physical Training', description: 'Improve your physical readiness.' },
            { id: 2, name: 'Mental Training', description: 'Boost your mental strength and focus.' },
            { id: 3, name: 'Space Simulation', description: 'Experience simulated space missions.' },
            { id: 4, name: 'Technical Skills', description: 'Develop technical skills for space exploration.' },
            { id: 5, name: 'Team Dynamics', description: 'Enhance teamwork and leadership skills.' },
        ];

        res.json({ success: true, modules });
    } catch (error) {
        console.error('Error fetching modules:', error.message);
        res.status(500).json({ error: 'Failed to fetch training modules.' });
    }
});
// Render Physical Training Module page
router.get('/physical', async (req, res) => {
    try {
      // For MVP, you might simulate some training content here.
      const trainingContent = {
        module: 'physical-001',
        title: 'Physical Training Module',
        description: 'Prepare your body for space travel with focused physical training.',
        objectives: ['Cardiovascular fitness', 'Strength training', 'Zero-G adaptation'],
        // You can add more fields as needed.
      };
      // Render a view that displays this training content.
      res.render('training-physical', { title: 'Physical Training', content: trainingContent });
    } catch (error) {
      console.error('Error rendering Physical Training module:', error);
      res.status(500).send('Error rendering module.');
    }
  });
  
// Protected Route: Create a Training Session
router.post('/sessions', authenticate, validateSessionInput, async (req, res) => {
    const { sessionType, dateTime, participants, points = 0 } = req.body;

    try {
        const session = new TrainingSession({
            userId: req.user._id,
            sessionType,
            dateTime,
            participants,
            points,
            status: 'scheduled',
        });
        await session.save();
        res.status(201).json({ message: 'Session created successfully', session });
    } catch (error) {
        console.error('Error creating session:', error.message);
        res.status(500).json({ error: 'Failed to create session.' });
    }
});
router.post('/training/progress', authenticate, async (req, res) => {
    try {
        const { progress } = req.body;
        const result = await progressTracker.updateProgress(req.user._id, progress);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// Analyze Training Progress
router.post('/progress', authenticate, async (req, res) => {
    const { trainingData } = req.body;

    try {
        const analysis = await AISpaceCoach.analyzeProgress(trainingData);
        res.status(200).json({ success: true, analysis });
    } catch (error) {
        console.error('Error analyzing progress:', error.message);
        res.status(500).json({ success: false, error: 'Failed to analyze progress.' });
    }
});

// ✅ Route to Start a Training Module
// ✅ Route to Start a Training Module
router.post("/modules/:moduleId/start", authenticate, async (req, res) => {
    try {
        let { moduleId } = req.params;
        console.log(`🔍 Received request to start module: ${moduleId}`);

        // ✅ Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(moduleId)) {
            console.error("🚨 Invalid moduleId format:", moduleId);
            return res.status(400).json({ error: "Invalid moduleId format" });
        }

        // ✅ Fetch the module
        const module = await Module.findById(moduleId);
        if (!module) {
            console.error("🚨 Module not found:", moduleId);
            return res.status(404).json({ error: "Module not found" });
        }

        console.log("✅ Module found:", module);

        res.json({ message: `Module ${moduleId} started successfully`, module });
    } catch (error) {
        console.error("🚨 Error starting module:", error);
        res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
});

// Update a Training Session
router.patch('/sessions/:sessionId', authenticate, sessionLimiter, async (req, res) => {
    const { progress, status } = req.body;

    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            { $set: { progress, status } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.json({ message: 'Session updated successfully', session });
    } catch (error) {
        console.error('Error updating session:', error.message);
        res.status(500).json({ error: 'Failed to update session.' });
    }
});

// Fetch Upcoming Training Sessions with Pagination
router.get('/upcoming', authenticate, async (req, res) => {
    try {
        const { page, limit } = await paginationSchema.validateAsync(req.query);

        const sessions = await TrainingSession.find({
            userId: req.user._id,
            dateTime: { $gt: new Date() },
            status: 'scheduled',
        })
            .sort({ dateTime: 1 })
            .skip((page - 1) * limit)
            .limit(limit);

        const totalSessions = await TrainingSession.countDocuments({
            userId: req.user._id,
            dateTime: { $gt: new Date() },
            status: 'scheduled',
        });

        res.json({
            totalSessions,
            totalPages: Math.ceil(totalSessions / limit),
            currentPage: page,
            hasNextPage: page < Math.ceil(totalSessions / limit),
            hasPrevPage: page > 1,
            sessions,
        });
    } catch (error) {
        console.error('Error fetching upcoming sessions:', error.message);
        res.status(500).json({ error: 'Failed to fetch upcoming sessions.' });
    }
});

// Complete a Training Session
router.patch('/sessions/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            { $set: { status: 'completed', progress: 100 } },
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ error: 'Session not found.' });
        }

        res.json({ message: 'Session completed successfully', session });
    } catch (error) {
        console.error('Error completing session:', error.message);
        res.status(500).json({ error: 'Failed to complete session.' });
    }
});
// AI Initialization Endpoint
router.post('/assessment/start', authenticate, sessionLimiter, async (req, res) => {
    try {
        console.log('Starting new assessment session...');
        
        const session = new TrainingSession({
            userId: req.user._id,
            sessionType: 'Assessment',
            dateTime: new Date(),
            status: 'in-progress',
            aiGuidance: {
                enabled: true,
                lastGuidance: 'Starting initial assessment'
            },
            assessment: {  // Explicit initialization for assessment
                type: 'initial',
                responses: [],
                startedAt: new Date(),
                aiRecommendations: {
                    focusAreas: [],
                    suggestedModules: [],
                    personalizedFeedback: '',
                    nextSteps: []
                }
            }
        });

        console.log('Getting initial assessment questions...');
        const assessmentQuestions = await AISpaceCoach.getInitialAssessment();
        
        await session.save();
        
        res.json({
            success: true,
            sessionId: session._id,
            questions: assessmentQuestions
        });
    } catch (error) {
        console.error('Complete error object:', error);
        res.status(500).json({ 
            error: 'Failed to start assessment',
            details: error.message 
        });
    }
});

  
  // AI Guidance Endpoint
  router.post("/ai-guidance", async (req, res) => {
    try {
      const { questionId, currentProgress } = req.body;
      // Insert your AI guidance logic here.
      // For now, just simulate a success response:
      res.json({
        success: true,
        guidance: "Here is your guidance based on the question.",
      });
    } catch (error) {
      console.error("Error in AI guidance:", error);
      res.status(500).json({ error: "Failed to generate AI guidance", details: error.message });
    }
  });
  
  // Assessment Answer Submission Endpoint
  router.post("/assessment/:sessionId/submit", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const { answer, questionIndex } = req.body;
      if (!answer || typeof questionIndex === "undefined") {
        return res.status(400).json({ error: "Missing required fields" });
      }
      // Insert logic to process the answer here.
      // For now, simulate a success response:
      res.json({
        success: true,
        sessionId,
        message: "Answer submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting answer:", error);
      res.status(500).json({ error: "Failed to submit answer", details: error.message });
    }
  });
  
// Submit Assessment Answer
router.post('/assessment/:sessionId/submit', authenticate, sessionLimiter, async (req, res) => {
    try {
        const { question, answer } = req.body;
        const session = await TrainingSession.findOne({
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Record the response (ensure this method is defined in your model)
        session.submitAssessmentResponse(question, answer);

        // Get AI analysis of the answer
        const aiAnalysis = await AISpaceCoach.analyzeResponse(question, answer);
        
        // Update session with AI recommendations
        if (aiAnalysis.recommendations) {
            session.assessment.aiRecommendations = {
                ...session.assessment.aiRecommendations,
                ...aiAnalysis.recommendations
            };
        }

        await session.save();

        // Check if this was the last question
        const isComplete = session.assessment.responses.length >= aiAnalysis.totalQuestions;

        res.json({
            success: true,
            isComplete,
            nextQuestion: isComplete ? null : aiAnalysis.nextQuestion,
            immediateGuidance: aiAnalysis.immediateGuidance
        });
    } catch (error) {
        console.error('Error submitting assessment answer:', error);
        res.status(500).json({ error: 'Failed to submit answer' });
    }
});


// Complete Assessment and Generate Training Plan
router.post('/assessment/:sessionId/complete', authenticate, sessionLimiter, async (req, res) => {
    try {
        const session = await TrainingSession.findOne({
            _id: req.params.sessionId,
            userId: req.user._id,
            status: 'in-progress'
        });

        if (!session) {
            return res.status(404).json({ error: 'Assessment session not found' });
        }

        // Generate final analysis and training plan using all responses
        const finalAnalysis = await AISpaceCoach.generateTrainingPlan(session.assessment.responses);
        
        // Update session with results using a custom method for clean encapsulation
        session.completeAssessment(finalAnalysis.score, finalAnalysis.recommendations);
        session.status = 'completed';
        session.metrics = {
            physicalReadiness: finalAnalysis.metrics.physical,
            mentalPreparedness: finalAnalysis.metrics.mental,
            technicalProficiency: finalAnalysis.metrics.technical,
            overallScore: finalAnalysis.metrics.overall
        };

        await session.save();

        res.json({
            success: true,
            trainingPlan: {
                recommendedModules: finalAnalysis.recommendations.suggestedModules,
                focusAreas: finalAnalysis.recommendations.focusAreas,
                timeline: finalAnalysis.recommendations.timeline,
                nextSteps: finalAnalysis.recommendations.nextSteps
            },
            metrics: session.metrics
        });
    } catch (error) {
        console.error('Error completing assessment:', error);
        res.status(500).json({ error: 'Failed to complete assessment' });
    }
});

// Toggle AI Guidance
router.post('/ai-guidance/toggle', authenticate, async (req, res) => {
    try {
        const { enabled } = req.body;
        const session = await TrainingSession.findOne({
            userId: req.user._id,
            status: 'in-progress'
        });

        if (session) {
            session.aiGuidance.enabled = enabled;
            await session.save();
        }

        res.json({
            success: true,
            aiGuidanceEnabled: enabled
        });
    } catch (error) {
        console.error('Error toggling AI guidance:', error);
        res.status(500).json({ error: 'Failed to toggle AI guidance' });
    }
});

// Get AI Recommendations
router.get('/ai-recommendations', authenticate, async (req, res) => {
    try {
        const latestSession = await TrainingSession.findOne({
            userId: req.user._id
        }).sort({ createdAt: -1 });

        if (!latestSession) {
            return res.status(404).json({ error: 'No training sessions found' });
        }

        const recommendations = await AISpaceCoach.getPersonalizedRecommendations(
            req.user._id,
            latestSession.metrics
        );

        res.json({
            success: true,
            recommendations
        });
    } catch (error) {
        console.error('Error getting AI recommendations:', error);
        res.status(500).json({ error: 'Failed to get recommendations' });
    }
});
module.exports = router;
