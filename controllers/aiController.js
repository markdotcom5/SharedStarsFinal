const AIAssistant = require('../services/aiAssistant');
const aiGuidance = require('../services/AIGuidanceSystem');
const aiServices = require('../services/CoreAIServices');
const stellaAI = require('../services/STELLA_AI');
const { createChatCompletion } = require('../services/openaiService');
const UserProgress = require('../models/UserProgress');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

module.exports = {

  // ✅ STELLA Personalized Guidance
  async getPersonalizedGuidance(userId, question, context = {}) {
    try {
      const userProgress = await UserProgress.findOne({ userId }).lean();
      const enhancedContext = {
        ...context,
        progress: userProgress || {},
        timestamp: new Date().toISOString()
      };

      const messages = [
        { role: 'system', content: `Context: ${JSON.stringify(enhancedContext)}` },
        { role: 'user', content: question }
      ];

      const response = await createChatCompletion(messages);
      return response.content;
    } catch (error) {
      logger.error('Error in personalized guidance:', error);
      return "I'm experiencing issues. Try again shortly.";
    }
  },

  // ✅ Generate multilingual greeting
  async generateGreeting(req, res) {
    const greetings = {
      en: "Welcome back, Commander!",
      zh: "欢迎回来，指挥官！",
      ko: "다시 오신 것을 환영합니다, 지휘관님!",
      es: "¡Bienvenido de nuevo, Comandante!"
    };

    const language = req.headers['accept-language']?.split(',')[0] || 'en';
    const baseLanguage = language.split('-')[0];

    res.json({ greeting: greetings[baseLanguage] || greetings.en });
  },

  // ✅ Generate training content (with caching)
  async generateTrainingContent(req, res) {
    const { module } = req.params;
    const userLevel = req.user?.trainingLevel || 'beginner';
    const cacheKey = `training:${module}:${userLevel}`;

    try {
      const cachedContent = await cache.get(cacheKey);
      if (cachedContent) return res.json(cachedContent);

      let trainingContent = await AIAssistant.generateTrainingContent(module, userLevel);

      if (!validateContent(trainingContent)) {
        trainingContent = await getFallbackWithRetry(module);
      }

      await cache.set(cacheKey, trainingContent, 3600);

      res.json({
        module,
        content: trainingContent,
        difficulty: userLevel,
        metadata: {
          generatedAt: new Date().toISOString(),
          version: '1.0'
        }
      });
    } catch (error) {
      logger.error('AI Content Generation Error:', error);
      res.status(500).json(handleError(error));
    }
  },

  // ✅ Generate problem-solving scenario
  async generateScenario(req, res) {
    const { module, complexity } = req.params;

    try {
      const scenario = await AIAssistant.provideProblemSolvingScenario(
        module,
        complexity,
        req.user?.performanceMetrics
      );

      const hints = await generateHints(scenario);
      const timeEstimate = calculateTimeEstimate(scenario);

      res.json({ scenario, hints, timeEstimate });
    } catch (error) {
      logger.error('Scenario Generation Error:', error);
      res.status(500).json(handleError(error));
    }
  },

  // ✅ Render AI Guidance view
  async renderAIGuidance(req, res) {
    try {
      const aiData = await aiGuidance.getGuidanceData();
      res.render('ai-guidance', { title: 'AI Guidance', guidance: aiData });
    } catch (error) {
      logger.error("Error rendering AI Guidance:", error);
      res.status(500).send('Error rendering AI Guidance');
    }
  },

  // ✅ Launch AI-guided training session
  async launchAIGuidedTraining(req, res) {
    try {
      const result = await aiServices.startTraining(req.body);
      res.json({ success: true, result });
    } catch (error) {
      logger.error("Error launching AI-guided training:", error);
      res.status(500).json({ error: 'Failed to launch AI training' });
    }
  }
};

// ✅ Utility Functions (clearly at the bottom, as best practice)
async function getFallbackWithRetry(module, attempts = 0) {
  const retryAttempts = 3;
  if (attempts >= retryAttempts) {
    logger.warn(`Fallback content used for module: ${module}`);
    return AIAssistant.getFallbackContent(module);
  }

  try {
    const content = await AIAssistant.generateTrainingContent(module);
    return validateContent(content)
      ? content
      : getFallbackWithRetry(module, attempts + 1);
  } catch (error) {
    logger.warn(`Retry attempt ${attempts + 1} failed for module ${module}:`, error);
    return getFallbackWithRetry(module, attempts + 1);
  }
}

function validateContent(content) {
  return content &&
    content.length >= 100 &&
    content.includes('objectives') &&
    !content.includes('inappropriate');
}

async function generateHints(scenario) {
  try {
    return await AIAssistant.generateHints(scenario);
  } catch (error) {
    logger.error('Hint Generation Error:', error);
    return ['Consider reviewing previous training materials for clues.'];
  }
}

function calculateTimeEstimate(scenario) {
  const baseTime = 15;
  const complexityFactor = scenario.complexity || 1;
  return Math.round(baseTime * complexityFactor);
}

function handleError(error) {
  return {
    error: 'AI Processing Error',
    message: error.message,
    code: error.code || 'INTERNAL_ERROR'
  };
}
