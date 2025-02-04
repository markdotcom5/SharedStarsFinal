const AIAssistant = require('../services/aiAssistant');
const aiGuidance = require('../services/aiGuidance.js');
const aiServices = require('../services/aiServices.js');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

class AIController {
  constructor() {
    this.assistant = AIAssistant;
    this.cache = cache;
    this.retryAttempts = 3;
  }
  async generateGreeting(req, res) {
    try {
      // You can add logic to personalize this message using req.user data if available.
      const greeting = "Welcome back, Commander. Let's resume our Mission!";
      res.json({ greeting });
    } catch (error) {
      console.error("Error generating greeting:", error);
      res.status(500).json({ greeting: "Welcome back, Commander. Let's resume our Mission!" });
    }
  }
  /**
   * Renders the AI Guidance view.
   * @param {object} req Express request
   * @param {object} res Express response
   */
  async renderAIGuidance(req, res) {
    try {
      const aiData = await aiGuidance.getGuidanceData();
      res.render('ai-guidance', { title: 'AI Guidance', guidance: aiData });
    } catch (error) {
      logger.error("Error rendering AI Guidance", error);
      res.status(500).send('Error rendering AI Guidance');
    }
  }
  /**
   * Launches an AI-guided training session.
   * @param {object} req Express request
   * @param {object} res Express response
   */
  async launchAIGuidedTraining(req, res) {
    try {
      const result = await aiServices.startTraining(req.body);
      res.json({ success: true, result });
    } catch (error) {
      logger.error("Error launching AI guided training", error);
      res.status(500).json({ error: 'Failed to launch AI training' });
    }
  }

  /**
   * Generates training content for a given module and user level.
   * Caches the result for 1 hour.
   * @param {object} req Express request
   * @param {object} res Express response
   */
  async generateTrainingContent(req, res) {
    const { module } = req.params;
    const userLevel = req.user?.trainingLevel || 'beginner';
    const cacheKey = `training:${module}:${userLevel}`;

    try {
      // Check cache first
      const cachedContent = await this.cache.get(cacheKey);
      if (cachedContent) {
        return res.json(cachedContent);
      }

      let trainingContent = await this.assistant.generateTrainingContent(module, userLevel);

      // Validate content and use fallback with retry if needed
      if (!this.validateContent(trainingContent)) {
        trainingContent = await this.getFallbackWithRetry(module);
      }

      // Cache valid content (1 hour)
      await this.cache.set(cacheKey, trainingContent, 3600);

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

  /**
   * Generates a problem-solving scenario, including hints and a time estimate.
   * @param {object} req Express request
   * @param {object} res Express response
   */
  async generateScenario(req, res) {
    const { module, complexity } = req.params;

    try {
      const scenario = await this.assistant.provideProblemSolvingScenario(
        module,
        complexity,
        req.user?.performanceMetrics
      );

      res.json({
        scenario,
        hints: await this.generateHints(scenario),
        timeEstimate: this.calculateTimeEstimate(scenario)
      });
    } catch (error) {
      logger.error('Scenario Generation Error:', error);
      res.status(500).json(this.handleError(error));
    }
  }

  /**
   * Implements a fallback mechanism with retry logic for training content generation.
   * @param {string} module The module identifier
   * @param {number} attempts Number of retry attempts so far
   * @returns {string} Valid training content
   */
  async getFallbackWithRetry(module, attempts = 0) {
    if (attempts >= this.retryAttempts) {
      return this.assistant.getFallbackContent(module);
    }

    try {
      const content = await this.assistant.generateTrainingContent(module);
      return this.validateContent(content)
        ? content
        : this.getFallbackWithRetry(module, attempts + 1);
    } catch (error) {
      logger.warn(`Retry attempt ${attempts + 1} failed:`, error);
      return this.getFallbackWithRetry(module, attempts + 1);
    }
  }

  /**
   * Validates generated training content.
   * @param {string} content
   * @returns {boolean} True if content is valid.
   */
  validateContent(content) {
    return content &&
      content.length >= 100 &&
      content.includes('objectives') &&
      !content.includes('inappropriate');
  }

  /**
   * Generates hints for a given scenario.
   * @param {object} scenario
   * @returns {Promise<Array>} Array of hints.
   */
  async generateHints(scenario) {
    try {
      return await this.assistant.generateHints(scenario);
    } catch (error) {
      logger.error('Hint Generation Error:', error);
      return ['Generic hint available'];
    }
  }

  /**
   * Calculates a time estimate for completing a scenario.
   * @param {object} scenario
   * @returns {number} Time estimate in minutes.
   */
  calculateTimeEstimate(scenario) {
    const baseTime = 15; // base time in minutes
    const complexityFactor = scenario.complexity || 1;
    return Math.round(baseTime * complexityFactor);
  }

  /**
   * Formats and returns error responses.
   * @param {Error} error
   * @returns {object} Formatted error response.
   */
  handleError(error) {
    return {
      error: 'AI Processing Error',
      message: error.message,
      code: error.code || 'INTERNAL_ERROR'
    };
  }

  /**
   * Generates a personalized greeting for the user.
   * Example: "Welcome back, Commander. Let's resume our Mission..."
   * @param {object} req Express request
   * @param {object} res Express response
   */
  async generateGreeting(req, res) {
    try {
      // Use your assistant to generate a greeting.
      // Make sure to implement generateGreeting in your AIAssistant.
      const greeting = await this.assistant.generateGreeting(req.user);
      res.json({ greeting });
    } catch (error) {
      logger.error("Error generating greeting:", error);
      res.status(500).json({ greeting: "Welcome back, Commander. Let's resume our Mission!" });
    }
  }
}

module.exports = new AIController();
