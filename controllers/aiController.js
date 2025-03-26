const AIAssistant = require('../services/aiAssistant');
const aiGuidance = require('../services/AIGuidanceSystem');
const aiServices = require('../services/CoreAIServices');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class AIController {
  constructor() {
    this.cache = cache;
    this.assistant = AIAssistant;
    this.retryAttempts = 3;

    console.log('✅ AIController initialized successfully');
  }

  // ✅ Generate multilingual greeting
  async generateGreeting(req, res) {
    try {
      const greetings = {
        en: "Welcome back, Commander!",
        zh: "欢迎回来，指挥官！",
        ko: "다시 오신 것을 환영합니다, 지휘관님!",
        es: "¡Bienvenido de nuevo, Comandante!"
      };
        
      const language = req.headers['accept-language']?.split(',')[0] || 'en';
      const baseLanguage = language.split('-')[0];
        
      res.json({ 
        greeting: greetings[baseLanguage] || greetings.en 
      });
    } catch (error) {
      logger.error("Error generating greeting:", error);
      res.status(500).json({ greeting: "Welcome back, Commander!" });
    }
  }

  // ✅ Render AI Guidance view
  async renderAIGuidance(req, res) {
    try {
      const aiData = await aiGuidance.getGuidanceData();
      res.render('ai-guidance', { title: 'AI Guidance', guidance: aiData });
    } catch (error) {
      logger.error("Error rendering AI Guidance:", error);
      res.status(500).send('Error rendering AI Guidance');
    }
  }

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

  // ✅ Generate training content (with caching)
  async generateTrainingContent(req, res) {
    const { module } = req.params;
    const userLevel = req.user?.trainingLevel || 'beginner';
    const cacheKey = `training:${module}:${userLevel}`;

    try {
      const cachedContent = await this.cache.get(cacheKey);
      if (cachedContent) return res.json(cachedContent);

      let trainingContent = await this.assistant.generateTrainingContent(module, userLevel);

      if (!this.validateContent(trainingContent)) {
        trainingContent = await this.getFallbackWithRetry(module);
      }

      await this.cache.set(cacheKey, trainingContent, 3600); // cache for 1 hour

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
      res.status(500).json(this.handleError(error));
    }
  }

  // ✅ Generate problem-solving scenario
  async generateScenario(req, res) {
    const { module, complexity } = req.params;

    try {
      const scenario = await this.assistant.provideProblemSolvingScenario(
        module,
        complexity,
        req.user?.performanceMetrics
      );

      const hints = await this.generateHints(scenario);
      const timeEstimate = this.calculateTimeEstimate(scenario);

      res.json({ scenario, hints, timeEstimate });
    } catch (error) {
      logger.error('Scenario Generation Error:', error);
      res.status(500).json(this.handleError(error));
    }
  }

  // ✅ Fallback mechanism with retry logic
  async getFallbackWithRetry(module, attempts = 0) {
    if (attempts >= this.retryAttempts) {
      logger.warn(`Fallback content used for module: ${module}`);
      return this.assistant.getFallbackContent(module);
    }

    try {
      const content = await this.assistant.generateTrainingContent(module);
      return this.validateContent(content)
        ? content
        : this.getFallbackWithRetry(module, attempts + 1);
    } catch (error) {
      logger.warn(`Retry attempt ${attempts + 1} failed for module ${module}:`, error);
      return this.getFallbackWithRetry(module, attempts + 1);
    }
  }

  // ✅ Validate generated content
  validateContent(content) {
    return content &&
      content.length >= 100 &&
      content.includes('objectives') &&
      !content.includes('inappropriate');
  }

  // ✅ Generate hints for scenarios
  async generateHints(scenario) {
    try {
      return await this.assistant.generateHints(scenario);
    } catch (error) {
      logger.error('Hint Generation Error:', error);
      return ['Consider reviewing previous training materials for clues.'];
    }
  }

  // ✅ Calculate estimated time for scenario completion
  calculateTimeEstimate(scenario) {
    const baseTime = 15; // minutes
    const complexityFactor = scenario.complexity || 1;
    return Math.round(baseTime * complexityFactor);
  }

  // ✅ Consistent error handler
  handleError(error) {
    return {
      error: 'AI Processing Error',
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    };
  }
}

console.log("✅ AIController loaded successfully");
module.exports = new AIController();
