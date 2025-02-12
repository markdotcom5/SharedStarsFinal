const Joi = require('joi');

// Define validation schemas
const schemas = {
  assessment: {
    start: Joi.object({
      mode: Joi.string().valid('full_guidance', 'basic', 'custom').default('full_guidance'),
    }),
    submit: Joi.object({
      sessionId: Joi.string().required(),
      questionIndex: Joi.number().required(),
      answer: Joi.string().required(),
    }),
    complete: Joi.object({
      sessionId: Joi.string().required(),
    }),
  },
  training: {
    startModule: Joi.object({
      moduleType: Joi.string().valid('physical', 'technical', 'simulation').required(),
      preferences: Joi.object({
        difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced').default('beginner'),
        pace: Joi.string().valid('normal', 'accelerated', 'relaxed').default('normal'),
      }).optional(),
    }),
    updateProgress: Joi.object({
      progress: Joi.number().min(0).max(100).required(),
      completedTasks: Joi.array().items(
        Joi.object({
          taskId: Joi.string().required(),
          name: Joi.string().required(),
          score: Joi.number().min(0).max(100).required(),
          completedAt: Joi.date().default(Date.now),
          duration: Joi.number().min(0).optional(),
          notes: Joi.string().optional(),
        })
      ).required(),
    }),
    completeModule: Joi.object({
      moduleId: Joi.string().required(),
      finalAssessment: Joi.object({
        overallScore: Joi.number().min(0).max(100).required(),
        feedback: Joi.string().optional(),
      }).required(),
    }),
  },
  ai: {
    initialize: Joi.object({
      mode: Joi.string().valid('full_guidance', 'basic', 'custom').required(),
      preferences: Joi.object({
        guidanceLevel: Joi.string().valid('detailed', 'concise').default('detailed'),
        focusAreas: Joi.array().items(Joi.string()).optional(),
      }).optional(),
    }),
    guidance: Joi.object({
      questionId: Joi.string().required(),
      currentProgress: Joi.number().min(0).max(100).required(),
      context: Joi.object({
        currentModule: Joi.string().optional(),
        lastActivity: Joi.string().optional(),
        difficultyConcerns: Joi.array().items(Joi.string()).optional(),
      }).optional(),
    }),
  },
};

// Middleware for validation by schema path
const validateRequestBySchemaPath = (schemaPath) => {
  return async (req, res, next) => {
    try {
      // Parse schema path and find the appropriate schema
      const [category, type] = schemaPath.split('.');
      const schema = schemas[category]?.[type];

      if (!schema) {
        console.error(`Schema not found for path: ${schemaPath}`);
        return res.status(500).json({
          error: 'Validation Schema Error',
          message: 'Invalid schema configuration',
        });
      }

      // Validate the request data against the schema
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      // If validation fails, return a detailed error response
      if (error) {
        const details = error.details.map((detail) => ({
          message: detail.message,
          path: detail.path,
          type: detail.type,
        }));

        return res.status(400).json({
          error: 'Validation Error',
          details,
          timestamp: new Date().toISOString(),
        });
      }

      // Attach validated data to the request object
      req.validatedData = value;

      next();
    } catch (err) {
      console.error('Validation middleware error:', err);
      res.status(500).json({
        error: 'Validation Processing Error',
        message: err.message,
        timestamp: new Date().toISOString(),
      });
    }
  };
};

module.exports = validateRequestBySchemaPath;
