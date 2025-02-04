const OpenAI = require('openai');
const User = require('../models/User');
const TrainingSession = require('../models/TrainingSession');

class AIGuidance {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.defaultModel = 'gpt-4-turbo-preview';
    this.systemPrompts = {
      realTime: "You are StelTrek's advanced AI guidance system, specialized in real-time space training optimization. Your role is to provide immediate, actionable guidance that adapts to the user's current performance and progress.",
      feedback: "You are an expert space training analyst, focused on providing detailed, constructive feedback to improve astronaut preparation. Consider both technical skills and psychological readiness.",
      planning: "You are a strategic space training planner, responsible for creating comprehensive daily programs that balance physical, technical, and psychological preparation for space travel."
    };
  }

  // Corrected: Define getGuidanceData as a method, not a function inside the class
  async getGuidanceData() {
    // Simulate a delay for fetching data
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          message: 'Welcome to your AI Guidance dashboard! Here are your personalized tips:',
          tips: [
            { title: 'Tip 1', description: 'Focus on module 1 for a strong foundation.' },
            { title: 'Tip 2', description: 'Review training videos for better retention.' },
            { title: 'Tip 3', description: 'Practice with interactive quizzes.' }
          ]
        });
      }, 500);
    });
  }

  async processRealTimeAction(userId, action) {
    try {
      const user = await User.findById(userId).select('trainingProgress aiGuidance');
      if (!user) throw new Error('User not found');

      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: this.systemPrompts.realTime
          },
          {
            role: "user",
            content: `Current Action: ${JSON.stringify(action, null, 2)}
                      Training Progress: ${JSON.stringify(user.trainingProgress, null, 2)}
                      AI Guidance Mode: ${user.aiGuidance.mode}`
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const guidance = completion.choices[0].message.content;

      // Create training session with enhanced tracking
      const session = await TrainingSession.create({
        userId,
        actionType: action.type,
        action,
        guidance,
        performance: {
          completionRate: action.completionRate || 0,
          accuracy: action.accuracy || 0,
          timeSpent: action.timeSpent || 0
        },
        aiMetrics: {
          modelUsed: this.defaultModel,
          responseTokens: completion.usage.total_tokens,
          guidanceQuality: action.success ? 'effective' : 'needs_improvement'
        },
        timestamp: new Date()
      });

      // Update user's guidance context
      await User.findByIdAndUpdate(userId, {
        $push: {
          'aiGuidance.context.recentActions': {
            action: action.type,
            timestamp: new Date(),
            success: action.success || false
          }
        },
        $set: {
          'aiGuidance.lastInteraction': new Date(),
          'aiGuidance.context.currentPhase': this.determineTrainingPhase(user.trainingProgress)
        }
      });

      return {
        guidance,
        sessionId: session._id,
        nextSteps: this.extractNextSteps(guidance),
        performance: session.performance,
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Real-time Processing Error:', {
        userId,
        action,
        error: error.message,
        stack: error.stack
      });
      throw new Error(`AI Guidance Error: ${error.message}`);
    }
  }

  async provideFeedback(userId, sessionData) {
    try {
      const user = await User.findById(userId).select('trainingProgress spaceGoals');
      if (!user) throw new Error('User not found');

      const completion = await this.openai.chat.completions.create({
        model: this.defaultModel,
        messages: [
          {
            role: "system",
            content: this.systemPrompts.feedback
          },
          {
            role: "user",
            content: `Session Data: ${JSON.stringify(sessionData, null, 2)}
                      Progress Overview: ${JSON.stringify(user.trainingProgress, null, 2)}
                      Goals: ${JSON.stringify(user.spaceGoals, null, 2)}`
          }
        ],
        temperature: 0.8
      });

      const feedback = completion.choices[0].message.content;
      
      return {
        feedback,
        recommendations: this.extractRecommendations(feedback),
        strengths: this.extractStrengths(feedback),
        areasForImprovement: this.extractAreasForImprovement(feedback),
        nextMilestones: this.extractMilestones(feedback),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Feedback Generation Error:', error);
      throw error;
    }
  }

  // Helper methods
  determineTrainingPhase(progress) {
    // Add your logic to determine training phase based on progress
    return 'intermediate'; // Example return
  }

  extractNextSteps(guidance) {
    try {
      const steps = guidance.match(/Next Steps:(.*?)(?=\n\n|$)/s);
      return steps ? 
        steps[1].trim().split('\n').map(step => step.trim().replace(/^\d+\.\s*/, '')) : 
        [];
    } catch (error) {
      return [];
    }
  }

  extractStrengths(feedback) {
    try {
      const strengths = feedback.match(/Strengths:(.*?)(?=\n\n|$)/s);
      return strengths ? 
        strengths[1].trim().split('\n').map(s => s.trim().replace(/^-\s*/, '')) : 
        [];
    } catch (error) {
      return [];
    }
  }

  extractAreasForImprovement(feedback) {
    try {
      const areas = feedback.match(/Areas for Improvement:(.*?)(?=\n\n|$)/s);
      return areas ? 
        areas[1].trim().split('\n').map(a => a.trim().replace(/^-\s*/, '')) : 
        [];
    } catch (error) {
      return [];
    }
  }

  extractMilestones(feedback) {
    try {
      const milestones = feedback.match(/Milestones:(.*?)(?=\n\n|$)/s);
      return milestones ? 
        milestones[1].trim().split('\n').map(m => m.trim().replace(/^-\s*/, '')) : 
        [];
    } catch (error) {
      return [];
    }
  }
}

module.exports = new AIGuidance();
