const Joi = require('joi');

// Define validation schemas
const schemas = {
    assessment: {
        start: Joi.object({
            mode: Joi.string().valid('full_guidance', 'basic', 'custom').default('full_guidance')
        }),
        submit: Joi.object({
            sessionId: Joi.string().required(),
            questionIndex: Joi.number().required(), 
            answer: Joi.string().required()
        }),
        complete: Joi.object({
            sessionId: Joi.string().required()
        })
    },
    training: {
        startModule: Joi.object({
            moduleId: Joi.string().required(),
            preferences: Joi.object({
                difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced'),
                pace: Joi.string().valid('normal', 'accelerated', 'relaxed')
            }).optional()
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
                    notes: Joi.string().optional()
                })
            ).required()
        }),
        completeModule: Joi.object({
            moduleId: Joi.string().required(),
            finalAssessment: Joi.object({
                overallScore: Joi.number().min(0).max(100).required(),
                feedback: Joi.string().optional()
            }).required()
        })
    },
    ai: {
        initialize: Joi.object({
            mode: Joi.string().valid('full_guidance', 'basic', 'custom').required(),
            preferences: Joi.object({
                guidanceLevel: Joi.string().valid('detailed', 'concise').default('detailed'),
                focusAreas: Joi.array().items(Joi.string()).optional()
            }).optional()
        }),
        guidance: Joi.object({
            questionId: Joi.string().required(),
            currentProgress: Joi.number().min(0).max(100).required(),
            context: Joi.object({
                currentModule: Joi.string().optional(),
                lastActivity: Joi.string().optional(),
                difficultyConcerns: Joi.array().items(Joi.string()).optional()
            }).optional()
        })
    }
};

// Enhanced middleware creator with logging and detailed error reporting
const validateRequest = (schemaPath) => {
    return async (req, res, next) => {
        try {
            // Parse schema path
            const [category, type] = schemaPath.split('.');
            const schema = schemas[category]?.[type];

            if (!schema) {
                console.error(`Schema not found for path: ${schemaPath}`);
                return res.status(500).json({
                    error: 'Validation Schema Error',
                    message: 'Invalid schema configuration'
                });
            }

            // Log incoming request for testing
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Validation] ${req.method} ${req.path}`, {
                    body: req.body,
                    params: req.params,
                    query: req.query
                });
            }

            // Validate request
            const { error, value } = schema.validate(req.body, {
                abortEarly: false,
                stripUnknown: true
            });

            if (error) {
                const details = error.details.map(detail => ({
                    message: detail.message,
                    path: detail.path,
                    type: detail.type
                }));

                return res.status(400).json({
                    error: 'Validation Error',
                    details,
                    timestamp: new Date().toISOString()
                });
            }

            // Attach validated data to request
            req.validatedData = value;
            
            // Log successful validation in development
            if (process.env.NODE_ENV === 'development') {
                console.log(`[Validation Success] ${schemaPath}`, value);
            }

            next();
        } catch (err) {
            console.error('Validation middleware error:', err);
            res.status(500).json({
                error: 'Validation Processing Error',
                message: err.message,
                timestamp: new Date().toISOString()
            });
        }
    };
};

// Test helper function
validateRequest.testSchema = (schemaPath, data) => {
    const [category, type] = schemaPath.split('.');
    const schema = schemas[category]?.[type];
    
    if (!schema) {
        throw new Error(`Schema not found: ${schemaPath}`);
    }
    
    return schema.validate(data, {
        abortEarly: false,
        stripUnknown: true
    });
};

module.exports = validateRequest;