// routes/admin/stellaAnalytics.js
const express = require('express');
const router = express.Router();
const StellaConversation = require('../../models/StellaConversation');
const { authenticate, isAdmin } = require('../../middleware/auth');

// Secure all admin routes
router.use(authenticate);
router.use(isAdmin);

// Get dashboard overview stats
router.get('/overview', async (req, res) => {
  try {
    // Get basic metrics
    const totalQuestions = await StellaConversation.countDocuments({ fromUser: true });
    const totalResponses = await StellaConversation.countDocuments({ fromUser: false });
    const uniqueUsers = await StellaConversation.distinct('userId').length;
    
    // Get metrics through the model method
    const responseMetrics = await StellaConversation.getResponseMetrics();
    
    // Get most common question types
    const questionTypes = await StellaConversation.aggregate([
      { $match: { fromUser: true, 'aiAnalysis.questionType': { $exists: true } } },
      { $group: { _id: '$aiAnalysis.questionType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get most common topics
    const commonTopics = await StellaConversation.aggregate([
      { $match: { fromUser: true, 'aiAnalysis.topics': { $exists: true } } },
      { $unwind: '$aiAnalysis.topics' },
      { $group: { _id: '$aiAnalysis.topics', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 }
    ]);
    
    // Recent trend data (last 7 days)
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const dailyMetrics = await StellaConversation.aggregate([
      { $match: { timestamp: { $gte: last7Days } } },
      { $group: {
        _id: { 
          date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
          fromUser: '$fromUser'
        },
        count: { $sum: 1 }
      }},
      { $sort: { '_id.date': 1 } }
    ]);
    
    // Format the data for the dashboard
    const dailyStats = {};
    dailyMetrics.forEach(metric => {
      const date = metric._id.date;
      if (!dailyStats[date]) {
        dailyStats[date] = { questions: 0, responses: 0 };
      }
      if (metric._id.fromUser) {
        dailyStats[date].questions = metric.count;
      } else {
        dailyStats[date].responses = metric.count;
      }
    });
    
    res.json({
      success: true,
      metrics: {
        totalQuestions,
        totalResponses,
        uniqueUsers,
        responseMetrics,
        questionTypes: questionTypes.map(qt => ({ 
          type: qt._id || 'unclassified', 
          count: qt.count 
        })),
        commonTopics: commonTopics.map(t => ({ 
          topic: t._id || 'unclassified', 
          count: t.count 
        })),
        dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching STELLA analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Get most common questions
router.get('/common-questions', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const commonQuestions = await StellaConversation.getMostCommonQuestions(limit);
    
    res.json({
      success: true,
      questions: commonQuestions.map(q => ({
        id: q._id,
        content: q.content,
        frequency: q.frequencyData?.similarQuestionCount || 1,
        lastAsked: q.frequencyData?.lastAsked || q.timestamp,
        topics: q.aiAnalysis?.topics || [],
        questionType: q.aiAnalysis?.questionType || 'unknown'
      }))
    });
  } catch (error) {
    console.error('Error fetching common questions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch common questions' });
  }
});

// Get recent conversations with feedback
router.get('/feedback', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const conversations = await StellaConversation.find({ 
      fromUser: false,
      'userFeedback.helpful': { $exists: true } 
    })
    .sort({ 'userFeedback.receivedAt': -1 })
    .limit(limit)
    .lean();
    
    // Get the corresponding questions
    const conversationIds = conversations.map(c => c.metadata.sessionId).filter(id => id);
    const questions = await StellaConversation.find({
      fromUser: true,
      'metadata.sessionId': { $in: conversationIds }
    }).lean();
    
    // Map questions to responses
    const questionMap = {};
    questions.forEach(q => {
      if (q.metadata.sessionId) {
        questionMap[q.metadata.sessionId] = q.content;
      }
    });
    
    res.json({
      success: true,
      feedback: conversations.map(convo => ({
        id: convo._id,
        response: convo.content,
        question: questionMap[convo.metadata.sessionId] || 'Question not found',
        helpful: convo.userFeedback.helpful,
        rating: convo.userFeedback.rating,
        feedback: convo.userFeedback.feedbackText,
        receivedAt: convo.userFeedback.receivedAt,
        confidenceScore: convo.aiAnalysis?.confidenceScore || 0.5
      }))
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch feedback' });
  }
});

// Add improved response for a particular question
router.post('/improve-response', async (req, res) => {
  try {
    const { questionId, improvedResponse } = req.body;
    
    if (!questionId || !improvedResponse) {
      return res.status(400).json({
        success: false,
        error: 'Question ID and improved response are required'
      });
    }
    
    // Store the improved response
    await StellaConversation.create({
      userId: 'admin',
      fromUser: false,
      content: improvedResponse,
      timestamp: new Date(),
      metadata: {
        context: 'admin-improved',
        improvedFor: questionId
      },
      aiAnalysis: {
        confidenceScore: 1.0  // Admin-provided responses get highest confidence
      }
    });
    
    res.json({
      success: true,
      message: 'Improved response stored successfully'
    });
  } catch (error) {
    console.error('Error storing improved response:', error);
    res.status(500).json({ success: false, error: 'Failed to store improved response' });
  }
});

module.exports = router;